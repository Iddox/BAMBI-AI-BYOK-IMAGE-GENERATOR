/**
 * Google Imagen (Gemini API) image generation service
 * Supports Imagen 3 model
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
 * Google Imagen-specific image generation options
 */
interface GeminiImageOptions extends ImageGenerationOptions {
  /** Safety filter level (default: BLOCK_MEDIUM_AND_ABOVE) */
  safetyFilterLevel?: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
  /** Person generation setting (default: ALLOW_ADULT) */
  personGeneration?: 'ALLOW_ADULT' | 'ALLOW_ALL' | 'BLOCK_ALL';
  /** Model to use (imagen-3.0-generate-002) */
  model?: string;
}

/**
 * Google Imagen (Gemini API) image generation service implementation
 */
export class GeminiService implements ImageGenerationService {
  private apiKey: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1';
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  /**
   * Create a new Gemini service instance
   * @param apiKey Google API key
   */
  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
    console.log(`GeminiService - Initialized with baseUrl: ${this.baseUrl}`);
  }

  /**
   * Generate images using Google's Imagen API
   * @param prompt Text prompt to generate images from
   * @param options Generation options
   * @returns Promise resolving to the generated image URLs
   */
  async generateImages(
    prompt: string,
    options: GeminiImageOptions
  ): Promise<ImageGenerationResult> {
    const {
      count = 1,
      aspectRatio = '1:1',
      safetyFilterLevel = 'BLOCK_MEDIUM_AND_ABOVE',
      personGeneration = 'ALLOW_ADULT',
      additionalParams = {},
      model = 'imagen-3.0-generate-002',
    } = options;

    // Construct the request URL with API key
    const endpoint = `${this.baseUrl}/models/${model}:generateImages?key=${this.apiKey}`;

    // Prepare the request body
    const requestBody = {
      prompt: {
        text: prompt
      },
      number_of_images: count,
      aspect_ratio: aspectRatio,
      safety_filter_level: safetyFilterLevel,
      person_generation: personGeneration,
      ...additionalParams
    };

    // Implement retry logic
    let lastError: any = null;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw this.handleApiError(errorData, response.status);
        }

        const data = await response.json();

        // Extract image URLs from the response
        // The structure is different from OpenAI's response
        const imageUrls = data.images.map((image: any) => image.base64
          ? `data:image/png;base64,${image.base64}`
          : image.url
        );

        return {
          imageUrls,
          rawResponse: data,
          metadata: {
            model,
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
   * Validate a Google API key
   * @param apiKey API key to validate
   * @returns Promise resolving to a validation result
   */
  async validateApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
    try {
      // Validate by making a request to the models endpoint
      const response = await fetch(`${this.baseUrl}/models?key=${apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return {
          isValid: true,
          message: 'Clé API Google Imagen (Gemini) validée avec succès',
        };
      }

      const errorData = await response.json();

      if (response.status === 400 && errorData.error?.status === 'INVALID_ARGUMENT') {
        return {
          isValid: false,
          message: 'Clé API Google Imagen (Gemini) invalide',
          details: errorData,
        };
      }

      return {
        isValid: false,
        message: `Erreur Google Imagen: ${errorData.error?.message || 'Erreur inconnue'}`,
        details: errorData,
      };
    } catch (error: any) {
      return {
        isValid: false,
        message: `Erreur de connexion à l'API Google Imagen (Gemini): ${error.message}`,
      };
    }
  }

  /**
   * Handle API errors from Google Imagen
   * @param errorData Error data from the API
   * @param statusCode HTTP status code
   * @returns ImageGenerationError with appropriate type and retryable flag
   */
  private handleApiError(errorData: any, statusCode: number): ImageGenerationError {
    const errorMessage = errorData.error?.message || 'Unknown Google Imagen API error';
    const errorStatus = errorData.error?.status || '';

    // Determine error type based on status code and error message
    let errorType = ImageGenerationErrorType.UNKNOWN;
    let retryable = false;

    if (errorStatus === 'PERMISSION_DENIED' || errorStatus === 'UNAUTHENTICATED') {
      errorType = ImageGenerationErrorType.AUTHENTICATION;
      retryable = false;
    } else if (errorStatus === 'RESOURCE_EXHAUSTED') {
      errorType = ImageGenerationErrorType.RATE_LIMIT;
      retryable = true;
    } else if (errorStatus === 'INVALID_ARGUMENT') {
      if (errorMessage.includes('safety') || errorMessage.includes('content')) {
        errorType = ImageGenerationErrorType.CONTENT_POLICY;
        retryable = false;
      } else {
        errorType = ImageGenerationErrorType.INVALID_PROMPT;
        retryable = false;
      }
    } else if (errorStatus === 'INTERNAL' || errorStatus === 'UNAVAILABLE') {
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
