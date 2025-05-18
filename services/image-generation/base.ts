/**
 * Base interfaces and types for image generation services
 * This file defines the common structure that all provider-specific services will implement
 */

/**
 * Common options for image generation across different providers
 */
export interface ImageGenerationOptions {
  /** Number of images to generate (default: 1) */
  count?: number;
  /** Size of the generated images (e.g., '1024x1024') */
  size?: string;
  /** Aspect ratio (e.g., '1:1', '16:9') */
  aspectRatio?: string;
  /** Quality of the generated images (e.g., 'standard', 'hd') */
  quality?: string;
  /** Style of the generated images (e.g., 'vivid', 'natural') */
  style?: string;
  /** Additional provider-specific parameters */
  additionalParams?: Record<string, any>;
}

/**
 * Response from image generation
 */
export interface ImageGenerationResult {
  /** URLs of the generated images */
  imageUrls: string[];
  /** Raw response data from the provider */
  rawResponse?: any;
  /** Additional metadata about the generation */
  metadata?: Record<string, any>;
}

/**
 * Interface for image generation services
 * All provider-specific services must implement this interface
 */
export interface ImageGenerationService {
  /**
   * Generate images based on a prompt
   * @param prompt Text prompt to generate images from
   * @param options Generation options
   * @returns Promise resolving to the generated image URLs
   */
  generateImages(prompt: string, options: ImageGenerationOptions): Promise<ImageGenerationResult>;

  /**
   * Validate an API key for this service
   * @param apiKey API key to validate
   * @returns Promise resolving to a validation result
   */
  validateApiKey(apiKey: string): Promise<ApiKeyValidationResult>;
}

/**
 * Result of API key validation
 */
export interface ApiKeyValidationResult {
  /** Whether the API key is valid */
  isValid: boolean;
  /** Message explaining the validation result */
  message: string;
  /** Additional provider-specific information */
  details?: Record<string, any>;
}

/**
 * Error types that can occur during image generation
 */
export enum ImageGenerationErrorType {
  AUTHENTICATION = 'authentication',
  BILLING = 'billing',           // Erreur liée aux crédits ou à la facturation
  RATE_LIMIT = 'rate_limit',
  CONTENT_POLICY = 'content_policy',
  INVALID_PROMPT = 'invalid_prompt',
  SERVER_ERROR = 'server_error',
  NETWORK_ERROR = 'network_error',
  UNKNOWN = 'unknown',
}

/**
 * Custom error class for image generation errors
 */
export class ImageGenerationError extends Error {
  type: ImageGenerationErrorType;
  statusCode?: number;
  retryable: boolean;

  constructor(
    message: string,
    type: ImageGenerationErrorType = ImageGenerationErrorType.UNKNOWN,
    statusCode?: number,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'ImageGenerationError';
    this.type = type;
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

/**
 * Helper function to determine if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (error instanceof ImageGenerationError) {
    return error.retryable;
  }

  // Network errors are generally retryable
  if (error.name === 'FetchError' || error.name === 'AbortError') {
    return true;
  }

  // Server errors (5xx) are generally retryable
  if (error.statusCode && error.statusCode >= 500 && error.statusCode < 600) {
    return true;
  }

  // Rate limit errors are retryable after a delay
  if (error.statusCode === 429) {
    return true;
  }

  return false;
}
