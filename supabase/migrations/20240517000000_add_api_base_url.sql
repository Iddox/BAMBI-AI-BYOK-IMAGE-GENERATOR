-- Migration pour ajouter la colonne api_base_url à la table api_providers si elle n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'api_providers'
        AND column_name = 'api_base_url'
    ) THEN
        ALTER TABLE api_providers ADD COLUMN api_base_url TEXT;
        
        -- Mettre à jour les fournisseurs existants avec leurs URL de base d'API
        UPDATE api_providers SET api_base_url = 'https://api.openai.com/v1' WHERE slug = 'openai';
        UPDATE api_providers SET api_base_url = 'https://generativelanguage.googleapis.com/v1' WHERE slug = 'google';
        UPDATE api_providers SET api_base_url = 'https://api.x.ai/v1' WHERE slug = 'xai';
        
        RAISE NOTICE 'Colonne api_base_url ajoutée à la table api_providers';
    ELSE
        RAISE NOTICE 'La colonne api_base_url existe déjà dans la table api_providers';
    END IF;
END $$;
