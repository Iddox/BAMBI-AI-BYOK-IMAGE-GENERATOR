/**
 * Factory for creating image generation services
 */

import { ImageGenerationService } from './base';
import { OpenAIService } from './openai';
import { GeminiService } from './gemini';
import { XAIService } from './xai';
import { OpenAIMockService } from './openai-mock';

/**
 * Create an image generation service based on the provider
 * @param provider Provider slug (e.g., 'openai', 'gemini', 'xai')
 * @param apiKey API key for the provider
 * @param baseUrl Optional base URL for the API
 * @returns An instance of the appropriate image generation service
 * @throws Error if the provider is not supported
 */
export function createImageGenerationService(
  provider: string,
  apiKey: string,
  baseUrl?: string,
  useMock: boolean = false
): ImageGenerationService {
  console.log(`Factory - Creating image generation service for provider: ${provider}, useMock: ${useMock}`);

  // Normaliser le fournisseur pour éviter les problèmes de casse
  const normalizedProvider = provider.toLowerCase().trim();

  // Vérifier si la clé API est valide
  if (!apiKey || apiKey.length < 10) {
    console.warn(`Factory - Clé API potentiellement invalide pour ${normalizedProvider}: longueur ${apiKey?.length || 0}`);
  }

  switch (normalizedProvider) {
    case 'openai':
      console.log(`Factory - Creating OpenAIService with baseUrl: ${baseUrl || 'default'}`);
      return useMock
        ? new OpenAIMockService(apiKey, baseUrl)
        : new OpenAIService(apiKey, baseUrl);
    case 'gemini':
    case 'google':
      console.log(`Factory - Creating GeminiService with baseUrl: ${baseUrl || 'default'}`);
      return new GeminiService(apiKey, baseUrl);
    case 'xai':
      console.log(`Factory - Creating XAIService with baseUrl: ${baseUrl || 'default'}`);
      return new XAIService(apiKey, baseUrl);
    default:
      console.error(`Factory - Unsupported provider: ${normalizedProvider}, falling back to OpenAI`);
      // Fallback à OpenAI en cas de fournisseur non reconnu
      return useMock
        ? new OpenAIMockService(apiKey, baseUrl)
        : new OpenAIService(apiKey, baseUrl);
  }
}

/**
 * Validate an API key for a specific provider
 * @param provider Provider slug (e.g., 'openai', 'gemini', 'xai')
 * @param apiKey API key to validate
 * @param useMock Whether to use a mock service for validation
 * @returns Promise resolving to a validation result
 * @throws Error if the provider is not supported
 */
export async function validateApiKeyForProvider(
  provider: string,
  apiKey: string,
  useMock: boolean = false
) {
  const service = createImageGenerationService(provider, apiKey, undefined, useMock);
  return await service.validateApiKey(apiKey);
}
