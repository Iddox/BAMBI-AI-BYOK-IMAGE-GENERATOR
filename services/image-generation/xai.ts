/**
 * xAI image generation service
 * Supports Grok-2-image-1212 model
 *
 * Documentation officielle: https://docs.x.ai/docs/guides/image-generations
 *
 * Limitations:
 * - Ne supporte pas le paramètre 'size' (taille fixe)
 * - Ne supporte pas les paramètres de qualité ou de style
 * - Maximum 10 images par requête
 * - Maximum 5 requêtes par seconde
 * - Format JPG uniquement
 * - Prix: $0.07 par image
 */

import {
  ImageGenerationService,
  ImageGenerationOptions,
  ImageGenerationResult,
  ApiKeyValidationResult,
  ImageGenerationError,
  ImageGenerationErrorType,
} from './base';
import { sanitizePrompt } from '@/utils/text-sanitizer';

/**
 * xAI-specific image generation options
 */
interface XAIImageOptions extends ImageGenerationOptions {
  /** Image format (default: png) */
  format?: 'png' | 'jpeg';
  /** Whether to return base64 encoded images (default: false) */
  returnBase64?: boolean;
}

/**
 * xAI image generation service implementation
 */
export class XAIService implements ImageGenerationService {
  private apiKey: string;
  private baseUrl: string = 'https://api.x.ai/v1';
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  /**
   * Create a new xAI service instance
   * @param apiKey xAI API key
   */
  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
    console.log(`XAIService - Initialized with baseUrl: ${this.baseUrl}`);
  }

  /**
   * Generate images using xAI's API
   * @param prompt Text prompt to generate images from
   * @param options Generation options
   * @returns Promise resolving to the generated image URLs
   */
  async generateImages(
    prompt: string,
    options: XAIImageOptions
  ): Promise<ImageGenerationResult> {
    const {
      count = 1,
      size = '1024x1024',
      format = 'png',
      returnBase64 = false,
      additionalParams = {},
    } = options;

    // Construct the endpoint
    const endpoint = `${this.baseUrl}/images/generations`;

    // Approche radicale pour résoudre le problème d'encodage ByteString
    // Créer un nouvel objet avec des valeurs strictement contrôlées

    // Convertir d'abord en chaîne pour éviter les problèmes avec les types non-string
    const promptString = String(prompt);

    // Nettoyer le prompt de manière très stricte - caractère par caractère
    const asciiOnly = [];
    for (let i = 0; i < promptString.length; i++) {
      const charCode = promptString.charCodeAt(i);
      // Ne garder que les caractères ASCII imprimables (32-126)
      if (charCode >= 32 && charCode <= 126) {
        asciiOnly.push(promptString.charAt(i));
      } else {
        asciiOnly.push(' '); // Remplacer par un espace
      }
    }

    // Joindre les caractères en une chaîne
    const sanitizedPrompt = asciiOnly.join('');

    // Vérifier si le prompt est vide après sanitisation
    if (!sanitizedPrompt || sanitizedPrompt.trim() === '') {
      throw new ImageGenerationError(
        'Le prompt est vide après sanitisation. Veuillez utiliser uniquement des caractères ASCII standard.',
        ImageGenerationErrorType.INVALID_PROMPT,
        400,
        true
      );
    }

    console.log(`xAI API - Prompt original: "${promptString}"`);
    console.log(`xAI API - Prompt sanitisé: "${sanitizedPrompt}"`);
    console.log(`xAI API - Longueur du prompt sanitisé: ${sanitizedPrompt.length} caractères`);

    // Prepare the request body
    // Note: xAI API ne supporte que les paramètres model, prompt, n et response_format
    // Les paramètres size, quality, style ne sont pas supportés
    const requestBody = {
      model: 'grok-2-image-1212',
      prompt: sanitizedPrompt,
      n: Math.min(count, 10), // Maximum 10 images par requête
      response_format: returnBase64 ? 'b64_json' : 'url'
      // Ne pas inclure additionalParams car ils pourraient contenir des paramètres non supportés
    };

    // Log des paramètres de la requête pour le débogage
    console.log(`xAI API request parameters: ${JSON.stringify(requestBody, null, 2)}`);

    // Implement retry logic
    let lastError: any = null;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Convertir le corps de la requête en JSON avec gestion des erreurs
        let requestBodyJson;
        try {
          // Vérifier que le prompt est bien une chaîne de caractères ASCII valide
          if (typeof requestBody.prompt !== 'string') {
            console.error(`xAI API - Le prompt n'est pas une chaîne de caractères valide:`, requestBody.prompt);
            throw new Error('Le prompt doit être une chaîne de caractères');
          }

          // Vérifier et nettoyer le prompt une dernière fois - caractère par caractère
          const asciiOnly = [];
          for (let i = 0; i < requestBody.prompt.length; i++) {
            const charCode = requestBody.prompt.charCodeAt(i);
            // Ne garder que les caractères ASCII imprimables (32-126)
            if (charCode >= 32 && charCode <= 126) {
              asciiOnly.push(requestBody.prompt.charAt(i));
            } else {
              asciiOnly.push(' '); // Remplacer par un espace
            }
          }
          const cleanedPrompt = asciiOnly.join('');

          // Vérifier si le prompt a été modifié par le nettoyage
          if (cleanedPrompt !== requestBody.prompt) {
            console.warn(`xAI API - Le prompt a été modifié par le nettoyage:
            Original: "${requestBody.prompt}"
            Nettoyé: "${cleanedPrompt}"`);
          }

          // Utiliser le prompt nettoyé
          requestBody.prompt = cleanedPrompt;

          // Vérifier si le prompt est vide après nettoyage
          if (!cleanedPrompt || cleanedPrompt.trim() === '') {
            console.error(`xAI API - Le prompt est vide après nettoyage`);
            throw new ImageGenerationError(
              'Le prompt est vide après nettoyage. Veuillez utiliser uniquement des caractères ASCII standard.',
              ImageGenerationErrorType.INVALID_PROMPT,
              400,
              true
            );
          }

          // Convertir en JSON avec gestion des erreurs
          try {
            requestBodyJson = JSON.stringify(requestBody);
          } catch (jsonError) {
            console.error(`xAI API - Erreur lors de la conversion en JSON:`, jsonError);
            console.error(`xAI API - Contenu du requestBody:`, requestBody);
            throw new ImageGenerationError(
              'Erreur lors de la conversion du prompt en JSON. Veuillez utiliser uniquement des caractères ASCII standard.',
              ImageGenerationErrorType.INVALID_PROMPT,
              400,
              true
            );
          }
        } catch (jsonError: any) {
          console.error(`xAI API - Erreur lors de la conversion du corps de la requête en JSON:`, jsonError);
          throw new ImageGenerationError(
            `Erreur de formatage du prompt: ${jsonError.message}`,
            ImageGenerationErrorType.INVALID_PROMPT,
            400,
            false
          );
        }

        // Vérifier que le JSON est valide et ne contient pas de caractères problématiques
        if (requestBodyJson.includes('\uFFFD')) {
          console.error(`xAI API - Le corps de la requête contient des caractères de remplacement Unicode`);
          throw new ImageGenerationError(
            `Le prompt contient des caractères non supportés par l'API xAI`,
            ImageGenerationErrorType.INVALID_PROMPT,
            400,
            false
          );
        }

        // Log pour débogage
        console.log(`xAI API - Requête JSON finale: ${requestBodyJson}`);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'X-API-Key': this.apiKey
          },
          body: requestBodyJson,
        });

        // Capture la réponse brute pour un meilleur débogage
        const responseText = await response.text();
        console.log(`xAI API response status: ${response.status} ${response.statusText}`);

        try {
          const responseData = JSON.parse(responseText);

          if (!response.ok) {
            console.log(`xAI API error: ${JSON.stringify(responseData, null, 2)}`);
            throw this.handleApiError(responseData, response.status);
          }

          const data = responseData;

          // Extract image URLs from the response
          const imageUrls = data.data.map((image: any) =>
            returnBase64
              ? `data:image/${format};base64,${image.b64_json}`
              : image.url
          );

          return {
            imageUrls,
            rawResponse: data,
            metadata: {
              model: 'grok-2-image-1212',
              prompt,
            },
          };
        } catch (parseError: any) {
          console.log(`Error parsing xAI API response: ${parseError.message}`);
          console.log(`Raw response: ${responseText}`);
          throw new ImageGenerationError(
            `Failed to parse xAI API response: ${parseError.message}`,
            ImageGenerationErrorType.SERVER_ERROR,
            500,
            true
          );
        }
      } catch (error: any) {
        lastError = error;

        // Gérer spécifiquement les erreurs d'encodage ByteString
        if (error.message && error.message.includes('ByteString')) {
          console.error(`xAI API - Erreur d'encodage ByteString:`, error.message);
          throw new ImageGenerationError(
            `Erreur d'encodage: Le prompt contient des caractères non supportés par l'API xAI. Veuillez utiliser uniquement des caractères ASCII standard.`,
            ImageGenerationErrorType.INVALID_PROMPT,
            400,
            false
          );
        }

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
   * Validate an xAI API key
   * @param apiKey API key to validate
   * @returns Promise resolving to a validation result
   */
  async validateApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
    try {
      // Validate by making a request to the models endpoint
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Vérifier si le modèle grok-2-image-1212 est disponible
        const data = await response.json();
        const models = data.data.map((model: any) => model.id);
        const hasImageModel = models.includes('grok-2-image-1212');

        if (hasImageModel) {
          return {
            isValid: true,
            message: 'Clé API xAI validée avec succès',
            details: {
              models,
              hasImageModel: true
            }
          };
        } else {
          return {
            isValid: true,
            message: 'Clé API xAI validée, mais le modèle grok-2-image-1212 n\'est pas disponible',
            details: {
              models,
              hasImageModel: false,
              warning: 'Le modèle grok-2-image-1212 n\'est pas disponible avec cette clé API'
            }
          };
        }
      }

      const errorData = await response.json();

      if (response.status === 401) {
        return {
          isValid: false,
          message: 'Clé API xAI invalide ou expirée',
          details: errorData,
        };
      }

      return {
        isValid: false,
        message: `Erreur xAI: ${errorData.error?.message || 'Erreur inconnue'}`,
        details: errorData,
      };
    } catch (error: any) {
      return {
        isValid: false,
        message: `Erreur de connexion à l'API xAI: ${error.message}`,
      };
    }
  }

  /**
   * Handle API errors from xAI
   * @param errorData Error data from the API
   * @param statusCode HTTP status code
   * @returns ImageGenerationError with appropriate type and retryable flag
   */
  private handleApiError(errorData: any, statusCode: number): ImageGenerationError {
    const errorMessage = errorData.error?.message || 'Unknown xAI API error';
    const errorCode = errorData.error?.code || 'unknown';
    const errorType = errorData.error?.type || 'unknown';

    // Log detailed error information for debugging
    console.log(`xAI API Error Details:
      Status Code: ${statusCode}
      Error Message: ${errorMessage}
      Error Code: ${errorCode}
      Error Type: ${errorType}
      Full Error Data: ${JSON.stringify(errorData, null, 2)}
    `);

    // Determine error type based on status code and error message
    let imageErrorType = ImageGenerationErrorType.UNKNOWN;
    let retryable = false;
    let detailedMessage = `xAI API Error: ${errorMessage} (Code: ${errorCode}, Type: ${errorType})`;

    if (statusCode === 401) {
      imageErrorType = ImageGenerationErrorType.AUTHENTICATION;
      detailedMessage = `Erreur d'authentification xAI: Clé API invalide ou expirée. ${errorMessage}`;
      retryable = false;
    } else if (statusCode === 429) {
      imageErrorType = ImageGenerationErrorType.RATE_LIMIT;
      detailedMessage = `Limite de taux xAI dépassée: Veuillez réessayer plus tard. ${errorMessage}`;
      retryable = true;
    } else if (statusCode === 400) {
      if (errorMessage.includes('content policy') || errorMessage.includes('safety')) {
        imageErrorType = ImageGenerationErrorType.CONTENT_POLICY;
        detailedMessage = `Violation de la politique de contenu xAI: Le prompt contient du contenu interdit. ${errorMessage}`;
        retryable = false;
      } else {
        imageErrorType = ImageGenerationErrorType.INVALID_PROMPT;
        detailedMessage = `Prompt invalide pour xAI: ${errorMessage}`;
        retryable = false;
      }
    } else if (statusCode >= 500) {
      imageErrorType = ImageGenerationErrorType.SERVER_ERROR;
      detailedMessage = `Erreur serveur xAI: Veuillez réessayer plus tard. ${errorMessage}`;
      retryable = true;
    }

    return new ImageGenerationError(
      detailedMessage,
      imageErrorType,
      statusCode,
      retryable,
      errorData // Inclure les données d'erreur complètes pour référence
    );
  }
}
