-- Politiques RLS pour la table api_configurations
-- Ces politiques garantissent que chaque utilisateur ne peut voir et modifier que ses propres configurations

-- Supprimer les politiques existantes pour repartir de zéro
DROP POLICY IF EXISTS "Utilisateurs peuvent voir leurs propres configurations" ON api_configurations;
DROP POLICY IF EXISTS "Utilisateurs peuvent insérer leurs propres configurations" ON api_configurations;
DROP POLICY IF EXISTS "Utilisateurs peuvent mettre à jour leurs propres configurations" ON api_configurations;
DROP POLICY IF EXISTS "Utilisateurs peuvent supprimer leurs propres configurations" ON api_configurations;

-- Activer RLS sur la table api_configurations
ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;

-- Politique pour la lecture (SELECT)
CREATE POLICY "Utilisateurs peuvent voir leurs propres configurations"
ON api_configurations
FOR SELECT
USING (auth.uid() = user_id);

-- Politique pour l'insertion (INSERT)
CREATE POLICY "Utilisateurs peuvent insérer leurs propres configurations"
ON api_configurations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Politique pour la mise à jour (UPDATE)
CREATE POLICY "Utilisateurs peuvent mettre à jour leurs propres configurations"
ON api_configurations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Politique pour la suppression (DELETE)
CREATE POLICY "Utilisateurs peuvent supprimer leurs propres configurations"
ON api_configurations
FOR DELETE
USING (auth.uid() = user_id);

-- Vérifier que la colonne user_id est bien de type UUID
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'api_configurations'
        AND column_name = 'user_id'
        AND data_type = 'uuid'
    ) THEN
        RAISE NOTICE 'Attention: La colonne user_id de la table api_configurations n''est pas de type UUID. Cela peut causer des problèmes avec les politiques RLS.';
    END IF;
END
$$;

-- Ajouter un index sur user_id pour améliorer les performances des requêtes filtrées par utilisateur
CREATE INDEX IF NOT EXISTS idx_api_configurations_user_id ON api_configurations(user_id);

-- Ajouter une contrainte NOT NULL sur user_id pour éviter les configurations sans propriétaire
ALTER TABLE api_configurations ALTER COLUMN user_id SET NOT NULL;

-- Ajouter une contrainte de clé étrangère vers la table auth.users si elle n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_api_configurations_user_id'
        AND table_name = 'api_configurations'
    ) THEN
        ALTER TABLE api_configurations
        ADD CONSTRAINT fk_api_configurations_user_id
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Impossible d''ajouter la contrainte de clé étrangère: %', SQLERRM;
END
$$;
