# Plan de développement pour Bambi AI

## Vue d'ensemble
Bambi AI est une webapp de génération d'images BYOK (Bring Your Own Key) permettant aux utilisateurs de générer des images via des prompts en utilisant leurs propres clés API (OpenAI, Stability AI, Google, etc.). L'application offre une interface simple, sécurisée et rapide, avec un modèle freemium (50 générations gratuites/mois + premium à 5€/mois pour un usage illimité).

## Stack technologique (versions spécifiées)
- **Frontend**:
  - Next.js 13.5.6 (stable, compatible avec App Router)
  - React 18.2.0
  - TypeScript 5.0.4
  - Tailwind CSS 3.3.3
  - ShadCN UI (basé sur Radix UI 2.0.1)
- **Backend**:
  - Supabase 2.33.1 (Auth, Database, Edge Functions)
  - PostgreSQL 15.x (via Supabase)
  - Node.js 18.x (LTS)
- **Sécurité**:
  - Proxy API via Supabase Edge Functions
  - Chiffrement AES-256 (crypto-js 4.1.1)
- **Paiement**:
  - Stripe API v2023-10-16
  - @stripe/stripe-js 1.54.1
- **Déploiement**:
  - Vercel pour le frontend
  - Supabase pour le backend

## Plan de développement (réorganisé et détaillé)

### Phase 1: Configuration du projet
1. **Initialisation du projet Next.js**
   - Installer Node.js 18.x LTS
   - Créer un projet Next.js 13.5.6 avec TypeScript 5.0.4: `npx create-next-app@13.5.6 bambi-ai --typescript`
   - Configurer ESLint et Prettier pour la qualité du code
   - Mettre en place le système de versionnement Git avec conventions de commit
   - **Documentation**: Guide d'installation avec captures d'écran et vérification des versions

2. **Configuration de Tailwind CSS et ShadCN UI**
   - Installer Tailwind CSS 3.3.3: `npm install -D tailwindcss@3.3.3 postcss autoprefixer`
   - Configurer Tailwind: `npx tailwindcss init -p`
   - Installer et configurer ShadCN UI: `npx shadcn-ui@latest init`
   - Créer un thème personnalisé pour Bambi AI (couleurs, typographie, espacement)
   - **Documentation**: Guide des composants disponibles et du système de design

3. **Mise en place de l'environnement de développement**
   - Configurer les variables d'environnement (.env.local, .env.example)
   - Créer les scripts de développement, build et déploiement
   - Configurer les outils de débogage
   - Mettre en place les tests avec Jest et React Testing Library
   - **Documentation**: Workflow de développement avec diagrammes

### Phase 2: Développement Frontend
4. **Création des composants UI de base**
   - Développer les composants réutilisables avec ShadCN UI
   - Créer le layout principal de l'application
   - Implémenter le système de navigation
   - Développer les composants de formulaire avec validation
   - **Documentation**: Storybook ou documentation équivalente des composants

5. **Développement de la landing page**
   - Créer le hero section avec proposition de valeur claire
   - Développer les sections de fonctionnalités avec illustrations
   - Implémenter la section de tarification avec comparaison des plans
   - Créer le footer avec liens importants et mentions légales
   - Optimiser pour le SEO et la performance
   - **Documentation**: Guide de maintenance de la landing page

6. **Implémentation du système d'authentification (UI)**
   - Créer les pages de connexion et d'inscription
   - Développer les formulaires avec validation côté client
   - Implémenter les flux de réinitialisation de mot de passe
   - Créer l'interface pour les connexions sociales (Google, GitHub)
   - Développer le composant de profil utilisateur
   - **Documentation**: Diagrammes des flux d'authentification

7. **Développement de l'interface de gestion des clés API**
   - Créer la page de gestion des configurations API
   - Développer les formulaires d'ajout et de modification
   - Implémenter l'interface de liste des configurations
   - Créer les composants de validation visuelle
   - Développer les modales de confirmation pour les actions critiques
   - **Documentation**: Guide d'utilisation avec captures d'écran

