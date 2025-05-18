-- Script SQL pour corriger les problèmes de suppression d'images dans Supabase

-- 0. Vérifier quelles tables existent réellement dans la base de données
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('generated_images', 'images');

-- 1. Vérifier les politiques RLS actuelles sur la table generated_images
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'generated_images';

-- 2. Supprimer toutes les politiques RLS existantes pour generated_images
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres images générées" ON generated_images;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres images générées" ON generated_images;
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres images générées" ON generated_images;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres images générées" ON generated_images;

-- 3. Recréer les politiques RLS avec des permissions correctes
CREATE POLICY "Les utilisateurs peuvent voir leurs propres images générées"
  ON generated_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres images générées"
  ON generated_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres images générées"
  ON generated_images FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres images générées"
  ON generated_images FOR DELETE
  USING (auth.uid() = user_id);

-- Vérifier si la table images existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'images'
  ) THEN
    -- 4. Vérifier les politiques RLS sur la table images
    PERFORM 1 FROM pg_policies WHERE tablename = 'images';

    -- 5. Supprimer toutes les politiques RLS existantes pour images
    DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres images" ON images;
    DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des entrées pour leurs propres images" ON images;
    DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres images" ON images;

    -- 6. Recréer les politiques RLS pour images, y compris une politique de suppression
    CREATE POLICY "Les utilisateurs peuvent voir leurs propres images"
      ON images FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM generated_images
        WHERE generated_images.id = images.generation_id
        AND generated_images.user_id = auth.uid()
      ));

    -- Politique pour les insertions - utiliser une syntaxe différente pour éviter les problèmes avec NEW
    CREATE POLICY "Les utilisateurs peuvent créer des entrées pour leurs propres images"
      ON images FOR INSERT
      WITH CHECK (
        (SELECT user_id FROM generated_images WHERE id = generation_id) = auth.uid()
      );

    CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres images"
      ON images FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM generated_images
        WHERE generated_images.id = images.generation_id
        AND generated_images.user_id = auth.uid()
      ));

    -- 7. Vérifier que la contrainte ON DELETE CASCADE existe entre generated_images et images
    -- Cette requête est commentée car elle peut échouer si la table images n'existe pas
    /*
    SELECT
      tc.table_schema,
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_schema AS foreign_table_schema,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM
      information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'images'
      AND kcu.column_name = 'generation_id';
    */

    -- 8. Si la contrainte n'existe pas ou n'a pas ON DELETE CASCADE, la recréer
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.referential_constraints
      WHERE constraint_name = 'images_generation_id_fkey'
      AND delete_rule = 'CASCADE'
    ) THEN
      -- Supprimer la contrainte existante si elle existe
      ALTER TABLE images DROP CONSTRAINT IF EXISTS images_generation_id_fkey;

      -- Recréer la contrainte avec ON DELETE CASCADE
      ALTER TABLE images
      ADD CONSTRAINT images_generation_id_fkey
      FOREIGN KEY (generation_id)
      REFERENCES generated_images(id)
      ON DELETE CASCADE;
    END IF;

    -- 9. Supprimer toutes les images orphelines (sans entrée correspondante dans generated_images)
    DELETE FROM images
    WHERE NOT EXISTS (
      SELECT 1 FROM generated_images
      WHERE generated_images.id = images.generation_id
    );

    -- 10. Vérifier si des images ont été supprimées mais sont toujours dans la base de données
    PERFORM COUNT(*) FROM images
    WHERE NOT EXISTS (
      SELECT 1 FROM generated_images
      WHERE generated_images.id = images.generation_id
    );
  ELSE
    RAISE NOTICE 'La table "images" n''existe pas dans la base de données. Création de la table...';

    -- Créer la table images si elle n'existe pas
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

    -- Créer les politiques RLS pour la nouvelle table
    CREATE POLICY "Les utilisateurs peuvent voir leurs propres images"
      ON images FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM generated_images
        WHERE generated_images.id = images.generation_id
        AND generated_images.user_id = auth.uid()
      ));

    -- Politique pour les insertions - utiliser une syntaxe différente pour éviter les problèmes avec NEW
    CREATE POLICY "Les utilisateurs peuvent créer des entrées pour leurs propres images"
      ON images FOR INSERT
      WITH CHECK (
        (SELECT user_id FROM generated_images WHERE id = generation_id) = auth.uid()
      );

    CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres images"
      ON images FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM generated_images
        WHERE generated_images.id = images.generation_id
        AND generated_images.user_id = auth.uid()
      ));

    -- Migrer les données existantes de generated_images vers images
    INSERT INTO images (generation_id, url)
    SELECT id, image_url
    FROM generated_images
    WHERE NOT EXISTS (
      SELECT 1 FROM images WHERE generation_id = generated_images.id
    );

    RAISE NOTICE 'Table "images" créée avec succès et données migrées.';
  END IF;
END
$$;
