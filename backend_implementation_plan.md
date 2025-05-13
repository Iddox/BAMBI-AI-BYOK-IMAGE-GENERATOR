# Plan d'Implémentation Backend pour Bambi AI

Ce document détaille les étapes précises pour implémenter le backend de Bambi AI, en se concentrant sur les fonctionnalités BYOK (Bring Your Own Key), l'authentification, la base de données et l'intégration de Stripe.

## 1. Introduction

### Objectif
Développer un backend complet pour Bambi AI permettant aux utilisateurs de générer des images via des prompts en utilisant leurs propres clés API (BYOK), avec un système d'authentification robuste et une gestion des abonnements via Stripe.

### Vue d'ensemble de l'architecture
- **Frontend**: Next.js (déjà implémenté avec landing page)
- **Backend**: API Routes Next.js + Supabase Edge Functions
- **Base de données**: PostgreSQL via Supabase
- **Authentification**: Supabase Auth
- **Paiements**: Stripe
- **Stockage**: Supabase Storage

### Prérequis techniques
- Node.js 18.x LTS ou supérieur
- Compte Supabase
- Compte Stripe
- Git

## 2. Configuration de l'environnement de développement

### Installation des dépendances
```bash
# Installation de la CLI Supabase
npm install -g supabase

# Installation des dépendances du projet
npm install @supabase/supabase-js @supabase/ssr @supabase/auth-helpers-nextjs
npm install stripe @stripe/stripe-js
npm install crypto-js zod react-hook-form
npm install @tanstack/react-query
```

### Configuration des variables d'environnement
Créer un fichier `.env.local` à la racine du projet avec les variables suivantes :

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-publishable-key
STRIPE_SECRET_KEY=your-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
STRIPE_PREMIUM_PRICE_ID=price_xxxxx

# Sécurité
ENCRYPTION_KEY=your-32-byte-encryption-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Structure du projet
Organiser le projet selon la structure suivante pour une séparation claire des responsabilités :

```
/app
  /api                 # API Routes Next.js
  /auth                # Pages d'authentification
  /dashboard           # Interface utilisateur post-connexion
  /(landing)           # Landing page (déjà implémentée)
/components            # Composants React réutilisables
/lib
  /supabase            # Configuration du client Supabase
  /stripe              # Configuration de Stripe
  /utils               # Fonctions utilitaires
/types                 # Types TypeScript partagés
/supabase
  /functions           # Edge Functions Supabase
  /migrations          # Scripts de migration SQL
```

## 3. Implémentation de la base de données

### Création des tables principales
Exécuter les scripts SQL suivants dans l'interface SQL de Supabase :

```sql
-- Table Users
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  auth_provider TEXT,
  auth_provider_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  reset_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan_type TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table ApiProviders
CREATE TABLE public.api_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  website_url TEXT,
  api_base_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Models
CREATE TABLE public.models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES public.api_providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  description TEXT,
  capabilities JSONB DEFAULT '{}'::JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table ApiConfigurations
CREATE TABLE public.api_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.api_providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  encrypted_api_key TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE,
  last_validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table ImageGenerations
CREATE TABLE public.image_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  configuration_id UUID REFERENCES public.api_configurations(id) ON DELETE SET NULL,
  model_id UUID REFERENCES public.models(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  parameters JSONB DEFAULT '{}'::JSONB,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Images
CREATE TABLE public.images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id UUID REFERENCES public.image_generations(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT,
  width INTEGER,
  height INTEGER,
  format TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table ApiUsage
CREATE TABLE public.api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  configuration_id UUID REFERENCES public.api_configurations(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES public.api_providers(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  tokens_used INTEGER,
  cost_estimate DECIMAL,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Configuration des fonctions utilitaires
Créer les fonctions suivantes pour la gestion des compteurs d'utilisation et des triggers :

```sql
-- Fonction pour incrémenter le compteur d'utilisation
CREATE OR REPLACE FUNCTION increment_usage_count(user_id UUID, count INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET usage_count = usage_count + count
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger à toutes les tables
CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_subscriptions_timestamp
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_api_configurations_timestamp
BEFORE UPDATE ON public.api_configurations
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_image_generations_timestamp
BEFORE UPDATE ON public.image_generations
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_api_usage_timestamp
BEFORE UPDATE ON public.api_usage
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

### Configuration des politiques RLS
Configurer les politiques Row Level Security pour sécuriser l'accès aux données :

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Politiques pour users
CREATE POLICY "Users can view their own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Politiques pour subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Politiques pour api_configurations
CREATE POLICY "Users can view their own API configurations"
  ON public.api_configurations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API configurations"
  ON public.api_configurations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API configurations"
  ON public.api_configurations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API configurations"
  ON public.api_configurations FOR DELETE
  USING (auth.uid() = user_id);

-- Politiques pour image_generations
CREATE POLICY "Users can view their own image generations"
  ON public.image_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own image generations"
  ON public.image_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politiques pour images
CREATE POLICY "Users can view images from their generations"
  ON public.images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.image_generations
    WHERE image_generations.id = images.generation_id
    AND image_generations.user_id = auth.uid()
  ));

