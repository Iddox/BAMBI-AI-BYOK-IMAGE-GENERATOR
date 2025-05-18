-- Migration SQL pour créer les tables de collections et tags
-- Table des collections
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  cover_image_id UUID REFERENCES generated_images(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de jointure entre collections et images
CREATE TABLE IF NOT EXISTS collection_images (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  image_id UUID REFERENCES generated_images(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (collection_id, image_id)
);

-- Table des tags
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#7B5CFA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de jointure entre tags et images
CREATE TABLE IF NOT EXISTS image_tags (
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  image_id UUID REFERENCES generated_images(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (tag_id, image_id)
);

-- Table des favoris
CREATE TABLE IF NOT EXISTS favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES generated_images(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, image_id)
);

-- Activer RLS sur toutes les tables
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour collections
CREATE POLICY "Les utilisateurs peuvent voir leurs propres collections"
  ON collections FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs propres collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

-- Politiques RLS pour collection_images
CREATE POLICY "Les utilisateurs peuvent voir les images de leurs collections"
  ON collection_images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM collections
    WHERE collections.id = collection_images.collection_id
    AND (collections.user_id = auth.uid() OR collections.is_public = true)
  ));

CREATE POLICY "Les utilisateurs peuvent ajouter des images à leurs collections"
  ON collection_images FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM collections
    WHERE collections.id = NEW.collection_id
    AND collections.user_id = auth.uid()
  ));

CREATE POLICY "Les utilisateurs peuvent supprimer des images de leurs collections"
  ON collection_images FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM collections
    WHERE collections.id = collection_images.collection_id
    AND collections.user_id = auth.uid()
  ));

-- Politiques RLS pour tags
CREATE POLICY "Les utilisateurs peuvent voir leurs propres tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs propres tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

-- Politiques RLS pour image_tags
CREATE POLICY "Les utilisateurs peuvent voir les tags de leurs images"
  ON image_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tags
    WHERE tags.id = image_tags.tag_id
    AND tags.user_id = auth.uid()
  ));

CREATE POLICY "Les utilisateurs peuvent ajouter des tags à leurs images"
  ON image_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM tags
    WHERE tags.id = NEW.tag_id
    AND tags.user_id = auth.uid()
  ));

CREATE POLICY "Les utilisateurs peuvent supprimer des tags de leurs images"
  ON image_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM tags
    WHERE tags.id = image_tags.tag_id
    AND tags.user_id = auth.uid()
  ));

-- Politiques RLS pour favorites
CREATE POLICY "Les utilisateurs peuvent voir leurs propres favoris"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent ajouter des favoris"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres favoris"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_cover_image_id ON collections(cover_image_id);
CREATE INDEX IF NOT EXISTS idx_collection_images_collection_id ON collection_images(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_images_image_id ON collection_images(image_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_image_tags_tag_id ON image_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_image_tags_image_id ON image_tags(image_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_image_id ON favorites(image_id);