8. **Développement de l'interface de génération d'images**
   - Créer l'éditeur de prompt avec suggestions
   - Développer l'interface de sélection des configurations
   - Implémenter l'affichage des images générées avec états de chargement
   - Créer les contrôles de téléchargement et partage
   - Développer l'historique des générations avec pagination
   - **Documentation**: Guide des fonctionnalités avec exemples

9. **Développement de l'interface d'abonnement**
   - Créer la page de comparaison des plans
   - Développer l'interface de checkout (UI seulement)
   - Implémenter la page de gestion de l'abonnement
   - Créer les modales d'information sur les limites atteintes
   - **Documentation**: Guide des flux d'abonnement avec captures d'écran

### Phase 3: Configuration Backend
10. **Création et configuration du projet Supabase**
    - Créer un projet Supabase (version 2.33.1)
    - Configurer les politiques de sécurité Row Level Security (RLS)
    - Mettre en place l'authentification (email/mot de passe, Google, GitHub)
    - Configurer le stockage pour les images générées
    - **Documentation**: Architecture Supabase avec diagrammes

11. **Conception et création du schéma de base de données**
    - Créer les tables (utilisateurs, configurations API, historique, abonnements)
    - Définir les relations et contraintes
    - Configurer les triggers et fonctions PostgreSQL
    - Mettre en place les indexes pour optimiser les performances
    - **Documentation**: Schéma avec diagrammes ER et explications

12. **Configuration de l'environnement Supabase Edge Functions**
    - Installer Supabase CLI: `npm install -g supabase@latest`
    - Configurer l'environnement de développement local: `supabase init`
    - Mettre en place la structure des fonctions Edge
    - Configurer les secrets et variables d'environnement
    - **Documentation**: Workflow de développement des fonctions Edge

13. **Configuration de Stripe**
    - Créer un compte Stripe et configurer le projet
    - Définir les produits et les prix (plan gratuit et premium)
    - Configurer le webhook Stripe pour les événements d'abonnement
    - Mettre en place les clés API de test et de production
    - **Documentation**: Guide d'intégration Stripe avec diagrammes

### Phase 4: Développement Backend
14. **Implémentation des fonctions d'authentification**
    - Intégrer Supabase Auth dans l'application Next.js
    - Développer les hooks d'authentification (useAuth)
    - Implémenter la gestion des sessions et des tokens
    - Créer les middlewares de protection des routes
    - **Documentation**: Flux d'authentification avec diagrammes de séquence

15. **Développement des fonctions de gestion des clés API**
    - Implémenter le CRUD pour les configurations API
    - Développer le système de validation des clés avec les différents providers
    - Implémenter le chiffrement/déchiffrement avec crypto-js
    - Créer les tests unitaires et d'intégration
    - **Documentation**: API Reference et protocoles de sécurité

16. **Développement des fonctions Supabase Edge pour le proxy API**
    - Créer les fonctions de validation des clés API
    - Développer les proxys pour chaque provider (OpenAI, Stability AI, etc.)
    - Implémenter le rate limiting et la gestion des quotas
    - Développer la gestion des erreurs et retry logic
    - **Documentation**: API Reference avec exemples et limites

17. **Implémentation du système de paiement**
    - Intégrer l'API Stripe dans l'application
    - Développer les fonctions de création de session de checkout
    - Implémenter les webhooks pour les événements Stripe
    - Créer la gestion des abonnements et des changements de plan
    - **Documentation**: Flux de paiement avec diagrammes de séquence

18. **Développement du système de stockage et d'historique**
    - Implémenter la sauvegarde des générations dans Supabase
    - Développer les fonctions de récupération de l'historique avec filtres
    - Créer la gestion des quotas et limites selon le plan
    - Optimiser les requêtes pour la performance
    - **Documentation**: API de stockage avec exemples

