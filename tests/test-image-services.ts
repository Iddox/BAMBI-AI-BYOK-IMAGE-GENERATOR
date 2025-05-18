/**
 * Test script for image generation services
 * 
 * This script tests the image generation services with mock API keys.
 * It's for development purposes only and not meant to be run in production.
 */

import { createImageGenerationService } from '../services/image-generation/factory';
import { ImageGenerationError } from '../services/image-generation/base';

// Mock API keys (these are not real keys)
const MOCK_KEYS = {
  openai: 'sk-mock-openai-key',
  gemini: 'mock-gemini-key',
  xai: 'mock-xai-key',
};

// Test function for a specific provider
async function testProvider(provider: string) {
  console.log(`\n=== Testing ${provider} service ===`);
  
  try {
    // Create the service
    const service = createImageGenerationService(provider, MOCK_KEYS[provider as keyof typeof MOCK_KEYS]);
    
    // Test API key validation
    console.log('Testing API key validation...');
    try {
      const validationResult = await service.validateApiKey(MOCK_KEYS[provider as keyof typeof MOCK_KEYS]);
      console.log('Validation result:', validationResult);
    } catch (error) {
      console.error('Validation error:', error instanceof ImageGenerationError 
        ? `${error.type}: ${error.message}` 
        : error);
    }
    
    // Test image generation
    console.log('Testing image generation...');
    try {
      const result = await service.generateImages('A beautiful sunset over the ocean', {
        count: 1,
        size: '1024x1024',
      });
      console.log('Generation result:', result);
    } catch (error) {
      console.error('Generation error:', error instanceof ImageGenerationError 
        ? `${error.type}: ${error.message}` 
        : error);
    }
  } catch (error) {
    console.error(`Error creating ${provider} service:`, error);
  }
}

// Main test function
async function runTests() {
  console.log('=== Image Generation Services Test ===');
  
  // Test each provider
  await testProvider('openai');
  await testProvider('gemini');
  await testProvider('xai');
  
  console.log('\n=== Tests completed ===');
}

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error);
});
