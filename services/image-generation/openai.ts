/**
 * OpenAI image generation service
 * Supports DALL-E 3 and GPT Image 1 models
 */

import {
  ImageGenerationService,
  ImageGenerationOptions,
  ImageGenerationResult,
  ApiKeyValidationResult,
  ImageGenerationError,
  ImageGenerationErrorType,
} from './base';

/**
 * OpenAI-specific image generation options
 */
interface OpenAIImageOptions extends ImageGenerationOptions {
  /** Response format (url or b64_json) */
  responseFormat?: 'url' | 'b64_json';
  /** User identifier for OpenAI (for tracking) */
  user?: string;
  /** Model to use (dall-e-3, gpt-image-1) */
  model?: string;
}

/**
 * OpenAI image generation service implementation
 */
export class OpenAIService implements ImageGenerationService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  /**
   * Create a new OpenAI service instance
   * @param apiKey OpenAI API key
   */
  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
    console.log(`OpenAIService - Initialized with baseUrl: ${this.baseUrl}`);
  }

  /**
   * Generate images using OpenAI's API
   * @param prompt Text prompt to generate images from
   * @param options Generation options
   * @returns Promise resolving to the generated image URLs
   */
  async generateImages(
    prompt: string,
    options: OpenAIImageOptions
  ): Promise<ImageGenerationResult> {
    console.log(`OpenAIService - Début de la génération d'images avec le modèle: ${options.model || 'dall-e-3'}`);
    console.log(`OpenAIService - URL de base: ${this.baseUrl}`);
    console.log(`OpenAIService - Clé API (masquée): ${this.apiKey.substring(0, 5)}...${this.apiKey.substring(this.apiKey.length - 5)}`);

    const {
      count = 1,
      size = '1024x1024',
      quality = 'standard',
      style = 'vivid',
      responseFormat = 'url',
      additionalParams = {},
      model = 'dall-e-3',
    } = options;

    // Determine the endpoint based on the model
    let endpoint = '';
    let requestBody: any = {};

    // Endpoint commun pour tous les modèles
    endpoint = `${this.baseUrl}/images/generations`;

    // Paramètres de base communs à tous les modèles
    requestBody = {
      model,
      prompt,
      n: count,
      size,
    };

    // Paramètres spécifiques selon le modèle
    if (model === 'gpt-image-1') {
      // GPT-image-1 n'accepte pas response_format, style ou quality
      console.log('OpenAIService - Utilisation du modèle GPT-image-1 (sans response_format)');
    } else {
      // DALL-E 3 accepte tous les paramètres
      console.log('OpenAIService - Utilisation du modèle DALL-E 3 avec tous les paramètres');
      requestBody.quality = quality;
      requestBody.style = style;
      requestBody.response_format = responseFormat;
    }

    // Ajouter les paramètres additionnels
    requestBody = {
      ...requestBody,
      ...additionalParams
    };

    // Sanitiser le prompt pour éviter les problèmes d'encodage
    const sanitizedPrompt = Array.from(prompt).filter(char => {
      const code = char.charCodeAt(0);
      return code < 128; // Garder uniquement les caractères ASCII
    }).join('');

    // Mettre à jour le prompt dans le corps de la requête
    if (model === 'gpt-image-1') {
      requestBody.prompt = sanitizedPrompt;
    } else {
      requestBody.prompt = sanitizedPrompt;
    }

    // Encoder explicitement le corps de la requête en UTF-8
    const encoder = new TextEncoder();
    const encodedBody = encoder.encode(JSON.stringify(requestBody));

    console.log(`OpenAIService - Prompt original: "${prompt.substring(0, 50)}..."`);
    console.log(`OpenAIService - Prompt sanitisé: "${sanitizedPrompt.substring(0, 50)}..."`);
    console.log(`OpenAIService - Longueur du prompt sanitisé: ${sanitizedPrompt.length} caractères`);

    // Implement retry logic
    let lastError: any = null;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        console.log(`OpenAIService - Tentative ${attempt + 1}/${this.maxRetries}`);

        // Vérifier que la clé API est valide
        if (!this.apiKey || this.apiKey.length < 10) {
          throw new ImageGenerationError(
            'Clé API OpenAI invalide ou manquante',
            ImageGenerationErrorType.AUTHENTICATION,
            401,
            false
          );
        }

        // S'assurer que la clé API commence par sk-
        if (!this.apiKey.startsWith('sk-')) {
          console.warn('OpenAIService - La clé API ne commence pas par sk-, tentative quand même');
        }

        // Nettoyer la clé API pour s'assurer qu'elle ne contient que des caractères valides
        const cleanApiKey = this.apiKey.replace(/[^\w\-]/g, '');
        console.log(`OpenAIService - Longueur de la clé API après nettoyage: ${cleanApiKey.length}`);

        // Utiliser la clé API nettoyée
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanApiKey}`,
          },
          body: encodedBody,
        });

        // Capture la réponse brute pour un meilleur débogage
        const responseText = await response.text();
        console.log(`OpenAIService - Statut de la réponse: ${response.status} ${response.statusText}`);

        // Parser la réponse en JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`OpenAIService - Erreur lors du parsing de la réponse:`, parseError);
          console.error(`OpenAIService - Réponse brute:`, responseText);
          throw new ImageGenerationError(
            `Erreur lors du parsing de la réponse: ${parseError.message}`,
            ImageGenerationErrorType.SERVER_ERROR,
            500,
            true
          );
        }

        if (!response.ok) {
          console.error(`OpenAIService - Erreur API:`, data);
          throw this.handleApiError(data, response.status);
        }

        // Extract image URLs from the response
        const imageUrls = data.data.map((image: any) => {
          // Pour GPT-image-1, il n'y a que des URLs (pas de b64_json)
          if (model === 'gpt-image-1') {
            return image.url;
          }

          // Pour DALL-E 3, vérifier le format de réponse
          return responseFormat === 'b64_json'
            ? `data:image/png;base64,${image.b64_json}`
            : image.url;
        });

        return {
          imageUrls,
          rawResponse: data,
          metadata: {
            model: model,
            prompt,
          },
        };
      } catch (error: any) {
        lastError = error;

        // Only retry if the error is retryable
        if (error instanceof ImageGenerationError && !error.retryable) {
          throw error;
        }

        // Wait before retrying
        if (attempt < this.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
        }
      }
    }

    // If we've exhausted all retries, throw the last error
    throw lastError || new ImageGenerationError(
      'Failed to generate images after multiple attempts',
      ImageGenerationErrorType.UNKNOWN
    );
  }

  /**
   * Validate an OpenAI API key
   * @param apiKey API key to validate
   * @returns Promise resolving to a validation result
   */
  async validateApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
    try {
      console.log(`OpenAIService - Validation de la clé API: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`);

      // Nettoyer la clé API pour s'assurer qu'elle ne contient que des caractères valides
      const cleanApiKey = apiKey.replace(/[^\w\-]/g, '');
      console.log(`OpenAIService - Longueur de la clé API après nettoyage: ${cleanApiKey.length}`);

      // Basic format validation
      if (!cleanApiKey.startsWith('sk-')) {
        console.warn('OpenAIService - La clé API ne commence pas par sk-');
        return {
          isValid: false,
          message: 'La clé API OpenAI doit commencer par "sk-"',
        };
      }

      // Validate by making a request to the models endpoint
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cleanApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      // Capture la réponse brute pour un meilleur débogage
      const responseText = await response.text();
      console.log(`OpenAIService - Validation - Statut de la réponse: ${response.status} ${response.statusText}`);

      // Parser la réponse en JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`OpenAIService - Validation - Erreur lors du parsing de la réponse:`, parseError);
        console.error(`OpenAIService - Validation - Réponse brute:`, responseText);
        return {
          isValid: false,
          message: `Erreur lors du parsing de la réponse: ${parseError.message}`,
        };
      }

      if (response.ok) {
        // Vérifier si les modèles d'image sont disponibles
        const models = data.data.map((model: any) => model.id);
        const hasImageModels = models.some((model: string) =>
          model === 'dall-e-3' || model === 'gpt-image-1'
        );

        return {
          isValid: true,
          message: 'Clé API OpenAI validée avec succès',
          details: {
            models,
            hasImageModels
          }
        };
      }

      const errorData = data;

      if (response.status === 401) {
        return {
          isValid: false,
          message: 'Clé API OpenAI invalide ou expirée',
          details: errorData,
        };
      }

      return {
        isValid: false,
        message: `Erreur OpenAI: ${errorData.error?.message || 'Erreur inconnue'}`,
        details: errorData,
      };
    } catch (error: any) {
      return {
        isValid: false,
        message: `Erreur de connexion à l'API OpenAI: ${error.message}`,
      };
    }
  }

  /**
   * Handle API errors from OpenAI
   * @param errorData Error data from the API
   * @param statusCode HTTP status code
   * @returns ImageGenerationError with appropriate type and retryable flag
   */
  private handleApiError(errorData: any, statusCode: number): ImageGenerationError {
    const errorMessage = errorData.error?.message || 'Unknown OpenAI API error';

    // Determine error type based on status code and error message
    let errorType = ImageGenerationErrorType.UNKNOWN;
    let retryable = false;

    if (statusCode === 401) {
      errorType = ImageGenerationErrorType.AUTHENTICATION;
      retryable = false;
    } else if (statusCode === 402 ||
              errorMessage.includes('quota') ||
              errorMessage.includes('billing') ||
              errorMessage.includes('credit') ||
              errorData.error?.code === 'billing_hard_limit_reached') {
      // Erreur de crédit - 402 Payment Required ou message contenant des mots-clés liés aux crédits
      console.log('OpenAIService - ERREUR DE CRÉDIT DÉTECTÉE');
      console.log(`OpenAIService - Code d'erreur: ${errorData.error?.code}`);
      errorType = ImageGenerationErrorType.BILLING;
      retryable = false;
    } else if (statusCode === 429) {
      errorType = ImageGenerationErrorType.RATE_LIMIT;
      retryable = true;
    } else if (statusCode === 400) {
      if (errorMessage.includes('content policy')) {
        errorType = ImageGenerationErrorType.CONTENT_POLICY;
        retryable = false;
      } else {
        errorType = ImageGenerationErrorType.INVALID_PROMPT;
        retryable = false;
      }
    } else if (statusCode >= 500) {
      errorType = ImageGenerationErrorType.SERVER_ERROR;
      retryable = true;
    }

    return new ImageGenerationError(
      errorMessage,
      errorType,
      statusCode,
      retryable
    );
  }
}