-- Politiques pour api_usage
CREATE POLICY "Users can view their own API usage"
  ON public.api_usage FOR SELECT
  USING (auth.uid() = user_id);
```

### Insertion des données initiales
Insérer les données de référence pour les fournisseurs API et les modèles :

```sql
-- Insertion des fournisseurs API
INSERT INTO public.api_providers (name, slug, description, website_url, api_base_url)
VALUES
  ('OpenAI', 'openai', 'API OpenAI pour DALL-E', 'https://openai.com', 'https://api.openai.com'),
  ('Google', 'google', 'Google Imagen via Vertex AI', 'https://cloud.google.com', 'https://us-central1-aiplatform.googleapis.com'),
  ('xAI', 'xai', 'xAI Grock pour la génération d''images', 'https://x.ai', 'https://api.x.ai');

-- Insertion des modèles
INSERT INTO public.models (provider_id, name, model_id, description, capabilities)
VALUES
  ((SELECT id FROM public.api_providers WHERE slug = 'openai'), 'DALL-E 3', 'dall-e-3', 'Dernière version de DALL-E', '{"max_resolution": "1024x1024", "formats": ["png", "jpg"]}'::jsonb),
  ((SELECT id FROM public.api_providers WHERE slug = 'openai'), 'DALL-E 2', 'dall-e-2', 'Version précédente de DALL-E', '{"max_resolution": "1024x1024", "formats": ["png"]}'::jsonb),
  ((SELECT id FROM public.api_providers WHERE slug = 'google'), 'Imagen', 'imagen', 'Google Imagen sur Vertex AI', '{"max_resolution": "1024x1024", "formats": ["png", "jpg"]}'::jsonb),
  ((SELECT id FROM public.api_providers WHERE slug = 'xai'), 'Grock', 'grock', 'Modèle de génération d''images xAI', '{"max_resolution": "1024x1024", "formats": ["png"]}'::jsonb);
