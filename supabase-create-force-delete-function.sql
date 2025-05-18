-- Création d'une fonction SQL pour forcer la suppression d'une image
-- Cette fonction supprime directement les entrées dans la table generated_images
-- et vérifie d'abord si la table images existe

-- Supprimer la fonction si elle existe déjà
DROP FUNCTION IF EXISTS force_delete_image(uuid);

-- Créer la fonction
CREATE OR REPLACE FUNCTION force_delete_image(image_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Exécutée avec les privilèges du créateur
AS $$
DECLARE
  user_owns_image boolean;
  images_table_exists boolean;
BEGIN
  -- Vérifier que l'utilisateur est propriétaire de l'image
  SELECT EXISTS (
    SELECT 1 FROM generated_images
    WHERE id = image_id
    AND user_id = auth.uid()
  ) INTO user_owns_image;

  -- Si l'utilisateur n'est pas propriétaire, sortir
  IF NOT user_owns_image THEN
    RAISE EXCEPTION 'Vous n''êtes pas autorisé à supprimer cette image';
    RETURN;
  END IF;

  -- Vérifier si la table images existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'images'
  ) INTO images_table_exists;

  -- Supprimer d'abord les entrées dans la table images si elle existe
  IF images_table_exists THEN
    DELETE FROM images
    WHERE generation_id = image_id;
  END IF;

  -- Ensuite, supprimer l'entrée dans generated_images
  DELETE FROM generated_images
  WHERE id = image_id
  AND user_id = auth.uid();
END;
$$;

-- Accorder les privilèges d'exécution à tous les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION force_delete_image(uuid) TO authenticated;

-- Commentaire sur la fonction
COMMENT ON FUNCTION force_delete_image(uuid) IS 'Force la suppression d''une image et de toutes ses entrées associées, après vérification que l''utilisateur est bien le propriétaire';