19. **Mise en place du déploiement**
    - Configurer le déploiement Vercel pour le frontend
    - Configurer le déploiement des fonctions Supabase Edge
    - Créer les scripts d'automatisation CI/CD
    - Mettre en place les environnements de développement, staging et production
    - **Documentation**: Procédures de déploiement avec checklist

20. **Tests et documentation finale**
    - Développer les tests end-to-end avec Cypress
    - Créer les tests de sécurité et de performance
    - Finaliser la documentation technique pour les développeurs
    - Rédiger les guides d'utilisation pour les utilisateurs finaux
    - **Documentation**: Guide complet avec index et recherche

## Fonctionnalités clés
- **Génération d'images**: Interface simple pour générer des images à partir de prompts
- **BYOK (Bring Your Own Key)**: Utilisation des propres clés API des utilisateurs
- **Sécurité**: Chiffrement AES-256 des clés et proxy API côté serveur
- **Historique**: Sauvegarde et consultation des générations précédentes
- **Freemium**: Plan gratuit limité et plan premium illimité
- **Multi-providers**: Support pour OpenAI, Stability AI, Google, Hugging Face, OpenRouter

## Prochaines étapes après le MVP
- **Phase 2**:
  - Prompt Optimizer: Amélioration des prompts via un LLM
  - Templates prédéfinis: Logo, illustrations, UI design
  - Export HD: SVG, 4K, PNG
  - Suivi des coûts API: Affichage du coût estimé par génération
- **Phase 3 (Enterprise)**:
  - Marketplace de clés API: Vente de crédits via des partenariats
  - Extensions: VS Code, desktop app
  - Intégrations: Canva, Figma, Adobe
  - API Publique: Pour les développeurs

## Documentation détaillée pour chaque phase

### Phase 1: Configuration du projet
Pour chaque étape de cette phase, une documentation détaillée sera créée incluant:
- Guide d'installation pas à pas avec captures d'écran
- Vérification des versions et compatibilité
- Diagrammes d'architecture
- Exemples de code commentés
- Checklist de vérification

### Phase 2: Développement Frontend
La documentation pour cette phase comprendra:
- Storybook ou équivalent pour les composants UI
- Guides d'utilisation avec captures d'écran
- Diagrammes de flux utilisateur
- Tests d'interface et scénarios d'utilisation
- Bonnes pratiques de développement React/Next.js

### Phase 3: Configuration Backend
Cette phase sera documentée avec:
- Architecture Supabase détaillée
- Schémas de base de données avec diagrammes ER
- Guide de configuration des politiques de sécurité
- Documentation des fonctions Edge
- Procédures de déploiement et de maintenance

### Phase 4: Développement Backend
La documentation finale inclura:
- API Reference complète
- Diagrammes de séquence pour les flux critiques
- Stratégies de gestion des erreurs
- Guide de monitoring et d'alerting
- Procédures de sauvegarde et de récupération

## Détails d'implémentation