```

## 4. Authentification et gestion des utilisateurs

### Configuration de Supabase Auth
Configurer l'authentification dans le dashboard Supabase :

1. Activer les méthodes d'authentification :
   - Email/mot de passe
   - OAuth (Google, GitHub)

2. Personnaliser les emails de confirmation :
   - Email de confirmation d'inscription
   - Email de réinitialisation de mot de passe

3. Configurer les redirections :
   - URL de redirection après connexion : `/auth/callback`
   - URL de redirection après déconnexion : `/`

### Configuration du client Supabase
Créer un fichier `lib/supabase/client.ts` pour la configuration côté client :

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Créer un fichier `lib/supabase/server.ts` pour la configuration côté serveur :

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

### Middleware d'authentification
Créer un fichier `middleware.ts` à la racine du projet pour protéger les routes authentifiées :

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Si l'utilisateur n'est pas authentifié et tente d'accéder à une route protégée
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

### Implémentation des pages d'authentification
Créer les pages d'authentification dans le dossier `app/auth` :

1. Page de connexion (`app/auth/login/page.tsx`) :

```tsx
// app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push(redirectTo)
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Connexion à votre compte
          </h2>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Adresse email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Mot de passe"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Pas encore de compte ? S'inscrire
              </Link>
            </div>
            <div className="text-sm">
              <Link href="/auth/reset-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                Mot de passe oublié ?
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
```

2. Page d'inscription (`app/auth/register/page.tsx`) :

```tsx
// app/auth/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setMessage('Vérifiez votre email pour confirmer votre inscription.')
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Créer un compte
          </h2>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {message && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">{message}</div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Adresse email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Mot de passe"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400"
            >
              {loading ? 'Inscription en cours...' : 'S\'inscrire'}
            </button>
          </div>

          <div className="text-sm">
            <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Déjà un compte ? Se connecter
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
```

3. Page de callback d'authentification (`app/auth/callback/route.ts`) :

```typescript
// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name, options) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

## 5. Implémentation BYOK (Bring Your Own Key)

### Système de chiffrement des clés API
Créer un fichier `lib/utils/encryption.ts` pour le chiffrement/déchiffrement des clés API :

```typescript
// lib/utils/encryption.ts
import * as crypto from 'crypto'

// Fonction pour chiffrer une clé API
export async function encryptApiKey(apiKey: string): Promise<string> {
  const encryptionKey = process.env.ENCRYPTION_KEY!

  // Générer un vecteur d'initialisation aléatoire
  const iv = crypto.randomBytes(16)

  // Créer un chiffreur avec l'algorithme AES-256-CBC
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(encryptionKey, 'hex'),
    iv
  )

  // Chiffrer la clé API
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  // Combiner IV et données chiffrées pour le stockage
  return iv.toString('hex') + ':' + encrypted
}

// Fonction pour déchiffrer une clé API
export async function decryptApiKey(encryptedKey: string): Promise<string> {
  const encryptionKey = process.env.ENCRYPTION_KEY!

  // Séparer IV et données chiffrées
  const parts = encryptedKey.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encryptedData = parts[1]

  // Créer un déchiffreur
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(encryptionKey, 'hex'),
    iv
  )

  // Déchiffrer la clé API
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
```

### API pour la gestion des configurations API
Créer les API routes pour la gestion des configurations API :

1. API pour récupérer les configurations d'un utilisateur (`app/api/api-configurations/route.ts`) :

```typescript
// app/api/api-configurations/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('api_configurations')
    .select(`
      id,
      name,
      is_valid,
      last_validated_at,
      created_at,
      api_providers (
        id,
        name,
        slug
      )
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Vérifier si l'utilisateur a un abonnement premium
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_type')
    .eq('user_id', session.user.id)
    .single()

  // Si l'utilisateur n'a pas d'abonnement premium, vérifier le nombre de configurations
  if (!subscription || subscription.plan_type !== 'premium') {
    const { count, error: countError } = await supabase
      .from('api_configurations')
      .select('id', { count: 'exact' })
      .eq('user_id', session.user.id)

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    if (count && count >= 1) {
      return NextResponse.json(
        { error: 'Limite de configurations atteinte. Passez au plan premium pour en ajouter plus.' },
        { status: 403 }
      )
    }
  }

  const { name, providerId, apiKey } = await request.json()

  // Importer la fonction de chiffrement
  const { encryptApiKey } = await import('@/lib/utils/encryption')

  // Chiffrer la clé API
  const encryptedApiKey = await encryptApiKey(apiKey)

  const { data, error } = await supabase
    .from('api_configurations')
    .insert({
      user_id: session.user.id,
      provider_id: providerId,
      name,
      encrypted_api_key: encryptedApiKey,
      is_valid: true,
      last_validated_at: new Date().toISOString()
    })
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data[0] })
}
```

2. API pour gérer une configuration spécifique (`app/api/api-configurations/[id]/route.ts`) :

```typescript
// app/api/api-configurations/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('api_configurations')
    .select(`
      id,
      name,
      is_valid,
      last_validated_at,
      created_at,
      api_providers (
        id,
        name,
        slug
      )
    `)
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { name, apiKey } = await request.json()

  // Préparer les données à mettre à jour
  const updateData: any = { name }

  // Si une nouvelle clé API est fournie, la chiffrer
  if (apiKey) {
    const { encryptApiKey } = await import('@/lib/utils/encryption')
    updateData.encrypted_api_key = await encryptApiKey(apiKey)
    updateData.is_valid = true
    updateData.last_validated_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('api_configurations')
    .update(updateData)
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data[0] })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { error } = await supabase
    .from('api_configurations')
    .delete()
    .eq('id', params.id)
    .eq('user_id', session.user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

### Proxy API pour les différents fournisseurs
Créer des Edge Functions Supabase pour servir de proxy vers les API de génération d'images :

1. Fonction Edge pour OpenAI (`supabase/functions/openai-proxy/index.ts`) :

```typescript
// supabase/functions/openai-proxy/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialiser le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Récupérer le token d'authentification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer les données de la requête
    const { configId, prompt, parameters } = await req.json()

    // Récupérer la configuration API
    const { data: config, error: configError } = await supabase
      .from('api_configurations')
      .select('encrypted_api_key, provider_id')
      .eq('id', configId)
      .eq('user_id', user.id)
      .single()

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: 'Configuration non trouvée' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer le modèle
    const { data: model, error: modelError } = await supabase
      .from('models')
      .select('model_id')
      .eq('id', parameters.modelId)
      .single()

    if (modelError || !model) {
      return new Response(
        JSON.stringify({ error: 'Modèle non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Déchiffrer la clé API
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY') ?? ''
    const encryptedKey = config.encrypted_api_key
    const parts = encryptedKey.split(':')
    const iv = new Uint8Array(Array.from(parts[0].match(/.{1,2}/g)!).map(byte => parseInt(byte, 16)))
    const encryptedData = parts[1]

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(encryptionKey),
      { name: 'AES-CBC', length: 256 },
      false,
      ['decrypt']
    )

    const decryptedArrayBuffer = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      key,
      new Uint8Array(Array.from(encryptedData.match(/.{1,2}/g)!).map(byte => parseInt(byte, 16))).buffer
    )

    const apiKey = new TextDecoder().decode(decryptedArrayBuffer)

    // Appeler l'API OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt,
        model: model.model_id,
        n: parameters.count || 2,
        size: parameters.size || '1024x1024',
        response_format: 'url'
      })
    })

    // Vérifier la réponse d'OpenAI
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()

      // Mettre à jour le statut de validité de la clé si nécessaire
      if (openaiResponse.status === 401) {
        await supabase
          .from('api_configurations')
          .update({ is_valid: false })
          .eq('id', configId)
      }

      return new Response(
        JSON.stringify({ error: errorData.error }),
        { status: openaiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Traiter la réponse
    const data = await openaiResponse.json()

    // Enregistrer la génération d'image
    const { data: generation, error: generationError } = await supabase
      .from('image_generations')
      .insert({
        user_id: user.id,
        configuration_id: configId,
        model_id: parameters.modelId,
        prompt,
        parameters,
        status: 'completed'
      })
      .select()
      .single()

    if (generationError) {
      console.error('Erreur lors de l\'enregistrement de la génération:', generationError)
    }

    // Enregistrer les images générées
    if (generation) {
      const imagePromises = data.data.map(async (image: any, index: number) => {
        return supabase
          .from('images')
          .insert({
            generation_id: generation.id,
            url: image.url,
            storage_path: `images/${user.id}/${generation.id}/${index}.png`
          })
      })

      await Promise.all(imagePromises)
    }

    // Enregistrer l'utilisation
    await supabase.from('api_usage').insert({
      user_id: user.id,
      configuration_id: configId,
      provider_id: config.provider_id,
      request_type: 'image_generation',
      request_count: parameters.count || 2
    })

    // Mettre à jour le compteur d'utilisation
    await supabase.rpc('increment_usage_count', { user_id: user.id, count: 1 })

    // Retourner les résultats
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erreur proxy OpenAI:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

2. Créer des fonctions Edge similaires pour Google Imagen et xAI Grock.

### Validation et test des clés API
Créer une API route pour valider les clés API :

```typescript
// app/api/validate-api-key/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { providerId, apiKey } = await request.json()

  try {
    // Récupérer les informations du fournisseur
    const { data: provider, error: providerError } = await supabase
      .from('api_providers')
      .select('slug, api_base_url')
      .eq('id', providerId)
      .single()

    if (providerError) {
      return NextResponse.json({ error: 'Fournisseur non trouvé' }, { status: 404 })
    }

    // Valider la clé API en fonction du fournisseur
    let isValid = false

    if (provider.slug === 'openai') {
      // Valider la clé OpenAI
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      isValid = response.ok
    } else if (provider.slug === 'google') {
      // Valider la clé Google Imagen (via Vertex AI)
      // Implémentation spécifique à Google Cloud
      isValid = true // Placeholder
    } else if (provider.slug === 'xai') {
      // Valider la clé xAI
      // Implémentation spécifique à xAI
      isValid = true // Placeholder
    }

    return NextResponse.json({ isValid })
  } catch (error) {
    console.error('Erreur de validation de clé API:', error)
    return NextResponse.json({ error: 'Erreur de validation' }, { status: 500 })
  }
}
```

## 6. Intégration Stripe pour les paiements

### Configuration de Stripe
Créer un fichier `lib/stripe/index.ts` pour initialiser le client Stripe :

```typescript
// lib/stripe/index.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})
```

### Implémentation du checkout Stripe
Créer une API route pour créer une session de checkout Stripe :

```typescript
// app/api/stripe/create-checkout-session/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer ou créer le client Stripe
    let customerId: string

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', session.user.id)
      .single()

    if (subscription?.stripe_customer_id) {
      customerId = subscription.stripe_customer_id
    } else {
      // Récupérer l'email de l'utilisateur
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', session.user.id)
        .single()

      // Créer un nouveau client Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: session.user.id }
      })

      customerId = customer.id

      // Sauvegarder l'ID client Stripe
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: session.user.id,
          stripe_customer_id: customerId,
          plan_type: 'free',
          status: 'active'
        })
    }

    // Créer une session de checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PREMIUM_PRICE_ID!,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      metadata: {
        user_id: session.user.id
      }
    })

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url })
  } catch (error: any) {
    console.error('Erreur création session Stripe:', error)
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
  }
}
```

### Gestion des webhooks Stripe
Créer une API route pour gérer les webhooks Stripe :

```typescript
// app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error(`Erreur de signature webhook: ${error.message}`)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const supabase = createClient()

  try {
    // Traiter les événements
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata.user_id

        // Récupérer les détails de l'abonnement
        const subscription = await stripe.subscriptions.retrieve(session.subscription)

        // Mettre à jour l'abonnement dans la base de données
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plan_type: 'premium',
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const userId = subscription.metadata.user_id

        // Mettre à jour l'abonnement dans la base de données
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object

        // Mettre à jour l'abonnement comme annulé
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            plan_type: 'free'
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Erreur traitement webhook:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### Vérification des limites selon le plan
Créer un hook pour vérifier les limites d'utilisation :

```typescript
// lib/hooks/use-subscription-limits.ts
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useSubscriptionLimits() {
  const [isLoading, setIsLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [usageCount, setUsageCount] = useState(0)
  const [usageLimit, setUsageLimit] = useState(50) // Limite par défaut pour le plan gratuit
  const [configCount, setConfigCount] = useState(0)
  const [configLimit, setConfigLimit] = useState(1) // Limite par défaut pour le plan gratuit

  const supabase = createClient()

  useEffect(() => {
    async function fetchLimits() {
      try {
        setIsLoading(true)

        // Récupérer la session
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        // Récupérer l'abonnement
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan_type, status')
          .eq('user_id', session.user.id)
          .single()

        // Vérifier si l'utilisateur a un abonnement premium actif
        const hasPremium = subscription?.plan_type === 'premium' && subscription?.status === 'active'
        setIsPremium(hasPremium)

        // Définir les limites en fonction du plan
        if (hasPremium) {
          setUsageLimit(Infinity)
          setConfigLimit(Infinity)
        } else {
          setUsageLimit(50)
          setConfigLimit(1)
        }

        // Récupérer l'utilisation actuelle
        const { data: user } = await supabase
          .from('users')
          .select('usage_count')
          .eq('id', session.user.id)
          .single()

        if (user) {
          setUsageCount(user.usage_count)
        }

        // Récupérer le nombre de configurations
        const { count } = await supabase
          .from('api_configurations')
          .select('id', { count: 'exact' })
          .eq('user_id', session.user.id)

        if (count !== null) {
          setConfigCount(count)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des limites:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLimits()

    // Configurer un écouteur pour les changements d'abonnement
    const subscription = supabase
      .channel('subscription-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'subscriptions',
        filter: `user_id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}`
      }, () => {
        fetchLimits()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  return {
    isLoading,
    isPremium,
    usageCount,
    usageLimit,
    configCount,
    configLimit,
    hasReachedUsageLimit: usageCount >= usageLimit,
    hasReachedConfigLimit: configCount >= configLimit,
    usagePercentage: Math.min(Math.round((usageCount / usageLimit) * 100), 100)
  }
}
```

