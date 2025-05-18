-- Création de la table Models pour stocker les informations sur les modèles disponibles
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id INTEGER NOT NULL REFERENCES api_providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  description TEXT,
  capabilities JSONB DEFAULT '{}'::JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS sur la table models
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre à tous les utilisateurs authentifiés de voir les modèles
CREATE POLICY "Les utilisateurs authentifiés peuvent voir les modèles"
  ON models FOR SELECT
  USING (auth.role() = 'authenticated');

-- Fonction pour mettre à jour le timestamp
CREATE OR REPLACE FUNCTION update_models_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le timestamp lors des mises à jour
CREATE TRIGGER update_models_timestamp
BEFORE UPDATE ON models
FOR EACH ROW EXECUTE FUNCTION update_models_timestamp();

-- Insertion des modèles par défaut
INSERT INTO models (provider_id, name, model_id, description, capabilities)
VALUES
  -- OpenAI
  ((SELECT id FROM api_providers WHERE slug = 'openai'), 'DALL-E 3', 'dall-e-3', 'Dernière version de DALL-E avec une qualité d''image supérieure', '{"max_resolution": "1024x1024", "formats": ["png", "jpg"]}'::jsonb),
  ((SELECT id FROM api_providers WHERE slug = 'openai'), 'DALL-E 2', 'dall-e-2', 'Version précédente de DALL-E', '{"max_resolution": "1024x1024", "formats": ["png"]}'::jsonb),
  
  -- Stability AI
  ((SELECT id FROM api_providers WHERE slug = 'stability'), 'Stable Diffusion XL', 'stable-diffusion-xl', 'Version améliorée de Stable Diffusion', '{"max_resolution": "1024x1024", "formats": ["png", "jpg"]}'::jsonb),
  ((SELECT id FROM api_providers WHERE slug = 'stability'), 'Stable Diffusion 2', 'stable-diffusion-2', 'Version standard de Stable Diffusion', '{"max_resolution": "768x768", "formats": ["png", "jpg"]}'::jsonb),
  
  -- Midjourney
  ((SELECT id FROM api_providers WHERE slug = 'midjourney'), 'Midjourney v5', 'midjourney-v5', 'Dernière version de Midjourney', '{"max_resolution": "1024x1024", "formats": ["png", "jpg"]}'::jsonb),
  
  -- Google
  ((SELECT id FROM api_providers WHERE slug = 'google'), 'Imagen', 'imagen', 'Google Imagen sur Vertex AI', '{"max_resolution": "1024x1024", "formats": ["png", "jpg"]}'::jsonb),
  
  -- Hugging Face
  ((SELECT id FROM api_providers WHERE slug = 'huggingface'), 'Stable Diffusion', 'stable-diffusion', 'Modèle open-source de génération d''images', '{"max_resolution": "512x512", "formats": ["png"]}'::jsonb),
  
  -- xAI
  ((SELECT id FROM api_providers WHERE slug = 'xai'), 'Grok', 'grok', 'Modèle de génération d''images de xAI', '{"max_resolution": "1024x1024", "formats": ["png", "jpg"]}'::jsonb);

-- Mise à jour de la table generated_images pour référencer la table models
ALTER TABLE generated_images ADD COLUMN IF NOT EXISTS model_id UUID REFERENCES models(id) ON DELETE SET NULL;
