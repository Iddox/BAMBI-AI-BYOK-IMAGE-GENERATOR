-- Migration pour mettre à jour le modèle xAI avec le nom correct
DO $$
BEGIN
    -- Vérifier si le modèle xAI existe déjà
    IF EXISTS (
        SELECT 1
        FROM models m
        JOIN api_providers p ON m.provider_id = p.id
        WHERE p.slug = 'xai' AND m.model_id = 'grok-2-image'
    ) THEN
        -- Mettre à jour le modèle existant
        UPDATE models
        SET 
            model_id = 'grok-2-image-1212',
            name = 'Grok-2-image-1212',
            description = 'Modèle de génération d''images de xAI, version 2-1212',
            capabilities = '{"max_resolution": "1024x1024", "formats": ["jpeg"], "supportsHD": false, "supportedAspectRatios": ["1:1"]}'::jsonb,
            updated_at = NOW()
        FROM api_providers
        WHERE models.provider_id = api_providers.id
        AND api_providers.slug = 'xai'
        AND models.model_id = 'grok-2-image';
        
        RAISE NOTICE 'Modèle xAI mis à jour avec le nom correct grok-2-image-1212';
    ELSE
        -- Vérifier si le modèle avec le nouveau nom existe déjà
        IF NOT EXISTS (
            SELECT 1
            FROM models m
            JOIN api_providers p ON m.provider_id = p.id
            WHERE p.slug = 'xai' AND m.model_id = 'grok-2-image-1212'
        ) THEN
            -- Insérer le modèle avec le nom correct
            INSERT INTO models (provider_id, name, model_id, description, capabilities, created_at, updated_at)
            SELECT 
                p.id,
                'Grok-2-image-1212',
                'grok-2-image-1212',
                'Modèle de génération d''images de xAI, version 2-1212',
                '{"max_resolution": "1024x1024", "formats": ["jpeg"], "supportsHD": false, "supportedAspectRatios": ["1:1"]}'::jsonb,
                NOW(),
                NOW()
            FROM api_providers p
            WHERE p.slug = 'xai';
            
            RAISE NOTICE 'Nouveau modèle xAI grok-2-image-1212 ajouté';
        ELSE
            RAISE NOTICE 'Le modèle xAI grok-2-image-1212 existe déjà';
        END IF;
    END IF;
END $$;