## 7. Optimisation et déploiement

### Optimisation des performances
Mettre en place des stratégies d'optimisation des performances :

1. Optimisation des requêtes Supabase :
   - Utiliser des requêtes avec sélection précise des colonnes
   - Limiter le nombre de résultats retournés
   - Utiliser des index pour les requêtes fréquentes

2. Mise en cache avec React Query :
   ```typescript
   // lib/react-query.ts
   import { QueryClient } from '@tanstack/react-query'

   export const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 60 * 1000, // 1 minute
         refetchOnWindowFocus: false,
       },
     },
   })
   ```

3. Optimisation des images :
   - Utiliser le composant Image de Next.js
   - Configurer le redimensionnement automatique
   - Utiliser des formats d'image optimisés (WebP)

### Sécurité et conformité
Mettre en place des mesures de sécurité supplémentaires :

1. Protection contre les attaques CSRF :
   - Utiliser des tokens CSRF pour les formulaires
   - Vérifier l'origine des requêtes

2. Validation des entrées utilisateur :
   - Utiliser Zod pour la validation des données
   - Échapper les entrées utilisateur pour éviter les injections

3. Journalisation des événements de sécurité :
   - Enregistrer les tentatives d'authentification échouées
   - Journaliser les opérations sensibles (modification des clés API)

