# Guide de dépannage pour le système BYOK de Bambi AI

Ce guide vous aidera à résoudre les problèmes courants liés au système BYOK (Bring Your Own Key) de Bambi AI.

## Problème : Les configurations API disparaissent après déconnexion/reconnexion

Si vos configurations API disparaissent après vous être déconnecté puis reconnecté, suivez ces étapes :

### 1. Vérifier les politiques RLS dans Supabase

Les politiques RLS (Row Level Security) de Supabase doivent être correctement configurées pour permettre aux utilisateurs d'accéder uniquement à leurs propres configurations.

Exécutez le script SQL fourni (`supabase-rls-policies.sql`) dans la console SQL de Supabase pour mettre à jour les politiques RLS :

```sql
-- Voir le fichier supabase-rls-policies.sql pour le script complet
```

### 2. Vérifier la structure de la table api_configurations

Assurez-vous que la table `api_configurations` a la structure suivante :

- `id` : UUID (clé primaire)
- `user_id` : UUID (NOT NULL, référence à auth.users)
- `name` : TEXT (NOT NULL)
- `provider_id` : INTEGER (NOT NULL, référence à api_providers)
- `api_key` : TEXT (NOT NULL)
- `model` : TEXT
- `is_valid` : BOOLEAN (DEFAULT false)
- `status` : TEXT (DEFAULT 'unknown')
- `last_validated_at` : TIMESTAMP WITH TIME ZONE
- `created_at` : TIMESTAMP WITH TIME ZONE (DEFAULT now())

### 3. Vérifier les logs de l'application

Les logs de l'application contiennent des informations détaillées sur les erreurs qui peuvent survenir lors de l'ajout, de la mise à jour ou de la suppression des configurations API.

Recherchez les messages d'erreur suivants dans la console du navigateur :
- "Erreur de permission RLS"
- "Incohérence d'ID utilisateur"
- "user_id invalide"

### 4. Vérifier la session utilisateur

Si vous rencontrez des problèmes de session, essayez de vous déconnecter complètement, de vider le cache du navigateur, puis de vous reconnecter.

### 5. Vérifier les configurations en attente

Si des configurations sont en attente de synchronisation, elles seront automatiquement synchronisées lors de la prochaine connexion réussie. Vous pouvez forcer la synchronisation en appelant la fonction `syncPendingConfigs()`.

## Problème : Isolation des données entre comptes

Si vous constatez que les configurations d'un compte sont visibles dans un autre compte, c'est probablement dû à un problème d'isolation des données dans le stockage local.

### Solution

1. Assurez-vous que la fonction `clearLocalStorageForUser` est appelée lors de la déconnexion
2. Vérifiez que les politiques RLS sont correctement configurées
3. Vérifiez que les données du localStorage sont correctement isolées par utilisateur

## Problème : Erreurs de validation des clés API

Si vous rencontrez des erreurs lors de la validation des clés API, vérifiez les points suivants :

1. La clé API est-elle correcte et active ?
2. Le fournisseur d'API est-il disponible ?
3. Les paramètres de validation sont-ils corrects ?

## Support

Si vous continuez à rencontrer des problèmes après avoir suivi ce guide, contactez l'équipe de support de Bambi AI.
