-- Création des tables pour Bambi AI

-- Table des fournisseurs d'API
CREATE TABLE api_providers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des configurations API des utilisateurs
CREATE TABLE api_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id INTEGER NOT NULL REFERENCES api_providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  model TEXT,
  is_valid BOOLEAN DEFAULT TRUE,
  last_validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des abonnements utilisateurs
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  price_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table des quotas utilisateurs
CREATE TABLE user_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_generations_used INTEGER DEFAULT 0,
  monthly_generations_limit INTEGER DEFAULT 50,
  reset_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table des images générées
CREATE TABLE generated_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  configuration_id UUID REFERENCES api_configurations(id) ON DELETE SET NULL,
  provider_id INTEGER REFERENCES api_providers(id) ON DELETE SET NULL,
  model TEXT,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertion des fournisseurs d'API par défaut
INSERT INTO api_providers (name, slug, description, website_url, logo_url) VALUES
('OpenAI', 'openai', 'DALL·E 3 et autres modèles de génération d''images', 'https://openai.com', '/providers/openai.svg'),
('Stability AI', 'stability', 'Stable Diffusion et autres modèles de génération d''images', 'https://stability.ai', '/providers/stability.svg'),
('Midjourney', 'midjourney', 'Service de génération d''images IA via API', 'https://midjourney.com', '/providers/midjourney.svg'),
('Google', 'google', 'Imagen et autres modèles de génération d''images', 'https://cloud.google.com', '/providers/google.svg'),
('Hugging Face', 'huggingface', 'Modèles open-source de génération d''images', 'https://huggingface.co', '/providers/huggingface.svg');

-- Création des politiques RLS (Row Level Security)

-- Activer RLS sur toutes les tables
ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- Politiques pour api_configurations
CREATE POLICY "Les utilisateurs peuvent voir leurs propres configurations API"
  ON api_configurations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres configurations API"
  ON api_configurations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres configurations API"
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

-- Fonction pour créer automatiquement un quota utilisateur à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_quotas (user_id, monthly_generations_limit, reset_date)
  VALUES (NEW.id, 50, (NOW() + INTERVAL '1 month'));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour appeler la fonction à chaque nouvel utilisateur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