### Déploiement sur Vercel et Supabase
Configurer le déploiement de l'application :

1. Déploiement sur Vercel :
   ```bash
   # Installation de la CLI Vercel
   npm install -g vercel

   # Déploiement de l'application
   vercel
   ```

2. Déploiement des Edge Functions Supabase :
   ```bash
   # Déploiement des fonctions Edge
   supabase functions deploy openai-proxy --no-verify-jwt
   supabase functions deploy google-proxy --no-verify-jwt
   supabase functions deploy xai-proxy --no-verify-jwt

   # Configuration des secrets
   supabase secrets set ENCRYPTION_KEY=your-encryption-key
   ```

3. Configuration des variables d'environnement sur Vercel :
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET
   - STRIPE_PREMIUM_PRICE_ID
   - ENCRYPTION_KEY
   - NEXT_PUBLIC_APP_URL

## Informations nécessaires pour l'implémentation

Pour réaliser cette implémentation, les informations suivantes sont nécessaires :

### 1. Informations Supabase
- URL du projet Supabase
- Clé anon
- Clé service role
- Configuration des fournisseurs OAuth (ID client, secret)

### 2. Informations Stripe
- Clé API publique
- Clé API secrète
- Webhook secret
- IDs des produits et prix

### 3. Informations sur les fournisseurs d'API d'images
- Documentation des API OpenAI, Google Imagen, xAI Grock
- Formats de requête et réponse
- Limites et quotas
- Coûts et tarification

