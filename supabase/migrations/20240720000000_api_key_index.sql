-- Migration pour ajouter un commentaire et un index à la colonne api_key
COMMENT ON COLUMN api_configurations.api_key IS 'Clé API chiffrée avec AES-256';
CREATE INDEX IF NOT EXISTS idx_api_configurations_api_key ON api_configurations(api_key);