### Structure de la base de données
```sql
-- Table pour les configurations API
CREATE TABLE api_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR NOT NULL, -- 'openai', 'stability', 'google', etc.
  name VARCHAR NOT NULL,
  api_key VARCHAR NOT NULL, -- Clé chiffrée
  model VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour l'historique des générations
CREATE TABLE generation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  configuration_id UUID REFERENCES api_configurations(id),
  provider VARCHAR NOT NULL,
  model VARCHAR NOT NULL,
  images JSONB NOT NULL, -- URLs des images générées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les abonnements
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR,
  stripe_subscription_id VARCHAR,
  plan VARCHAR NOT NULL, -- 'free', 'premium'
  status VARCHAR NOT NULL, -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Prévention des bugs et meilleures pratiques

### Points critiques à surveiller
1. **Gestion des clés API**
   - Risque: Fuites de sécurité des clés API des utilisateurs
   - Prévention: Chiffrement AES-256, proxy API côté serveur, tests de sécurité
   - Documentation: Audit de sécurité régulier

2. **Intégration Supabase**
   - Risque: Problèmes avec les règles de sécurité Row Level Security (RLS)
   - Prévention: Tests exhaustifs des politiques RLS, vérification des accès
   - Documentation: Guide des politiques RLS avec exemples

3. **Intégration Stripe**
   - Risque: Webhooks manqués, événements de paiement non traités
   - Prévention: Logging complet, système de retry, monitoring des webhooks
   - Documentation: Diagrammes de flux de paiement et gestion des erreurs

4. **Proxy API**
   - Risque: Timeouts, erreurs des providers externes, rate limiting
   - Prévention: Circuit breakers, retry logic, fallbacks, monitoring
   - Documentation: Stratégies de gestion des erreurs et limites

5. **Authentification**
   - Risque: Sessions expirées, tokens invalides, CSRF
   - Prévention: Refresh tokens, validation côté serveur, protection CSRF
   - Documentation: Flux d'authentification sécurisés

6. **Incompatibilité des versions React/Next.js**
   - Risque: Utilisation de versions expérimentales ou incompatibles (React 19.x, Next.js 15.x)
   - Symptômes: Erreurs d'hydratation, fonctionnalités manquantes, comportements inattendus
   - Solution:
     - Toujours utiliser les versions stables spécifiées dans ce document (React 18.2.0, Next.js 13.5.6)
     - Vérifier la compatibilité des dépendances avant mise à jour
     - Utiliser des versions exactes dans package.json (sans ^) pour les dépendances critiques
     - Tester rigoureusement après toute mise à jour de dépendance
   - Prévention: Script de vérification des versions au démarrage du projet
   - Documentation: Matrice de compatibilité des versions et procédure de mise à jour

7. **Erreurs d'hydratation React/Next.js**
   - Risque: Divergences entre le HTML rendu côté serveur et côté client
   - Causes: Extensions de navigateur (traduction automatique), fonctionnalités intégrées au navigateur qui modifient le DOM
   - Symptômes: Erreurs "Hydration failed because the server rendered HTML didn't match the client"
   - Solution radicale:
     - Utiliser un composant client (`'use client'`) pour les éléments HTML critiques
     - Ajouter l'attribut `translate="no"` aux éléments sensibles
     - Utiliser `suppressHydrationWarning` sur les éléments problématiques
     - Implémenter un script d'initialisation qui s'exécute avant l'hydratation React
     - Utiliser `dangerouslySetInnerHTML` pour le contenu qui ne doit pas être modifié
   - Prévention: Tester l'application avec différentes configurations de navigateur et extensions
   - Documentation: Guide de débogage des erreurs d'hydratation avec exemples de solutions

### Stratégies de prévention globales
1. **Tests automatisés**
   - Tests unitaires pour les fonctions critiques
   - Tests d'intégration pour les flux complets
   - Tests end-to-end pour les parcours utilisateurs
   - Tests de sécurité et de performance
   - Tests d'hydratation React/Next.js dans différents environnements de navigateur
     - Tester avec et sans extensions de navigateur
     - Tester avec différentes langues de navigateur
     - Vérifier les divergences entre le rendu serveur et client

2. **Code reviews systématiques**
   - Checklist de revue de code
   - Pair programming pour les fonctionnalités critiques
   - Validation des changements par un second développeur

3. **Logging et monitoring**
   - Logs structurés avec niveaux de sévérité
   - Alertes pour les erreurs critiques
   - Dashboards de monitoring pour les métriques clés

4. **Feature flags**
   - Déploiement progressif des fonctionnalités
   - A/B testing pour les changements d'interface
   - Rollback rapide en cas de problème

5. **Environnements séparés**
   - Développement, staging et production
   - Tests de non-régression avant déploiement
   - Procédures de déploiement documentées

6. **Gestion des versions et dépendances**
   - Script de vérification des versions au démarrage du projet
   - Utilisation de versions exactes pour les dépendances critiques
   - Procédure de mise à jour documentée avec tests de régression
   - Solution pour les problèmes de versions incompatibles:
     ```bash
     # En cas d'utilisation accidentelle de versions expérimentales (React 19.x, Next.js 15.x)
     # 1. Mettre à jour package.json avec les versions stables
     # 2. Supprimer node_modules et package-lock.json
     cd /chemin/vers/projet
     rm -rf node_modules package-lock.json
     # 3. Réinstaller les dépendances
     npm install
     # 4. Vérifier les composants client pour les erreurs d'hydratation
     # 5. Simplifier les composants ClientHtml et autres wrappers client
     ```

### Commandes d'initialisation du projet (avec versions spécifiées)
```bash
# Installer Node.js 18.x LTS
# Télécharger depuis https://nodejs.org/

