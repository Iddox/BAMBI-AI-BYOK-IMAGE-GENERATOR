-- Vérifier que RLS est activé pour toutes les tables
ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes pour les recréer
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres configurations API" ON api_configurations;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres configurations API" ON api_configurations;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs propres configurations API" ON api_configurations;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres configurations API" ON api_configurations;

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres abonnements" ON user_subscriptions;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres quotas" ON user_quotas;

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres images générées" ON generated_images;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres images générées" ON generated_images;

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres images" ON images;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des entrées pour leurs propres images" ON images;

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre utilisation API" ON api_usage;

-- Recréer les politiques avec des restrictions strictes
-- Politiques pour api_configurations
CREATE POLICY "Les utilisateurs peuvent voir leurs propres configurations API"
  ON api_configurations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres configurations API"
  ON api_configurations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs propres configurations API"
  ON api_configurations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres configurations API"
  ON api_configurations FOR DELETE
  USING (auth.uid() = user_id);

-- Politiques pour user_subscriptions
CREATE POLICY "Les utilisateurs peuvent voir leurs propres abonnements"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Politiques pour user_quotas
CREATE POLICY "Les utilisateurs peuvent voir leurs propres quotas"
  ON user_quotas FOR SELECT
  USING (auth.uid() = user_id);

-- Politiques pour generated_images
CREATE POLICY "Les utilisateurs peuvent voir leurs propres images générées"
  ON generated_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres images générées"
  ON generated_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politiques pour images
CREATE POLICY "Les utilisateurs peuvent voir leurs propres images"
  ON images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM generated_images
    WHERE generated_images.id = images.generation_id
    AND generated_images.user_id = auth.uid()
  ));

CREATE POLICY "Les utilisateurs peuvent créer des entrées pour leurs propres images"
  ON images FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM generated_images
    WHERE generated_images.id = NEW.generation_id
    AND generated_images.user_id = auth.uid()
  ));

-- Politiques pour api_usage
CREATE POLICY "Les utilisateurs peuvent voir leur propre utilisation API"
  ON api_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Vérifier et corriger la fonction de création de quotas utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si un quota existe déjà pour cet utilisateur
  IF NOT EXISTS (SELECT 1 FROM public.user_quotas WHERE user_id = NEW.id) THEN
    -- Créer un nouveau quota utilisateur
    INSERT INTO public.user_quotas (
      user_id, 
      monthly_generations_limit, 
      monthly_generations_used, 
      reset_date
    )
    VALUES (
      NEW.id, 
      50, -- Limite par défaut pour les utilisateurs gratuits
      0,  -- Compteur à zéro
      (NOW() + INTERVAL '1 month') -- Date de réinitialisation dans un mois
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- S'assurer que le trigger est correctement configuré
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
