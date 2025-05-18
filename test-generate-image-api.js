// Script de test pour l'API de génération d'images de Bambi AI
// Exécuter avec: node test-generate-image-api.js

require('dotenv').config({ path: '.env.local' });
const CryptoJS = require('crypto-js');

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

// Fonction pour simuler l'API de génération d'images
async function simulateGenerateImageAPI(prompt, configurationId, provider, apiKey) {
  console.log(`\n=== Simulation de l'API de génération d'images ===`);
  console.log(`Prompt: ${prompt}`);
  console.log(`Configuration ID: ${configurationId}`);
  console.log(`Provider: ${provider}`);
  
  try {
    // 1. Déchiffrer la clé API (comme le ferait l'API)
    console.log('\n1. Déchiffrement de la clé API...');
    const encryptedApiKey = encrypt(apiKey); // Simuler une clé chiffrée stockée en base de données
    const decryptedApiKey = decrypt(encryptedApiKey);
    console.log(`Clé déchiffrée: ${decryptedApiKey.substring(0, 5)}...`);
    
    // 2. Créer le service de génération d'images en fonction du fournisseur
    console.log('\n2. Création du service de génération d\'images...');
    let endpoint = '';
    let headers = {};
    let body = {};
    
    switch (provider.toLowerCase()) {
      case 'openai':
        endpoint = 'https://api.openai.com/v1/images/generations';
        headers = {
          'Authorization': `Bearer ${decryptedApiKey}`,
          'Content-Type': 'application/json'
        };
        body = {
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1024x1024',
          response_format: 'url'
        };
        break;
      case 'gemini':
      case 'google':
        endpoint = `https://generativelanguage.googleapis.com/v1/models/imagen-3.0-generate-002:generateImages?key=${decryptedApiKey}`;
        headers = {
          'Content-Type': 'application/json'
        };
        body = {
          prompt: {
            text: prompt
          },
          number_of_images: 1,
          aspect_ratio: '1:1',
          safety_filter_level: 'BLOCK_MEDIUM_AND_ABOVE',
          person_generation: 'ALLOW_ADULT'
        };
        break;
      case 'xai':
        endpoint = 'https://api.x.ai/v1/images/generations';
        headers = {
          'Authorization': `Bearer ${decryptedApiKey}`,
          'X-API-Key': decryptedApiKey,
          'Content-Type': 'application/json'
        };
        body = {
          model: 'grok-2-image',
          prompt,
          n: 1,
          size: '1024x1024',
          response_format: 'url'
        };
        break;
      default:
        throw new Error(`Fournisseur non supporté: ${provider}`);
    }
    
    // 3. Générer les images
    console.log('\n3. Génération des images...');
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Headers: ${JSON.stringify(headers, null, 2).replace(decryptedApiKey, '***')}`);
    console.log(`Body: ${JSON.stringify(body, null, 2)}`);
    
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
    
    // 4. Extraire les URLs des images en fonction du fournisseur
    console.log('\n4. Extraction des URLs des images...');
    let imageUrls = [];
    
    if (provider.toLowerCase() === 'openai' || provider.toLowerCase() === 'xai') {
      imageUrls = data.data.map(item => item.url);
    } else if (provider.toLowerCase() === 'gemini' || provider.toLowerCase() === 'google') {
      imageUrls = data.images.map(item => item.url);
    }
    
    console.log(`Images générées: ${imageUrls.length}`);
    console.log(`URLs des images: ${JSON.stringify(imageUrls, null, 2)}`);
    
    // 5. Simuler l'enregistrement des images dans la base de données
    console.log('\n5. Simulation de l\'enregistrement des images dans la base de données...');
    const generatedImages = imageUrls.map((url, index) => ({
      id: `image-${Date.now()}-${index}`,
      url,
      prompt,
      timestamp: new Date().toISOString()
    }));
    
    console.log(`Images enregistrées: ${JSON.stringify(generatedImages, null, 2)}`);
    
    console.log(`\n✅ Simulation de l'API de génération d'images réussie!`);
    return generatedImages;
  } catch (error) {
    console.error(`\n❌ Simulation de l'API de génération d'images échouée:`, error);
    throw error;
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
          readline.question('Entrez un prompt pour la génération d\'image: ', (prompt) => {
            resolve({ provider, apiKey, prompt });
          });
        });
      });
    });
  };
  
  let running = true;
  
  while (running) {
    try {
      const { provider, apiKey, prompt } = await getProviderAndKey();
      
      if (provider === 'exit') {
        running = false;
        continue;
      }
      
      // Simuler un ID de configuration
      const configurationId = `config-${Date.now()}`;
      
      await simulateGenerateImageAPI(prompt || 'Un chat mignon jouant avec une pelote de laine, style aquarelle', configurationId, provider, apiKey);
    } catch (error) {
      console.error('Erreur lors de l\'exécution du test:', error);
    }
    
    console.log('\n');
  }
  
  readline.close();
}

// Exécuter les tests
runTests();
