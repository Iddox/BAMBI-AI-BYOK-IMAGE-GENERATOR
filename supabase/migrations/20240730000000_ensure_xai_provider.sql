-- S'assurer que xAI existe dans la table api_providers
INSERT INTO api_providers (name, slug, description, website_url, logo_url)
SELECT 'xAI', 'xai', 'Grok et autres modèles de génération d''images innovants', 'https://x.ai', '/providers/xai.svg'
WHERE NOT EXISTS (SELECT 1 FROM api_providers WHERE slug = 'xai');

-- Ajouter également le modèle Grok-2-image s'il n'existe pas déjà
INSERT INTO models (provider_id, name, model_id, description, capabilities)
SELECT 
  (SELECT id FROM api_providers WHERE slug = 'xai'),
  'Grok-2-image',
  'grok-2-image',
  'Modèle de génération d''images de xAI, version 2',
  '{"max_resolution": "1024x1024", "formats": ["png", "jpg"]}'::jsonb
WHERE EXISTS (SELECT 1 FROM api_providers WHERE slug = 'xai')
AND NOT EXISTS (SELECT 1 FROM models WHERE model_id = 'grok-2-image');

-- Mettre à jour l'URL de base de l'API pour xAI si nécessaire
UPDATE api_providers
SET api_base_url = 'https://api.x.ai/v1'
WHERE slug = 'xai' AND (api_base_url IS NULL OR api_base_url = '');
