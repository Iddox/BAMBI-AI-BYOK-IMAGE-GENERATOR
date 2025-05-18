-- Script SQL pour corriger les problèmes potentiels avec l'enregistrement et l'affichage des images générées

-- 1. S'assurer que la table generated_images existe
CREATE TABLE IF NOT EXISTS generated_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  configuration_id UUID REFERENCES api_configurations(id) ON DELETE SET NULL,
  provider_id INTEGER REFERENCES api_providers(id) ON DELETE SET NULL,
  model TEXT,
  resolution TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. S'assurer que RLS est activé sur la table generated_images
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer les politiques RLS existantes pour éviter les conflits
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres images générées" ON generated_images;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres images générées" ON generated_images;
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres images générées" ON generated_images;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres images générées" ON generated_images;

-- 4. Recréer les politiques RLS avec des permissions correctes
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

-- 5. S'assurer que le trigger pour mettre à jour les quotas utilisateur existe
CREATE OR REPLACE FUNCTION update_user_quota()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrémenter le compteur de générations utilisées
  UPDATE user_quotas
  SET monthly_generations_used = monthly_generations_used + 1,
      updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_image_generated ON generated_images;

-- Recréer le trigger
CREATE TRIGGER on_image_generated
  AFTER INSERT ON generated_images
  FOR EACH ROW EXECUTE FUNCTION update_user_quota();

-- 6. S'assurer que le trigger pour enregistrer l'utilisation de l'API existe
CREATE OR REPLACE FUNCTION record_api_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer une entrée dans api_usage
  INSERT INTO api_usage (
    user_id,
    configuration_id,
    provider_id,
    model_id,
    request_type,
    period_start,
    period_end
  )
  VALUES (
    NEW.user_id,
    NEW.configuration_id,
    NEW.provider_id,
    NEW.model_id,
    'image_generation',
    date_trunc('month', NOW()),
    date_trunc('month', NOW()) + interval '1 month'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_image_generated_record_usage ON generated_images;

-- Recréer le trigger
CREATE TRIGGER on_image_generated_record_usage
  AFTER INSERT ON generated_images
  FOR EACH ROW EXECUTE FUNCTION record_api_usage();

-- 7. Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON generated_images(created_at);

-- 8. S'assurer que la table images existe et est correctement configurée
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

-- 9. S'assurer que RLS est activé sur la table images
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- 10. Supprimer les politiques RLS existantes pour éviter les conflits
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres images" ON images;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des entrées pour leurs propres images" ON images;

-- 11. Recréer les politiques RLS avec des permissions correctes
CREATE POLICY "Les utilisateurs peuvent voir leurs propres images"
  ON images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM generated_images
    WHERE generated_images.id = images.generation_id
    AND generated_images.user_id = auth.uid()
  ));

CREATE POLICY "Les utilisateurs peuvent créer des entrées pour leurs propres images"
  ON images FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM generated_images
    WHERE generated_images.id = NEW.generation_id
    AND generated_images.user_id = auth.uid()
  ));

-- 12. Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_images_generation_id ON images(generation_id);
