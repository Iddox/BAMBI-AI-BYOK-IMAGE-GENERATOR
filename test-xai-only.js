/**
 * Test du système BYOK pour xAI (Grok-2-image)
 * 
 * Ce script teste uniquement l'intégration avec l'API de génération d'images de xAI.
 * 
 * Exécuter avec: node test-xai-only.js
 */

require('dotenv').config({ path: '.env.local' });
const CryptoJS = require('crypto-js');

// Fonctions de chiffrement/déchiffrement (copiées de utils/encryption.ts)
function encrypt(text) {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  }
  
  try {
    return CryptoJS.AES.encrypt(text, process.env.ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Erreur lors du chiffrement:', error);
    throw new Error('Failed to encrypt data');
  }
}

function decrypt(encryptedText) {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  }
  
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, process.env.ENCRYPTION_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) {
      throw new Error('Decryption resulted in empty string');
    }
    
    return decryptedText;
  } catch (error) {
    console.error('Erreur lors du déchiffrement:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Fonction pour valider une clé API xAI
async function validateXAIKey(apiKey) {
  console.log('\n=== Validation de la clé API xAI ===');
  
  try {
    const response = await fetch('https://api.x.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Clé API xAI valide');
      
      // Vérifier si le modèle Grok-2-image est disponible
      const models = data.data.map(model => model.id);
      console.log('Modèles disponibles:', models.join(', '));
      
      const hasGrokModel = models.includes('grok-2-image');
      if (hasGrokModel) {
        console.log('✅ Le modèle Grok-2-image est disponible');
      } else {
        console.log('⚠️ Le modèle Grok-2-image n\'est pas disponible');
      }
      
      return { isValid: true, models, hasGrokModel };
    } else {
      const errorData = await response.json();
      console.log(`❌ Clé API xAI invalide: ${errorData.error?.message || 'Erreur inconnue'}`);
      return { isValid: false, error: errorData };
    }
  } catch (error) {
    console.error('❌ Erreur lors de la validation de la clé xAI:', error);
    return { isValid: false, error: error.message };
  }
}

// Fonction pour générer une image avec xAI
async function generateImageWithXAI(apiKey, prompt, options = {}) {
  console.log('\n=== Génération d\'image avec xAI ===');
  console.log(`Prompt: ${prompt}`);
  
  const {
    count = 1,
    size = '1024x1024',
    format = 'png',
    returnBase64 = false,
  } = options;
  
  console.log('Options:', { count, size, format, returnBase64 });
  
  try {
    const response = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        model: 'grok-2-image',
        prompt,
        n: count,
        size,
        response_format: returnBase64 ? 'b64_json' : 'url'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Image générée avec succès');
      
      const imageUrls = data.data.map(item => 
        returnBase64 
          ? `data:image/${format};base64,${item.b64_json}` 
          : item.url
      );
      
      console.log(`URLs des images: ${JSON.stringify(imageUrls, null, 2)}`);
      return { success: true, imageUrls, data };
    } else {
      const errorData = await response.json();
      console.log(`❌ Erreur lors de la génération d'image: ${errorData.error?.message || 'Erreur inconnue'}`);
      return { success: false, error: errorData };
    }
  } catch (error) {
    console.error('❌ Erreur lors de la génération d\'image:', error);
    return { success: false, error: error.message };
  }
}

// Test avec une clé API invalide
async function testWithInvalidKey() {
  console.log('\n=== Test avec une clé API invalide ===');
  
  const invalidKey = 'invalid_key_123';
  
  try {
    const response = await fetch('https://api.x.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${invalidKey}`,
        'X-API-Key': invalidKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('✅ Le système a correctement rejeté la clé API invalide');
      console.log(`Message d'erreur: ${errorData.error?.message || 'Erreur inconnue'}`);
      return true;
    } else {
      console.log('❌ Le système a accepté une clé API invalide');
      return false;
    }
  } catch (error) {
    console.log('✅ Le système a correctement rejeté la clé API invalide (exception)');
    console.log(`Message d'erreur: ${error.message}`);
    return true;
  }
}

// Test complet du système BYOK pour xAI
async function testXAISystem(apiKey, prompt) {
  console.log('\n=== Test complet du système BYOK pour xAI ===');
  
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
    const validationResult = await validateXAIKey(decryptedApiKey);
    
    if (!validationResult.isValid) {
      throw new Error('Validation de la clé API échouée');
    }
    
    // 4. Générer une image
    console.log('\n4. Génération d\'une image...');
    const generationResult = await generateImageWithXAI(decryptedApiKey, prompt);
    
    if (!generationResult.success) {
      throw new Error('Génération d\'image échouée');
    }
    
    // 5. Test avec une clé API invalide
    console.log('\n5. Test avec une clé API invalide...');
    await testWithInvalidKey();
    
    console.log('\n✅ Test du système BYOK pour xAI réussi!');
    return true;
  } catch (error) {
    console.error('\n❌ Test du système BYOK pour xAI échoué:', error);
    return false;
  }
}

// Exécution des tests
async function runTests() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Entrez votre clé API xAI: ', async (apiKey) => {
    const prompt = 'Un chat mignon jouant avec une pelote de laine, style aquarelle';
    await testXAISystem(apiKey, prompt);
    readline.close();
  });
}

// Exécuter les tests
runTests();
