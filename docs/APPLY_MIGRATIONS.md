# Guide d'application des migrations Supabase

Ce document explique comment appliquer les migrations SQL à votre base de données Supabase pour le projet Bambi AI.

## Prérequis

1. Assurez-vous d'avoir configuré les variables d'environnement dans le fichier `.env.local` :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=votre-clé-service
   ```

2. Assurez-vous d'avoir installé les dépendances du projet :
   ```bash
   npm install
   ```

## Méthode 1 : Utilisation de l'interface SQL de Supabase (recommandée pour la première migration)

1. Connectez-vous à votre [dashboard Supabase](https://app.supabase.io)
2. Sélectionnez votre projet
3. Allez dans "SQL Editor"
4. Créez une nouvelle requête
5. Copiez et collez le contenu du fichier `supabase/migrations/20240700000000_create_exec_sql_function.sql`
6. Exécutez la requête

Cette étape est nécessaire pour créer la fonction `exec_sql` qui sera utilisée par les scripts de migration.

## Méthode 2 : Utilisation du script de migration

Une fois la fonction `exec_sql` créée, vous pouvez utiliser le script de migration pour appliquer toutes les migrations :

```bash
node scripts/apply-migrations.js
```

Ce script exécutera tous les fichiers SQL dans le dossier `supabase/migrations` dans l'ordre alphabétique.

## Méthode 3 : Application d'une migration spécifique

Si vous souhaitez appliquer une migration spécifique, utilisez le script `apply-migration.js` :

```bash
node scripts/apply-migration.js 20240701000000_create_models_table.sql
```

## Ordre des migrations

Les migrations sont appliquées dans l'ordre alphabétique des noms de fichiers. C'est pourquoi nous utilisons un format de nommage avec date et heure (YYYYMMDDHHMMSS) pour garantir l'ordre correct.

## Résolution des problèmes

### Erreur "Could not find the function public.exec_sql(sql)"

Cette erreur se produit lorsque la fonction `exec_sql` n'existe pas dans votre base de données. Pour résoudre ce problème :

1. Appliquez manuellement la migration `20240700000000_create_exec_sql_function.sql` via l'interface SQL de Supabase
2. Réessayez d'exécuter le script de migration

### Erreur "Permission denied"

Cette erreur peut se produire si la clé de service Supabase n'a pas les permissions nécessaires. Assurez-vous d'utiliser la clé de service (service_role) et non la clé anon.

### Erreur "Syntax error"

Vérifiez la syntaxe SQL dans vos fichiers de migration. Vous pouvez tester chaque fichier individuellement via l'interface SQL de Supabase.
