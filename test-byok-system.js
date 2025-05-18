// Script de test pour le système BYOK complet
// Exécuter avec: node test-byok-system.js

require('dotenv').config({ path: '.env.local' });
const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

// Fonctions de chiffrement/déchiffrement (copiées de utils/encryption.ts)
function encrypt(text) {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  }
  
  return CryptoJS.AES.encrypt(text, process.env.ENCRYPTION_KEY).toString();
}

function decrypt(encryptedText) {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  }
  
  const bytes = CryptoJS.AES.decrypt(encryptedText, process.env.ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Fonction pour valider une clé API
async function validateApiKey(provider, apiKey) {
  console.log(`Validation de la clé API ${provider}...`);
  
  let endpoint = '';
  let headers = {};
  
  switch (provider.toLowerCase()) {
    case 'openai':
      endpoint = 'https://api.openai.com/v1/models';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
      break;
    case 'gemini':
    case 'google':
      endpoint = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
      headers = {
        'Content-Type': 'application/json'
      };
      break;
    case 'xai':
      endpoint = 'https://api.x.ai/v1/models';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      };
      break;
    default:
      throw new Error(`Fournisseur non supporté: ${provider}`);
  }
  
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers
    });
    
    if (response.ok) {
      return {
        isValid: true,
        message: `Clé API ${provider} validée avec succès`
      };
    } else {
      const errorData = await response.json();
      return {
        isValid: false,
        message: `Erreur ${provider}: ${errorData.error?.message || 'Erreur inconnue'}`,
        details: errorData
      };
    }
  } catch (error) {
    return {
      isValid: false,
      message: `Erreur de connexion à l'API ${provider}: ${error.message}`
    };
  }
}

// Fonction pour générer des images
async function generateImages(provider, apiKey, prompt, options = {}) {
  console.log(`Génération d'images avec ${provider}...`);
  console.log(`Prompt: ${prompt}`);
  
  let endpoint = '';
  let headers = {};
  let body = {};
  
  switch (provider.toLowerCase()) {
    case 'openai':
      endpoint = 'https://api.openai.com/v1/images/generations';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
      body = {
        model: options.model || 'dall-e-3',
        prompt,
        n: options.count || 1,
        size: options.size || '1024x1024',
        response_format: 'url'
      };
      break;
    case 'gemini':
    case 'google':
      endpoint = `https://generativelanguage.googleapis.com/v1/models/imagen-3.0-generate-002:generateImages?key=${apiKey}`;
      headers = {
        'Content-Type': 'application/json'
      };
      body = {
        prompt: {
          text: prompt
        },
        number_of_images: options.count || 1,
        aspect_ratio: options.aspectRatio || '1:1',
        safety_filter_level: options.safetyFilterLevel || 'BLOCK_MEDIUM_AND_ABOVE',
        person_generation: options.personGeneration || 'ALLOW_ADULT'
      };
      break;
    case 'xai':
      endpoint = 'https://api.x.ai/v1/images/generations';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      };
      body = {
        model: 'grok-2-image',
        prompt,
        n: options.count || 1,
        size: options.size || '1024x1024',
        response_format: 'url'
      };
      break;
    default:
      throw new Error(`Fournisseur non supporté: ${provider}`);
  }
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur ${provider}: ${errorData.error?.message || 'Erreur inconnue'}`);
    }
    
    const data = await response.json();
    
    // Extraire les URLs des images en fonction du fournisseur
    let imageUrls = [];
    
    if (provider.toLowerCase() === 'openai' || provider.toLowerCase() === 'xai') {
      imageUrls = data.data.map(item => item.url);
    } else if (provider.toLowerCase() === 'gemini' || provider.toLowerCase() === 'google') {
      imageUrls = data.images.map(item => item.url);
    }
    
    return {
      imageUrls,
      rawResponse: data
    };
  } catch (error) {
    throw error;
  }
}

// Test du système BYOK complet
async function testBYOKSystem(provider, apiKey, prompt) {
  console.log(`\n=== Test du système BYOK pour ${provider} ===`);
  
  try {
    // 1. Chiffrer la clé API
    console.log('\n1. Chiffrement de la clé API...');
    const encryptedApiKey = encrypt(apiKey);
    console.log(`Clé chiffrée: ${encryptedApiKey}`);
    
    // 2. Déchiffrer la clé API
    console.log('\n2. Déchiffrement de la clé API...');
    const decryptedApiKey = decrypt(encryptedApiKey);
    console.log(`Clé déchiffrée: ${decryptedApiKey.substring(0, 5)}...`);
    
    if (decryptedApiKey !== apiKey) {
      throw new Error('La clé déchiffrée ne correspond pas à la clé originale');
    }
    
    // 3. Valider la clé API
    console.log('\n3. Validation de la clé API...');
    const validationResult = await validateApiKey(provider, decryptedApiKey);
    console.log(`Résultat de la validation: ${JSON.stringify(validationResult, null, 2)}`);
    
    if (!validationResult.isValid) {
      throw new Error(`Validation de la clé API échouée: ${validationResult.message}`);
    }
    
    // 4. Générer des images
    console.log('\n4. Génération d\'images...');
    const generationResult = await generateImages(provider, decryptedApiKey, prompt);
    console.log(`Images générées: ${generationResult.imageUrls.length}`);
    console.log(`URLs des images: ${JSON.stringify(generationResult.imageUrls, null, 2)}`);
    
    console.log(`\n✅ Test du système BYOK pour ${provider} réussi!`);
    return true;
  } catch (error) {
    console.error(`\n❌ Test du système BYOK pour ${provider} échoué:`, error);
    return false;
  }
}

// Exécution des tests
async function runTests() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const getProviderAndKey = () => {
    return new Promise((resolve) => {
      readline.question('Entrez le fournisseur (openai, gemini, xai) ou "exit" pour quitter: ', (provider) => {
        if (provider.toLowerCase() === 'exit') {
          resolve({ provider: 'exit' });
          return;
        }
        
        readline.question(`Entrez votre clé API ${provider}: `, (apiKey) => {
          resolve({ provider, apiKey });
        });
      });
    });
  };
  
  let running = true;
  
  while (running) {
    const { provider, apiKey } = await getProviderAndKey();
    
    if (provider === 'exit') {
      running = false;
      continue;
    }
    
    const prompt = 'Un chat mignon jouant avec une pelote de laine, style aquarelle';
    await testBYOKSystem(provider, apiKey, prompt);
    console.log('\n');
  }
  
  readline.close();
}

// Exécuter les tests
runTests();
