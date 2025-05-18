-- Ajouter une colonne status à la table api_configurations
ALTER TABLE api_configurations ADD COLUMN IF NOT EXISTS status VARCHAR(20);

-- Mettre à jour les valeurs existantes en fonction de is_valid
UPDATE api_configurations SET status = 
  CASE 
    WHEN is_valid = true THEN 'valid'
    WHEN is_valid = false THEN 'invalid'
    ELSE 'unknown'
  END
WHERE status IS NULL;

-- Ajouter un index sur la colonne status pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_api_configurations_status ON api_configurations(status);

-- Ajouter une contrainte de validation pour limiter les valeurs possibles
ALTER TABLE api_configurations ADD CONSTRAINT check_status_values 
  CHECK (status IN ('valid', 'invalid', 'unknown'));
