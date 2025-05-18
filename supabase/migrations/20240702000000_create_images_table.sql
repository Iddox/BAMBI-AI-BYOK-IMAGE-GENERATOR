-- Création de la table Images pour stocker les informations détaillées sur les images générées
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id UUID NOT NULL REFERENCES generated_images(id) ON DELETE CASCADE,
  storage_path TEXT,
  url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  format TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS sur la table images
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leurs propres images
CREATE POLICY "Les utilisateurs peuvent voir leurs propres images"
  ON images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM generated_images
    WHERE generated_images.id = images.generation_id
    AND generated_images.user_id = auth.uid()
  ));

-- Politique pour permettre aux utilisateurs de créer des entrées pour leurs propres images
CREATE POLICY "Les utilisateurs peuvent créer des entrées pour leurs propres images"
  ON images FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM generated_images
    WHERE generated_images.id = NEW.generation_id
    AND generated_images.user_id = auth.uid()
  ));

-- Fonction pour migrer les données existantes de generated_images vers images
CREATE OR REPLACE FUNCTION migrate_generated_images_to_images()
RETURNS void AS $$
BEGIN
  -- Insérer les données existantes de generated_images dans images
  INSERT INTO images (generation_id, url)
  SELECT id, image_url
  FROM generated_images
  WHERE NOT EXISTS (
    SELECT 1 FROM images WHERE generation_id = generated_images.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exécuter la fonction de migration
SELECT migrate_generated_images_to_images();

-- Supprimer la fonction de migration après utilisation
DROP FUNCTION migrate_generated_images_to_images();
