// Script de test pour l'intégration du système BYOK
// Exécuter avec: node test-byok-integration.js

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

// Classe de base pour les services de génération d'images
class ImageGenerationService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  
  async validateApiKey() {
    throw new Error('Not implemented');
  }
  
  async generateImages(prompt, options) {
    throw new Error('Not implemented');
  }
}

// Service OpenAI
class OpenAIService extends ImageGenerationService {
  constructor(apiKey) {
    super(apiKey);
    this.baseUrl = 'https://api.openai.com/v1';
  }
  
  async validateApiKey() {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return {
          isValid: true,
          message: 'Clé API OpenAI validée avec succès'
        };
      }
      
      const errorData = await response.json();
      return {
        isValid: false,
        message: `Erreur OpenAI: ${errorData.error?.message || 'Erreur inconnue'}`,
        details: errorData
      };
    } catch (error) {
      return {
        isValid: false,
        message: `Erreur de connexion à l'API OpenAI: ${error.message}`
      };
    }
  }
  
  async generateImages(prompt, options = {}) {
    const {
      count = 1,
      size = '1024x1024',
      model = 'dall-e-3'
    } = options;
    
    try {
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          prompt,
          n: count,
          size,
          response_format: 'url'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erreur OpenAI: ${errorData.error?.message || 'Erreur inconnue'}`);
      }
      
      const data = await response.json();
      return {
        imageUrls: data.data.map(item => item.url),
        rawResponse: data
      };
    } catch (error) {
      throw error;
    }
  }
}

// Factory pour créer les services de génération d'images
function createImageGenerationService(provider, apiKey) {
  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIService(apiKey);
    default:
      throw new Error(`Fournisseur non supporté: ${provider}`);
  }
}

// Test de l'intégration complète
async function testIntegration(provider, apiKey, prompt) {
  console.log(`\n=== Test d'intégration pour ${provider} ===`);
  
  try {
    // 1. Chiffrer la clé API
    console.log('1. Chiffrement de la clé API...');
    const encryptedApiKey = encrypt(apiKey);
    console.log(`Clé chiffrée: ${encryptedApiKey}`);
    
    // 2. Déchiffrer la clé API
    console.log('\n2. Déchiffrement de la clé API...');
    const decryptedApiKey = decrypt(encryptedApiKey);
    console.log(`Clé déchiffrée: ${decryptedApiKey}`);
    
    if (decryptedApiKey !== apiKey) {
      throw new Error('La clé déchiffrée ne correspond pas à la clé originale');
    }
    
    // 3. Créer le service de génération d'images
    console.log('\n3. Création du service de génération d\'images...');
    const imageService = createImageGenerationService(provider, decryptedApiKey);
    
    // 4. Valider la clé API
    console.log('\n4. Validation de la clé API...');
    const validationResult = await imageService.validateApiKey();
    console.log(`Résultat de la validation: ${JSON.stringify(validationResult, null, 2)}`);
    
    if (!validationResult.isValid) {
      throw new Error(`Validation de la clé API échouée: ${validationResult.message}`);
    }
    
    // 5. Générer une image
    console.log('\n5. Génération d\'une image...');
    console.log(`Prompt: ${prompt}`);
    
    const generationResult = await imageService.generateImages(prompt);
    console.log(`Images générées: ${generationResult.imageUrls.length}`);
    
    // 6. Sauvegarder les URLs des images
    console.log('\n6. Sauvegarde des URLs des images...');
    const outputDir = path.join(__dirname, 'output');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    const outputFile = path.join(outputDir, `${provider.toLowerCase()}-images.json`);
    fs.writeFileSync(outputFile, JSON.stringify(generationResult, null, 2));
    
    console.log(`URLs des images sauvegardées dans ${outputFile}`);
    console.log(`\n✅ Test d'intégration pour ${provider} réussi!`);
    
    return generationResult;
  } catch (error) {
    console.error(`\n❌ Test d'intégration pour ${provider} échoué:`, error);
    return null;
  }
}

// Exécution des tests
async function runTests() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Entrez votre clé API OpenAI (commençant par sk-): ', async (apiKey) => {
    const prompt = 'Un chat mignon jouant avec une pelote de laine, style aquarelle';
    await testIntegration('openai', apiKey, prompt);
    readline.close();
  });
}

// Exécuter les tests
runTests();
