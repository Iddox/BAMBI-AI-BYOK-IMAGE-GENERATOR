# Plan d'implémentation technique détaillé pour BYOK (Bring Your Own Key)

Ce document présente un plan d'implémentation technique détaillé pour la fonctionnalité BYOK (Bring Your Own Key) de Bambi AI. Ce plan est conçu pour être exécuté par un agent IA de codage sans intervention humaine.

## Table des matières

1. [Préparation](#préparation)
2. [Phase 1: Correction des incohérences dans la base de données](#phase-1-correction-des-incohérences-dans-la-base-de-données)
3. [Phase 2: Standardisation du chiffrement des clés API](#phase-2-standardisation-du-chiffrement-des-clés-api)
4. [Phase 3: Refactorisation de l'intégration avec les API d'images](#phase-3-refactorisation-de-lintégration-avec-les-api-dimages)
5. [Phase 4: Amélioration de l'interface utilisateur](#phase-4-amélioration-de-linterface-utilisateur)
6. [Phase 5: Tests et débogage](#phase-5-tests-et-débogage)
7. [Phase 6: Documentation](#phase-6-documentation)

## Préparation

1. **Vérification de l'environnement**
   - Vérifier que toutes les dépendances sont installées
   - Vérifier que la base de données Supabase est accessible
   - Vérifier que la variable d'environnement `ENCRYPTION_KEY` est définie

## Phase 1: Correction des incohérences dans la base de données

### 1.1 Mise à jour de app/api/generate-image/route.ts

- **Fichier**: `app/api/generate-image/route.ts`
- **Actions**:
  - Rechercher toutes les occurrences de `encrypted_api_key` et les remplacer par `api_key`
  - Rechercher toutes les occurrences de `config.encrypted_api_key` et les remplacer par `config.api_key`
- **Code à modifier**:
  ```typescript
  // Remplacer
  const { data: config, error: configError } = await supabase
    .from('api_configurations')
    .select(`
      id,
      encrypted_api_key,
      user_id,
      provider_id
    `)
    .eq('id', configurationId)
    .single();

  // Par
  const { data: config, error: configError } = await supabase
    .from('api_configurations')
    .select(`
      id,
      api_key,
      user_id,
      provider_id
    `)
    .eq('id', configurationId)
    .single();

  // Et remplacer
  const apiKey = decrypt(config.encrypted_api_key);

  // Par
  const apiKey = decrypt(config.api_key);
  ```
- **Test**: Générer une image pour vérifier que les modifications fonctionnent

### 1.2 Création d'une migration SQL

- **Fichier**: `supabase/migrations/20240720000000_api_key_index.sql`
- **Contenu**:
  ```sql
  COMMENT ON COLUMN api_configurations.api_key IS 'Clé API chiffrée avec AES-256';
  CREATE INDEX IF NOT EXISTS idx_api_configurations_api_key ON api_configurations(api_key);
  ```
- **Exécution**: `npx supabase db push`

### 1.3 Mise à jour du fichier .env.example

- **Fichier**: `.env.example`
- **Contenu à ajouter**:
  ```
  # Clé de chiffrement pour les clés API (32 caractères hexadécimaux)
  ENCRYPTION_KEY=votre_clé_de_chiffrement_de_32_caractères
  ```
- **Vérification**: S'assurer que cette variable est définie dans `.env.local` et `.env.development`

## Phase 2: Standardisation du chiffrement des clés API

### 2.1 Mise à jour de contexts/ApiConfigContext.tsx

- **Fichier**: `contexts/ApiConfigContext.tsx`
- **Actions**:
  - Ajouter l'import pour les fonctions de chiffrement
  - Modifier la fonction `addConfig` pour chiffrer la clé API
  - Modifier la fonction `updateConfig` pour chiffrer la clé API
- **Code à ajouter**:
  ```typescript
  // Ajouter l'import
  import { encrypt } from '@/utils/encryption';

  // Dans la fonction addConfig, remplacer
  const { data, error } = await supabase
    .from('api_configurations')
    .insert({
      user_id: user.id,
      name: config.name,
      provider_id: providerId,
      model: config.model,
      api_key: config.key, // Note: Dans une implémentation réelle, cette clé devrait être chiffrée
      is_valid: true
    })
    .select('id')
    .single();

  // Par
  const encryptedApiKey = encrypt(config.key);
  const { data, error } = await supabase
    .from('api_configurations')
    .insert({
      user_id: user.id,
      name: config.name,
      provider_id: providerId,
      model: config.model,
      api_key: encryptedApiKey,
      is_valid: true
    })
    .select('id')
    .single();

  // Dans la fonction updateConfig, remplacer
  const { error } = await supabase
    .from('api_configurations')
    .update({
      name: config.name,
      model: config.model,
      api_key: config.key,
      is_valid: true,
      last_validated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id);

  // Par
  const encryptedApiKey = config.key ? encrypt(config.key) : undefined;
  const { error } = await supabase
    .from('api_configurations')
    .update({
      name: config.name,
      model: config.model,
      ...(encryptedApiKey ? { api_key: encryptedApiKey } : {}),
      is_valid: true,
      last_validated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id);
  ```

### 2.2 Mise à jour de app/api/validate-api-key/route.ts

- **Fichier**: `app/api/validate-api-key/route.ts`
- **Actions**:
  - Ajouter des fonctions de validation pour chaque fournisseur
  - Modifier la fonction POST pour utiliser ces fonctions de validation
- **Code à ajouter**:
  ```typescript
  // Fonctions de validation pour chaque fournisseur
  async function validateOpenAIKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return true;
      }
      
      const error = await response.json();
      console.error('Erreur de validation OpenAI:', error);
      return false;
    } catch (error) {
      console.error('Erreur lors de la validation de la clé OpenAI:', error);
      return false;
    }
  }

  async function validateStabilityKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.stability.ai/v1/engines/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return true;
      }
      
      const error = await response.json();
      console.error('Erreur de validation Stability:', error);
      return false;
    } catch (error) {
      console.error('Erreur lors de la validation de la clé Stability:', error);
      return false;
    }
  }

  async function validateGeminiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1/models', {
        method: 'GET',
        headers: {
          'x-goog-api-key': apiKey
        }
      });
      
      if (response.ok) {
        return true;
      }
      
      const error = await response.json();
      console.error('Erreur de validation Gemini:', error);
      return false;
    } catch (error) {
      console.error('Erreur lors de la validation de la clé Gemini:', error);
      return false;
    }
  }

  // Dans la fonction POST, ajouter
  let isValid = false;
  
  switch (validatedData.provider) {
    case 'openai':
      isValid = await validateOpenAIKey(validatedData.apiKey);
      break;
    case 'stability':
      isValid = await validateStabilityKey(validatedData.apiKey);
      break;
    case 'gemini':
      isValid = await validateGeminiKey(validatedData.apiKey);
      break;
    default:
      return NextResponse.json({ error: 'Fournisseur non supporté' }, { status: 400 });
  }
  
  return NextResponse.json({ isValid });
  ```
