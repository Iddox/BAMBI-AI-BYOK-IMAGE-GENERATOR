-- Fonction pour mettre à jour les quotas utilisateurs
CREATE OR REPLACE FUNCTION update_user_quota()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrémenter le compteur de générations utilisées
  UPDATE user_quotas
  SET monthly_generations_used = monthly_generations_used + 1,
      updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour appeler la fonction à chaque nouvelle image générée
DROP TRIGGER IF EXISTS on_image_generated ON generated_images;
CREATE TRIGGER on_image_generated
  AFTER INSERT ON generated_images
  FOR EACH ROW EXECUTE FUNCTION update_user_quota();

-- Fonction pour réinitialiser les quotas mensuels
CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS void AS $$
BEGIN
  UPDATE user_quotas
  SET monthly_generations_used = 0,
      reset_date = (NOW() + INTERVAL '1 month'),
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur a dépassé son quota
CREATE OR REPLACE FUNCTION check_user_quota(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_quota BOOLEAN;
  is_premium BOOLEAN;
BEGIN
  -- Vérifier si l'utilisateur a un abonnement premium
  SELECT EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
  ) INTO is_premium;
  
  -- Si l'utilisateur est premium, il a toujours du quota disponible
  IF is_premium THEN
    RETURN TRUE;
  END IF;
  
  -- Sinon, vérifier le quota restant
  SELECT (monthly_generations_used < monthly_generations_limit)
  FROM user_quotas
  WHERE user_id = user_uuid
  INTO has_quota;
  
  RETURN COALESCE(has_quota, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
