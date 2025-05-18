# Plan d'implémentation du système BYOK (Bring Your Own Key)

Ce document détaille le plan d'implémentation pour corriger et améliorer le système BYOK (Bring Your Own Key) de Bambi AI, qui permet aux utilisateurs d'utiliser leurs propres clés API pour générer des images.

## Table des matières

1. [Fournisseurs d'API supportés](#fournisseurs-dapi-supportés)
2. [Correction des incohérences dans la base de données](#1-correction-des-incohérences-dans-la-base-de-données)
3. [Standardisation du chiffrement des clés API](#2-standardisation-du-chiffrement-des-clés-api)
4. [Validation des clés API](#3-validation-des-clés-api)
5. [Intégration avec les API d'images](#4-intégration-avec-les-api-dimages)
6. [Paramètres de génération d'images](#paramètres-de-génération-dimages)
7. [Interface utilisateur](#5-interface-utilisateur)
8. [Tests et débogage](#6-tests-et-débogage)
9. [Documentation](#7-documentation)
10. [Plan d'implémentation](#8-plan-dimplémentation)

## Fournisseurs d'API supportés

Bambi AI prend en charge plusieurs fournisseurs d'API pour la génération d'images. Chaque fournisseur offre des modèles et des capacités différentes.

### OpenAI

**Modèles disponibles :**
- **DALL-E 3** : Le modèle le plus avancé d'OpenAI, capable de générer des images détaillées à partir de descriptions textuelles complexes.
- **GPT Image 1** : Nouveau modèle d'OpenAI, alternative à DALL-E 3 avec des capacités différentes et une approche unique de génération d'images.

**Capacités :**
- Génération d'images haute résolution (1024x1024, 1024x1792, 1792x1024)
- Compréhension avancée des prompts en langage naturel
- Rendu de texte dans les images
- Styles artistiques variés

**Obtention d'une clé API :**
- Créer un compte sur [OpenAI Platform](https://platform.openai.com/)
- Accéder à la section "API Keys"
- Créer une nouvelle clé API
- Configurer les limites de dépenses

### Stability AI

**Modèles disponibles :**
- **Stable Diffusion XL** : Modèle avancé pour la génération d'images haute qualité.
- **Stable Diffusion 2.1** : Version précédente, équilibre entre qualité et performance.

**Capacités :**
- Génération d'images dans différentes résolutions
- Contrôle avancé des paramètres (steps, cfg_scale, etc.)
- Styles artistiques variés
- Options de seed pour la reproductibilité

**Obtention d'une clé API :**
- Créer un compte sur [Stability AI](https://stability.ai/)
- S'abonner à un plan payant
- Accéder au dashboard pour obtenir une clé API

### Google Imagen (Gemini API)

**Modèles disponibles :**
- **imagen-3.0-generate-002** : Modèle avancé de Google pour la génération d'images.

**Capacités :**
- Génération jusqu'à 4 images simultanément
- Formats d'aspect variés (1:1, 3:4, 4:3, 9:16, 16:9)
- Filtres de sécurité configurables
- Options pour la génération de personnes

**Obtention d'une clé API :**
- Créer un compte sur [Google AI Studio](https://aistudio.google.com/)
- Accéder à la section "API Keys"
- Créer une nouvelle clé API Gemini
- Configurer les limites de dépenses

## 1. Correction des incohérences dans la base de données

### Problèmes identifiés
- La table `api_configurations` utilise actuellement la colonne `api_key` pour stocker les clés API chiffrées
- Certaines parties du code font référence à `encrypted_api_key` qui n'existe pas
- Le plan d'implémentation initial prévoyait d'utiliser `encrypted_api_key` comme nom de colonne

### Actions à entreprendre
- **Décision de conception**: Utiliser `api_key` comme nom de colonne standard (plus simple que de renommer)
- **Mise à jour du code**: Modifier tout le code qui fait référence à `encrypted_api_key` pour utiliser `api_key` à la place
  - Fichier `app/api/generate-image/route.ts`
  - Autres fichiers qui pourraient faire référence à cette colonne
- **Documentation**: Ajouter un commentaire dans le schéma de la base de données pour indiquer que `api_key` contient des clés chiffrées
- **Performance**: Créer une migration pour ajouter un index sur la colonne `api_key` pour améliorer les performances

### Migration SQL
```sql
-- Migration pour ajouter un commentaire et un index à la colonne api_key
COMMENT ON COLUMN api_configurations.api_key IS 'Clé API chiffrée avec AES-256';
CREATE INDEX IF NOT EXISTS idx_api_configurations_api_key ON api_configurations(api_key);
```

## 2. Standardisation du chiffrement des clés API

### Problèmes identifiés
- Le fichier `utils/encryption.ts` contient les fonctions encrypt/decrypt utilisant CryptoJS
- `app/api/api-keys/route.ts` utilise correctement ces fonctions pour chiffrer les clés avant stockage
- `contexts/ApiConfigContext.tsx` ne chiffre pas les clés lors de l'ajout/mise à jour

### Actions à entreprendre
- **Mise à jour du contexte**: Modifier `contexts/ApiConfigContext.tsx` pour utiliser les fonctions encrypt/decrypt
  ```typescript
  // Avant d'insérer ou de mettre à jour une clé API
  import { encrypt } from '@/utils/encryption';
  const encryptedApiKey = encrypt(config.key);

  // Utiliser encryptedApiKey au lieu de config.key
  ```
- **Configuration**: Vérifier que la variable d'environnement `ENCRYPTION_KEY` est correctement définie dans tous les environnements
- **Tests**: Ajouter des tests pour vérifier que le chiffrement/déchiffrement fonctionne correctement
- **Sécurité avancée**: Implémenter une rotation des clés de chiffrement pour améliorer la sécurité

### Vérification de la variable d'environnement
Ajouter dans `.env.example` et s'assurer qu'elle est définie dans tous les environnements:
```
# Clé de chiffrement pour les clés API (32 caractères hexadécimaux)
ENCRYPTION_KEY=votre_clé_de_chiffrement_de_32_caractères
```

## 3. Validation des clés API

### Problèmes identifiés
- `app/api/validate-api-key/route.ts` existe mais n'est pas utilisé de manière cohérente
- Pas de validation complète des clés API avant leur utilisation
- Pas de vérification périodique de la validité des clés

### Actions à entreprendre
- **Amélioration de la validation**: Mettre à jour `app/api/validate-api-key/route.ts` pour tester réellement les clés API avec chaque fournisseur
  - Pour OpenAI: Appeler l'API `/v1/models` pour vérifier que la clé est valide
  - Pour Stability AI: Appeler l'API `/v1/engines/list` pour vérifier que la clé est valide
- **Validation à l'ajout**: Ajouter une validation lors de l'ajout/mise à jour des clés API
- **Vérification périodique**: Mettre en place un système de vérification périodique des clés (cron job)
- **Statut de validité**: Mettre à jour le statut de validité des clés dans la base de données

### Exemple de validation pour OpenAI
```typescript
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
```

### Exemple de validation pour Google Imagen (Gemini API)
```typescript
async function validateGeminiKey(apiKey: string): Promise<boolean> {
  try {
    // Appel à l'API Gemini pour vérifier la validité de la clé
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
```

## 4. Intégration avec les API d'images

### Problèmes identifiés
- `app/api/generate-image/route.ts` gère l'intégration avec OpenAI et Stability AI
- Pas de gestion d'erreur détaillée pour les différents types d'erreurs
- Pas de mécanismes de retry ou de fallback
- Pas de support pour Google Imagen (Gemini API)

### Actions à entreprendre
- **Refactorisation**: Restructurer `app/api/generate-image/route.ts` pour améliorer la gestion des erreurs
- **Classes spécifiques**: Créer des classes pour chaque fournisseur d'API
  - `services/image-generation/openai.ts`
  - `services/image-generation/stability.ts`
  - `services/image-generation/gemini.ts`
- **Mécanismes de retry**: Ajouter des mécanismes de retry pour les erreurs temporaires
- **Système de fallback**: Implémenter un système pour utiliser un autre fournisseur si le premier échoue
- **Logs détaillés**: Ajouter des logs pour faciliter le débogage

### Structure proposée pour les services d'image
```typescript
// services/image-generation/base.ts
export interface ImageGenerationService {
  generateImages(prompt: string, options: ImageGenerationOptions): Promise<string[]>;
  validateApiKey(apiKey: string): Promise<boolean>;
}

// Types communs pour les options de génération
export interface ImageGenerationOptions {
  count?: number;
  size?: string;
  aspectRatio?: string;
  additionalParams?: Record<string, any>;
}

// services/image-generation/openai.ts
export class OpenAIService implements ImageGenerationService {
  constructor(private apiKey: string) {}

  async generateImages(prompt: string, options: ImageGenerationOptions): Promise<string[]> {
    const { count = 1, size = '1024x1024', additionalParams = {} } = options;

    // Appel à l'API OpenAI avec les paramètres spécifiques
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        prompt,
        n: count,
        size,
        response_format: 'url',
        ...additionalParams
      })
    });

    // Traitement de la réponse
    // ...
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    // Validation spécifique à OpenAI
    // ...
  }
}

// services/image-generation/stability.ts
export class StabilityService implements ImageGenerationService {
  // Implémentation similaire à OpenAI mais avec les paramètres spécifiques à Stability
  // ...
}

// services/image-generation/gemini.ts
export class GeminiService implements ImageGenerationService {
  constructor(private apiKey: string) {}

  async generateImages(prompt: string, options: ImageGenerationOptions): Promise<string[]> {
    const { count = 1, aspectRatio = '1:1', additionalParams = {} } = options;

    // Appel à l'API Gemini avec les paramètres spécifiques
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/imagen-3.0-generate-002:generateImages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey
      },
      body: JSON.stringify({
        prompt: {
          text: prompt
        },
        number_of_images: count,
        aspect_ratio: aspectRatio,
        safety_filter_level: additionalParams.safetyFilterLevel || 'BLOCK_MEDIUM_AND_ABOVE',
        person_generation: additionalParams.personGeneration || 'ALLOW_ADULT',
        ...additionalParams
      })
    });

    // Traitement de la réponse
    // ...
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    // Validation spécifique à Gemini
    // ...
  }
}
```

## Paramètres de génération d'images

Chaque fournisseur d'API offre des paramètres spécifiques pour la génération d'images. Cette section détaille ces paramètres et comment ils sont exposés dans l'interface utilisateur.

### Paramètres communs

- **Prompt** : Description textuelle de l'image à générer
- **Nombre d'images** : Nombre d'images à générer (généralement limité à 1-4)
- **Format/Taille** : Dimensions ou ratio d'aspect de l'image

### Paramètres spécifiques à OpenAI (DALL-E 3 et GPT Image 1)

#### DALL-E 3
- **Taille** : 1024x1024 (carré), 1024x1792 (portrait), 1792x1024 (paysage)
- **Qualité** : standard ou hd
- **Style** : vivid ou natural

#### GPT Image 1
- **Taille** : 1024x1024 (standard)
- **Nombre d'images** : 1 à 4 images par requête
- **Paramètres avancés** : options spécifiques au modèle GPT Image 1

### Paramètres spécifiques à Stability AI

- **Steps** : Nombre d'étapes de diffusion (plus élevé = plus détaillé mais plus lent)
- **CFG Scale** : Degré d'adhérence au prompt (plus élevé = plus fidèle au prompt)
- **Seed** : Valeur pour la reproductibilité des résultats

### Paramètres spécifiques à Google Imagen (Gemini API)

- **Aspect Ratio** : Format de l'image (1:1, 3:4, 4:3, 9:16, 16:9)
- **Safety Filter Level** : Niveau de filtrage de sécurité
- **Person Generation** : Options pour la génération d'images de personnes

### Interface utilisateur

L'interface utilisateur doit exposer ces paramètres de manière intuitive :

- Paramètres de base visibles directement dans l'interface principale
- Paramètres avancés accessibles via un menu déroulant ou un bouton "Paramètres avancés"
- Préréglages pour les combinaisons courantes de paramètres
- Tooltips explicatifs pour chaque paramètre

## 5. Interface utilisateur

### Problèmes identifiés
- Composants `ApiKeyManager.tsx`, `ApiKeyManagerModal.tsx`, `ApiKeyManagerDetails.tsx` existent
- Pas de retour clair sur la validité des clés
- Pas de guide pour obtenir et configurer correctement les clés API
- Pas de support pour tous les fournisseurs d'API (notamment Google Imagen)

### Actions à entreprendre
- **Amélioration des composants**: Mettre à jour les composants existants pour fournir des retours clairs sur la validité des clés
- **Indicateurs visuels**: Ajouter des indicateurs pour montrer le statut des clés (valide, invalide, en cours de validation)
- **Guides**: Créer des guides étape par étape pour obtenir des clés API pour chaque fournisseur
- **Aide contextuelle**: Implémenter des tooltips et des messages d'aide
- **Prévisualisation**: Ajouter une prévisualisation des modèles disponibles pour chaque fournisseur
- **Paramètres avancés**: Ajouter une interface pour configurer les paramètres spécifiques à chaque fournisseur

### Exemple d'indicateur de statut
```tsx
const ApiKeyStatus = ({ isValid, isValidating }) => {
  if (isValidating) {
    return <Badge color="yellow">Validation en cours...</Badge>;
  }

  return isValid
    ? <Badge color="green">Clé valide</Badge>
    : <Badge color="red">Clé invalide</Badge>;
};
```

## 6. Tests et débogage

### Problèmes identifiés
- Pas de tests automatisés pour le système BYOK
- Logs limités pour le débogage
- Pas de scénarios de test pour les différents cas d'utilisation

### Actions à entreprendre
- **Tests unitaires**: Créer des tests pour les fonctions de chiffrement/déchiffrement
- **Tests d'intégration**: Implémenter des tests pour la validation des clés API
- **Tests end-to-end**: Ajouter des tests pour le flux complet de génération d'images
- **Logs améliorés**: Améliorer les logs pour inclure des informations détaillées sur les erreurs
- **Scénarios de test**: Créer des scénarios pour les différents cas d'utilisation

### Exemple de test unitaire pour le chiffrement
```typescript
import { encrypt, decrypt } from '@/utils/encryption';

describe('Encryption utils', () => {
  it('should encrypt and decrypt correctly', () => {
    const originalText = 'ma_clé_api_secrète';
    const encrypted = encrypt(originalText);

    // L'encrypted ne doit pas être égal au texte original
    expect(encrypted).not.toEqual(originalText);

    // Le déchiffrement doit donner le texte original
    const decrypted = decrypt(encrypted);
    expect(decrypted).toEqual(originalText);
  });
});
```

## 7. Documentation

### Problèmes identifiés
- Documentation limitée pour le système BYOK
- Pas de guide pour les utilisateurs
- Pas de documentation technique pour les développeurs
- Pas d'information sur les limites et quotas des différents fournisseurs

### Actions à entreprendre
- **Guide utilisateur**: Créer un guide pour expliquer comment obtenir et configurer des clés API
- **Documentation technique**: Documenter l'architecture du système BYOK
- **Exemples d'utilisation**: Fournir des exemples pour chaque fournisseur d'API
- **Guide de dépannage**: Créer un guide pour les problèmes courants
- **Documentation des limites**: Documenter les limites et les quotas pour chaque fournisseur

### Guides pour obtenir des clés API

#### OpenAI (DALL-E 3 et GPT Image 1)
1. Créer un compte sur [OpenAI Platform](https://platform.openai.com/)
2. Accéder à la section "API Keys" dans le menu de gauche
3. Cliquer sur "Create new secret key"
4. Donner un nom à la clé (ex: "Bambi AI")
5. Copier la clé générée (elle ne sera plus jamais affichée)
6. Configurer les limites de dépenses dans "Billing" pour éviter les surprises

#### Stability AI
1. Créer un compte sur [Stability AI](https://stability.ai/)
2. S'abonner à un plan payant
3. Accéder au dashboard
4. Générer une nouvelle clé API
5. Copier la clé générée

#### Google Imagen (Gemini API)
1. Créer un compte sur [Google AI Studio](https://aistudio.google.com/)
2. Accéder à la section "API Keys"
3. Créer une nouvelle clé API Gemini
4. Copier la clé générée
5. Activer la facturation si nécessaire

### Limites et quotas par fournisseur

#### OpenAI (DALL-E 3 et GPT Image 1)
- Limites basées sur les dépenses configurées
- Tarification à l'usage (par image générée)
- Différents prix selon le modèle et la taille
- GPT Image 1 peut avoir des quotas et tarifs différents de DALL-E 3

#### Stability AI
- Limites basées sur le plan d'abonnement
- Certains plans offrent un nombre fixe de générations par mois
- Tarification supplémentaire à l'usage au-delà du quota

#### Google Imagen (Gemini API)
- Niveau gratuit limité
- Tarification à l'usage pour le niveau payant
- Limites de requêtes par minute

## 8. Plan d'implémentation

### Phase 1: Correction des incohérences (Priorité: Haute)
1. Mettre à jour `app/api/generate-image/route.ts` pour utiliser `api_key` au lieu de `encrypted_api_key`
2. Créer une migration pour ajouter un commentaire et un index à la colonne `api_key`
3. Vérifier que la variable d'environnement `ENCRYPTION_KEY` est correctement définie

### Phase 2: Amélioration de la validation des clés API (Priorité: Haute)
1. Mettre à jour `app/api/validate-api-key/route.ts` pour tester réellement les clés API
2. Modifier `contexts/ApiConfigContext.tsx` pour utiliser les fonctions encrypt/decrypt
3. Ajouter une validation lors de l'ajout/mise à jour des clés API

### Phase 3: Refactorisation de l'intégration avec les API d'images (Priorité: Haute)
1. Créer des classes spécifiques pour chaque fournisseur d'API (OpenAI, Stability AI, Google Imagen)
2. Refactoriser `app/api/generate-image/route.ts` pour utiliser ces classes
3. Ajouter des mécanismes de retry et de fallback
4. Implémenter le support pour les paramètres spécifiques à chaque fournisseur

### Phase 4: Amélioration de l'interface utilisateur (Priorité: Moyenne)
1. Mettre à jour les composants existants pour fournir des retours clairs sur la validité des clés
2. Ajouter des indicateurs visuels pour montrer le statut des clés
3. Créer des guides étape par étape pour obtenir des clés API
4. Implémenter une interface pour configurer les paramètres spécifiques à chaque fournisseur
5. Ajouter le support pour Google Imagen (Gemini API) dans l'interface utilisateur

### Phase 5: Tests et débogage (Priorité: Moyenne)
1. Créer des tests unitaires pour les fonctions de chiffrement/déchiffrement
2. Implémenter des tests d'intégration pour la validation des clés API
3. Ajouter des logs détaillés pour faciliter le débogage

### Phase 6: Documentation (Priorité: Basse)
1. Créer un guide utilisateur pour expliquer comment obtenir et configurer des clés API
2. Documenter l'architecture technique du système BYOK
3. Fournir des exemples d'utilisation pour chaque fournisseur d'API
4. Documenter les limites et quotas pour chaque fournisseur
5. Créer un guide de dépannage pour les problèmes courants