# Initialiser un nouveau projet Next.js avec TypeScript
npx create-next-app@13.5.6 bambi-ai --typescript

# Installer Tailwind CSS avec version spécifique
cd bambi-ai
npm install -D tailwindcss@3.3.3 postcss autoprefixer
npx tailwindcss init -p

# Installer ShadCN UI
npx shadcn-ui@latest init

# Installer les dépendances nécessaires avec versions spécifiées
npm install @supabase/supabase-js@2.33.1 crypto-js@4.1.1 stripe@12.18.0 @stripe/stripe-js@1.54.1
npm install -D jest@29.6.4 @testing-library/react@14.0.0 @testing-library/jest-dom@6.1.3 typescript@5.0.4

# Configurer ESLint et Prettier
npm install -D eslint@8.48.0 prettier@3.0.3 eslint-config-prettier@9.0.0

# Installer Cypress pour les tests end-to-end
npm install -D cypress@13.3.0

# Configurer Supabase CLI pour le développement local
npm install -g supabase@1.88.0
supabase init
```

### Structure de dossiers recommandée
```
bambi-ai/
├── app/                    # App Router de Next.js 13
│   ├── (auth)/             # Routes d'authentification
│   ├── (dashboard)/        # Routes du dashboard
│   ├── (marketing)/        # Routes de la landing page
│   ├── api/                # Routes API
│   └── layout.tsx          # Layout principal
├── components/             # Composants React réutilisables
│   ├── ui/                 # Composants UI de base (ShadCN)
│   ├── forms/              # Composants de formulaire
│   ├── auth/               # Composants d'authentification
│   ├── dashboard/          # Composants du dashboard
│   ├── marketing/          # Composants de la landing page
│   └── client-wrappers/    # Composants client pour éviter les erreurs d'hydratation
│       ├── ClientHtml.tsx  # Wrapper pour la balise HTML (évite les erreurs d'hydratation)
│       └── NoTranslate.tsx # Composant pour contenu qui ne doit pas être traduit
├── lib/                    # Utilitaires et configurations
│   ├── supabase/           # Client et helpers Supabase
│   ├── stripe/             # Client et helpers Stripe
│   ├── encryption.ts       # Fonctions de chiffrement
│   └── utils.ts            # Utilitaires généraux
├── hooks/                  # Hooks personnalisés
│   ├── useAuth.ts          # Hook d'authentification
│   ├── useApiConfig.ts     # Hook de gestion des configs API
│   └── useSubscription.ts  # Hook de gestion des abonnements
├── types/                  # Types TypeScript
├── public/                 # Fichiers statiques
├── supabase/               # Configuration Supabase
│   ├── functions/          # Edge Functions
│   └── migrations/         # Migrations SQL
├── tests/                  # Tests
│   ├── unit/               # Tests unitaires
│   ├── integration/        # Tests d'intégration
│   └── e2e/                # Tests end-to-end
├── docs/                   # Documentation
├── .env.example            # Variables d'environnement d'exemple
├── next.config.js          # Configuration Next.js
└── tailwind.config.js      # Configuration Tailwind
```