### 4. Informations sur le déploiement
- Accès au compte Vercel
- Configuration des domaines
- Stratégie de déploiement (CI/CD)
- Environnements (dev, staging, prod)

### 5. Informations sur la sécurité
- Stratégie de gestion des clés de chiffrement
- Politique de rétention des données
- Exigences de conformité RGPD
- Politique de sauvegarde et récupération

## 6. Intégration Stripe pour les paiements

### Configuration de Stripe
- Créer un compte Stripe
- Configurer les produits (Free, Premium)
- Configurer les prix (0€, 5€/mois)

### Implémentation du checkout Stripe
- Créer la page de checkout
- Implémenter l'API de création de session Stripe
- Gérer les redirections post-paiement

### Gestion des webhooks Stripe
- Configurer les webhooks Stripe
- Implémenter l'API de réception des webhooks
- Mettre à jour la base de données en fonction des événements

### Vérification des limites selon le plan
- Implémenter les vérifications de limites
- Mettre à jour les compteurs d'utilisation
- Ajouter des notifications pour les limites atteintes

## 7. Optimisation et déploiement

### Optimisation des performances
- Optimisation des requêtes Supabase
- Mise en cache avec React Query
- Optimisation des images

### Sécurité et conformité
- Protection contre les attaques CSRF
- Validation des entrées utilisateur
- Journalisation des événements de sécurité

