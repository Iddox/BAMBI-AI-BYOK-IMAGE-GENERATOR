-- Script SQL pour déboguer les problèmes d'enregistrement et d'affichage des images générées

-- 1. Vérifier si la table generated_images existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'generated_images'
) AS generated_images_table_exists;

-- 2. Vérifier la structure de la table generated_images
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'generated_images'
ORDER BY ordinal_position;

-- 3. Vérifier si des images ont été enregistrées récemment (dernières 24 heures)
SELECT 
  id, 
  user_id, 
  prompt, 
  image_url, 
  configuration_id, 
  provider_id, 
  model, 
  created_at
FROM generated_images
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Vérifier les politiques RLS sur la table generated_images
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies
WHERE tablename = 'generated_images';

-- 5. Vérifier si l'utilisateur actuel a des images enregistrées
-- Remplacez 'votre_user_id' par votre ID utilisateur réel
-- SELECT COUNT(*) AS user_image_count
-- FROM generated_images
-- WHERE user_id = 'votre_user_id';

-- 6. Vérifier les triggers sur la table generated_images
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'generated_images'
AND trigger_schema = 'public';

-- 7. Vérifier si la table images existe et sa relation avec generated_images
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'images'
) AS images_table_exists;

-- 8. Vérifier la structure de la table images si elle existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'images'
ORDER BY ordinal_position;

-- 9. Vérifier si des entrées existent dans la table images
SELECT 
  id, 
  generation_id, 
  url, 
  created_at
FROM images
LIMIT 10;

-- 10. Vérifier les politiques RLS sur la table images
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies
WHERE tablename = 'images';

-- 11. Vérifier les quotas utilisateur
SELECT *
FROM user_quotas
LIMIT 10;

-- 12. Vérifier les configurations API
SELECT 
  id, 
  user_id, 
  name, 
  provider_id, 
  model, 
  is_valid, 
  last_validated_at
FROM api_configurations
LIMIT 10;

-- 13. Vérifier les fournisseurs API
SELECT *
FROM api_providers;

-- 14. Vérifier les modèles disponibles
SELECT *
FROM models;

-- 15. Vérifier l'utilisation de l'API
SELECT *
FROM api_usage
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;
