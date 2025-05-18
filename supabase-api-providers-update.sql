-- Script SQL pour mettre à jour la table api_providers
-- Ce script ajoute la colonne api_base_url si elle n'existe pas déjà
-- et met à jour les valeurs par défaut pour les fournisseurs existants

-- Vérifier si la colonne api_base_url existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'api_providers'
        AND column_name = 'api_base_url'
    ) THEN
        -- Ajouter la colonne api_base_url
        ALTER TABLE api_providers ADD COLUMN api_base_url TEXT;
        
        -- Ajouter un commentaire à la colonne
        COMMENT ON COLUMN api_providers.api_base_url IS 'URL de base de l''API du fournisseur';
        
        RAISE NOTICE 'Colonne api_base_url ajoutée à la table api_providers';
    ELSE
        RAISE NOTICE 'La colonne api_base_url existe déjà dans la table api_providers';
    END IF;
END
$$;

-- Mettre à jour les URL d'API pour les fournisseurs existants
UPDATE api_providers
SET api_base_url = 'https://api.openai.com/v1'
WHERE slug = 'openai' AND (api_base_url IS NULL OR api_base_url = '');

UPDATE api_providers
SET api_base_url = 'https://generativelanguage.googleapis.com/v1'
WHERE slug IN ('google', 'gemini') AND (api_base_url IS NULL OR api_base_url = '');

UPDATE api_providers
SET api_base_url = 'https://api.x.ai/v1'
WHERE slug = 'xai' AND (api_base_url IS NULL OR api_base_url = '');

-- Vérifier les mises à jour
SELECT id, name, slug, api_base_url FROM api_providers;

-- Ajouter une contrainte NOT NULL si nécessaire (optionnel)
-- ALTER TABLE api_providers ALTER COLUMN api_base_url SET NOT NULL;
