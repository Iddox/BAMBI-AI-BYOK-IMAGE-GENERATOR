-- Mise à jour des descriptions des fournisseurs d'API existants
UPDATE api_providers 
SET description = 'DALL-E 3 et autres modèles de génération d''images de haute qualité'
WHERE slug = 'openai';

UPDATE api_providers 
SET description = 'Stable Diffusion et autres modèles de génération d''images personnalisables'
WHERE slug = 'stability';

UPDATE api_providers 
SET description = 'Service de génération d''images IA via API avec qualité artistique exceptionnelle'
WHERE slug = 'midjourney';

UPDATE api_providers 
SET description = 'Imagen et autres modèles de génération d''images avancés via Vertex AI'
WHERE slug = 'google';

UPDATE api_providers 
SET description = 'Modèles open-source de génération d''images avec grande flexibilité'
WHERE slug = 'huggingface';

-- Ajout de XAI (si non existant)
INSERT INTO api_providers (name, slug, description, website_url, logo_url)
SELECT 'xAI', 'xai', 'Grok et autres modèles de génération d''images innovants', 'https://x.ai', '/providers/xai.svg'
WHERE NOT EXISTS (SELECT 1 FROM api_providers WHERE slug = 'xai');
