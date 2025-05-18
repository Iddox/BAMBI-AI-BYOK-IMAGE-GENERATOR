-- Création de la table API Usage pour suivre l'utilisation des API
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  configuration_id UUID REFERENCES api_configurations(id) ON DELETE SET NULL,
  provider_id INTEGER REFERENCES api_providers(id) ON DELETE SET NULL,
  model_id UUID REFERENCES models(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  tokens_used INTEGER,
  cost_estimate DECIMAL(10, 6),
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS sur la table api_usage
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leur propre utilisation d'API
CREATE POLICY "Les utilisateurs peuvent voir leur propre utilisation d'API"
  ON api_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Fonction pour mettre à jour le timestamp
CREATE OR REPLACE FUNCTION update_api_usage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le timestamp lors des mises à jour
CREATE TRIGGER update_api_usage_timestamp
BEFORE UPDATE ON api_usage
FOR EACH ROW EXECUTE FUNCTION update_api_usage_timestamp();

-- Fonction pour enregistrer l'utilisation de l'API lors de la génération d'une image
CREATE OR REPLACE FUNCTION record_api_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer une entrée dans api_usage
  INSERT INTO api_usage (
    user_id,
    configuration_id,
    provider_id,
    model_id,
    request_type,
    period_start,
    period_end
  )
  VALUES (
    NEW.user_id,
    NEW.configuration_id,
    NEW.provider_id,
    NEW.model_id,
    'image_generation',
    date_trunc('month', NOW()),
    date_trunc('month', NOW()) + interval '1 month'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour appeler la fonction à chaque nouvelle image générée
CREATE TRIGGER on_image_generated_record_usage
AFTER INSERT ON generated_images
FOR EACH ROW EXECUTE FUNCTION record_api_usage();
