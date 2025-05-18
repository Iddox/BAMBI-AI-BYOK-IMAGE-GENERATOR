-- Script SQL pour mettre à jour la table generated_images
-- Ce script ajoute la colonne original_prompt si elle n'existe pas déjà

-- Vérifier si la colonne original_prompt existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'generated_images'
        AND column_name = 'original_prompt'
    ) THEN
        -- Ajouter la colonne original_prompt
        ALTER TABLE generated_images ADD COLUMN original_prompt TEXT;
        
        -- Ajouter un commentaire à la colonne
        COMMENT ON COLUMN generated_images.original_prompt IS 'Prompt original avant sanitisation';
        
        -- Initialiser la colonne avec la valeur de prompt pour les entrées existantes
        UPDATE generated_images SET original_prompt = prompt WHERE original_prompt IS NULL;
        
        RAISE NOTICE 'Colonne original_prompt ajoutée à la table generated_images';
    ELSE
        RAISE NOTICE 'La colonne original_prompt existe déjà dans la table generated_images';
    END IF;
END
$$;
