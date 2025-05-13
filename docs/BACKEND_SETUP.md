# Guide de configuration du backend Bambi AI

Ce document détaille les étapes nécessaires pour configurer l'environnement backend de Bambi AI, y compris Supabase, Stripe et les variables d'environnement.

## Table des matières

1. [Configuration de Supabase](#configuration-de-supabase)
2. [Configuration de Stripe](#configuration-de-stripe)
3. [Variables d'environnement](#variables-denvironnement)
4. [Migrations de base de données](#migrations-de-base-de-données)
5. [Déploiement](#déploiement)

## Configuration de Supabase

### Création d'un projet

1. Créez un compte sur [Supabase](https://supabase.com/) si vous n'en avez pas déjà un
2. Créez un nouveau projet
3. Notez l'URL du projet et la clé anon (dans les paramètres du projet > API)
4. Notez également la clé de service (service_role) qui sera utilisée pour les migrations

### Configuration de l'authentification

1. Dans les paramètres du projet, allez dans "Authentication" > "Providers"
2. Activez "Email" et configurez selon vos besoins
3. Pour OAuth, activez les fournisseurs souhaités (Google, GitHub, etc.) et configurez les clés API correspondantes
4. Dans "URL Configuration", configurez les URL de redirection :
   - Site URL: `https://votre-domaine.com` (ou `http://localhost:3000` pour le développement)
   - Redirect URLs: `https://votre-domaine.com/api/auth/callback` (ou `http://localhost:3000/api/auth/callback` pour le développement)

## Configuration de Stripe

### Création d'un compte et configuration

1. Créez un compte sur [Stripe](https://stripe.com/) si vous n'en avez pas déjà un
2. Dans le tableau de bord, récupérez les clés API (publiable et secrète)
3. Créez un produit pour l'abonnement premium :
   - Allez dans "Produits" > "Ajouter un produit"
   - Nom : "Bambi AI Premium"
   - Prix : 5€/mois (ou selon votre stratégie de tarification)
   - Facturation : récurrente, mensuelle
   - Notez l'ID du prix (price_xxx...)

### Configuration des webhooks

1. Dans le tableau de bord Stripe, allez dans "Développeurs" > "Webhooks"
2. Ajoutez un endpoint : `https://votre-domaine.com/api/stripe/webhook`
3. Sélectionnez les événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Notez la clé secrète du webhook

Pour le développement local, utilisez [Stripe CLI](https://stripe.com/docs/stripe-cli) :

```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

## Variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
SUPABASE_SERVICE_ROLE_KEY=votre-clé-service

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=votre-clé-publiable
STRIPE_SECRET_KEY=votre-clé-secrète
STRIPE_WEBHOOK_SECRET=votre-clé-webhook
STRIPE_PREMIUM_PRICE_ID=price_xxxxx

# Sécurité
ENCRYPTION_KEY=votre-clé-de-32-caractères-pour-chiffrement

# Application
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
```

Pour le développement, vous pouvez utiliser le fichier `.env.development` qui est déjà configuré avec des valeurs par défaut.

## Migrations de base de données

Les migrations SQL sont stockées dans le dossier `supabase/migrations`. Pour les appliquer :

```bash
npm run apply-migrations
```

Cette commande exécutera tous les fichiers SQL dans le dossier des migrations, dans l'ordre alphabétique.

## Déploiement

### Déploiement sur Vercel

1. Créez un compte sur [Vercel](https://vercel.com/) si vous n'en avez pas déjà un
2. Importez votre projet depuis GitHub
3. Configurez les variables d'environnement dans les paramètres du projet
4. Déployez le projet

### Configuration des webhooks en production

1. Mettez à jour l'URL du webhook Stripe avec l'URL de production
2. Mettez à jour les URL de redirection OAuth dans Supabase avec l'URL de production

## Dépannage

### Problèmes courants

1. **Erreur d'authentification** : Vérifiez que les URL de redirection sont correctement configurées dans Supabase
2. **Erreur de webhook Stripe** : Vérifiez que la clé secrète du webhook est correcte et que les événements sont bien sélectionnés
3. **Erreur de migration** : Vérifiez que la clé de service Supabase est correcte et que les fichiers SQL sont valides

### Logs

Pour consulter les logs en production sur Vercel :

1. Allez dans le tableau de bord du projet
2. Cliquez sur "Logs" dans le menu de gauche
3. Filtrez les logs par fonction ou par statut
