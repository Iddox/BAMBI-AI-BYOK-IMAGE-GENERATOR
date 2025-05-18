-- Compléter les politiques RLS manquantes pour toutes les tables

-- Vérifier et ajouter des politiques manquantes pour user_subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_subscriptions' AND policyname = 'Les utilisateurs peuvent mettre à jour leurs propres abonnements'
  ) THEN
    CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres abonnements"
      ON user_subscriptions FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_subscriptions' AND policyname = 'Les utilisateurs peuvent créer leurs propres abonnements'
  ) THEN
    CREATE POLICY "Les utilisateurs peuvent créer leurs propres abonnements"
      ON user_subscriptions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Vérifier et ajouter des politiques manquantes pour user_quotas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_quotas' AND policyname = 'Les utilisateurs peuvent mettre à jour leurs propres quotas'
  ) THEN
    CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres quotas"
      ON user_quotas FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_quotas' AND policyname = 'Les utilisateurs peuvent créer leurs propres quotas'
  ) THEN
    CREATE POLICY "Les utilisateurs peuvent créer leurs propres quotas"
      ON user_quotas FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Vérifier et ajouter des politiques manquantes pour generated_images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'generated_images' AND policyname = 'Les utilisateurs peuvent mettre à jour leurs propres images générées'
  ) THEN
    CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres images générées"
      ON generated_images FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'generated_images' AND policyname = 'Les utilisateurs peuvent supprimer leurs propres images générées'
  ) THEN
    CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres images générées"
      ON generated_images FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Ajouter une politique pour permettre aux administrateurs de voir toutes les données
-- Note: Cette politique est commentée car elle nécessite une implémentation de rôles d'administrateur
/*
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'api_providers' AND policyname = 'Les administrateurs peuvent gérer les fournisseurs API'
  ) THEN
    CREATE POLICY "Les administrateurs peuvent gérer les fournisseurs API"
      ON api_providers
      USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END
$$;
*/
