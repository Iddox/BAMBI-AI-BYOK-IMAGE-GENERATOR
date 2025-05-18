-- Migration pour synchroniser les fournisseurs d'API entre le frontend et la base de données
-- Cette migration s'assure que tous les fournisseurs définis dans le frontend existent dans la table api_providers

-- Fonction pour ajouter un fournisseur s'il n'existe pas déjà
CREATE OR REPLACE FUNCTION ensure_provider_exists(
  p_name TEXT,
  p_slug TEXT,
  p_description TEXT,
  p_website_url TEXT,
  p_logo_url TEXT,
  p_api_base_url TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Vérifier si le fournisseur existe déjà
  IF NOT EXISTS (SELECT 1 FROM api_providers WHERE slug = p_slug) THEN
    -- Ajouter le fournisseur
    INSERT INTO api_providers (name, slug, description, website_url, logo_url, api_base_url)
    VALUES (p_name, p_slug, p_description, p_website_url, p_logo_url, p_api_base_url);
    
    RAISE NOTICE 'Fournisseur ajouté: %', p_name;
  ELSE
    -- Mettre à jour le fournisseur existant
    UPDATE api_providers
    SET 
      name = p_name,
      description = p_description,
      website_url = p_website_url,
      logo_url = p_logo_url,
      api_base_url = COALESCE(p_api_base_url, api_base_url)
    WHERE slug = p_slug;
    
    RAISE NOTICE 'Fournisseur mis à jour: %', p_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- S'assurer que tous les fournisseurs définis dans le frontend existent dans la base de données
SELECT ensure_provider_exists(
  'OpenAI',
  'openai',
  'Modèles DALL-E 3 et GPT Image 1 d''OpenAI',
  'https://openai.com',
  '/providers/openai.svg',
  'https://api.openai.com/v1'
);

SELECT ensure_provider_exists(
  'Google Gemini',
  'google',
  'Modèle Imagen 3 via l''API Gemini de Google',
  'https://cloud.google.com',
  '/providers/google.svg',
  'https://generativelanguage.googleapis.com/v1'
);

SELECT ensure_provider_exists(
  'xAI',
  'xai',
  'Modèle Grok-2-image de xAI',
  'https://x.ai',
  '/providers/xai.svg',
  'https://api.x.ai/v1'
);

-- Ajouter les modèles correspondants s'ils n'existent pas déjà
-- OpenAI - DALL-E 3
INSERT INTO models (provider_id, name, model_id, description, capabilities)
SELECT 
  (SELECT id FROM api_providers WHERE slug = 'openai'),
  'DALL·E 3',
  'dall-e-3',
  'Modèle de génération d''images le plus avancé d''OpenAI',
  '{"max_resolution": "1024x1024", "formats": ["png", "jpg"], "supportsHD": true, "supportedAspectRatios": ["1:1", "16:9", "9:16"]}'::jsonb
WHERE EXISTS (SELECT 1 FROM api_providers WHERE slug = 'openai')
AND NOT EXISTS (SELECT 1 FROM models WHERE model_id = 'dall-e-3');

-- OpenAI - GPT Image 1
INSERT INTO models (provider_id, name, model_id, description, capabilities)
SELECT 
  (SELECT id FROM api_providers WHERE slug = 'openai'),
  'GPT Image 1',
  'gpt-image-1',
  'Nouveau modèle de génération d''images basé sur GPT',
  '{"max_resolution": "1024x1024", "formats": ["png"], "supportsHD": true, "supportedAspectRatios": ["1:1", "16:9", "9:16"]}'::jsonb
WHERE EXISTS (SELECT 1 FROM api_providers WHERE slug = 'openai')
AND NOT EXISTS (SELECT 1 FROM models WHERE model_id = 'gpt-image-1');

-- Google - Imagen 3
INSERT INTO models (provider_id, name, model_id, description, capabilities)
SELECT 
  (SELECT id FROM api_providers WHERE slug = 'google'),
  'Imagen 3 (via Gemini)',
  'imagen-3',
  'Modèle de génération d''images de Google via l''API Gemini',
  '{"max_resolution": "1024x1024", "formats": ["png"], "supportsHD": false, "supportedAspectRatios": ["1:1", "16:9", "9:16", "3:4", "4:3"]}'::jsonb
WHERE EXISTS (SELECT 1 FROM api_providers WHERE slug = 'google')
AND NOT EXISTS (SELECT 1 FROM models WHERE model_id = 'imagen-3');

-- xAI - Grok-2-image
INSERT INTO models (provider_id, name, model_id, description, capabilities)
SELECT 
  (SELECT id FROM api_providers WHERE slug = 'xai'),
  'Grok-2-image',
  'grok-2-image',
  'Modèle de génération d''images de xAI',
  '{"max_resolution": "1024x1024", "formats": ["png"], "supportsHD": false, "supportedAspectRatios": ["1:1"]}'::jsonb
WHERE EXISTS (SELECT 1 FROM api_providers WHERE slug = 'xai')
AND NOT EXISTS (SELECT 1 FROM models WHERE model_id = 'grok-2-image');

-- Supprimer la fonction temporaire
DROP FUNCTION ensure_provider_exists;