### Déploiement sur Vercel et Supabase
- Déploiement sur Vercel
- Déploiement des Edge Functions Supabase
- Configuration des variables d'environnement

## Informations nécessaires pour l'implémentation

### 1. Informations Supabase
- URL du projet Supabase
- Clé anon
- Clé service role
- Configuration des fournisseurs OAuth (ID client, secret)

### 2. Informations Stripe
- Clé API publique
- Clé API secrète
- Webhook secret
- IDs des produits et prix

### 3. Informations sur les fournisseurs d'API d'images
- Documentation des API OpenAI, Google Imagen, xAI Grock
- Formats de requête et réponse
- Limites et quotas
- Coûts et tarification

### 4. Informations sur le déploiement
- Accès au compte Vercel
- Configuration des domaines
- Stratégie de déploiement (CI/CD)
- Environnements (dev, staging, prod)

### 5. Informations sur la sécurité
- Stratégie de gestion des clés de chiffrement
- Politique de rétention des données
- Exigences de conformité RGPD
- Politique de sauvegarde et récupération
- Ajouter des notifications pour les limites atteintes

## 8. Tests et documentation

### Tests unitaires et d'intégration
- Configurer Jest pour les tests
- Créer des tests pour les fonctions critiques
- Mettre en place des tests d'intégration

### Documentation
- Documenter l'architecture technique
- Créer une documentation des API
- Rédiger un guide de maintenance

## Informations nécessaires pour l'implémentation

Pour réaliser cette implémentation, les informations suivantes sont nécessaires :

### 1. Informations Supabase
- URL du projet Supabase
- Clé anon
- Clé service role
- Configuration des fournisseurs OAuth (ID client, secret)

### 2. Informations Stripe
- Clé API publique
- Clé API secrète
- Webhook secret
- IDs des produits et prix

### 3. Informations sur les fournisseurs d'API d'images
- Documentation des API OpenAI, Google Imagen, xAI Grock
- Formats de requête et réponse
- Limites et quotas
- Coûts et tarification

### 4. Informations sur le déploiement
- Accès au compte Vercel
- Configuration des domaines
- Stratégie de déploiement (CI/CD)
- Environnements (dev, staging, prod)

### 5. Informations sur la sécurité
- Stratégie de gestion des clés de chiffrement
- Politique de rétention des données
- Exigences de conformité RGPD
- Politique de sauvegarde et récupération