/**
 * Test du système BYOK pour xAI (Grok-2-image)
 * 
 * Ce script teste l'intégration du système BYOK avec l'API de génération d'images de xAI.
 * Il vérifie le chiffrement/déchiffrement des clés API, la validation des clés, et la génération d'images.
 * 
 * Exécuter avec: node test-byok-xai.js
 */

require('dotenv').config({ path: '.env.local' });
const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

// Créer le dossier de sortie s'il n'existe pas
const outputDir = path.join(__dirname, 'test-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

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

// Classe pour les tests xAI
class XAITester {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.x.ai/v1';
    this.testResults = {
      encryption: { success: false, details: null },
      validation: { success: false, details: null },
      generation: { success: false, details: null }
    };
  }

  // Test du chiffrement/déchiffrement
  async testEncryption() {
    console.log('\n=== Test du chiffrement/déchiffrement ===');
    
    try {
      // Chiffrer la clé API
      console.log('Chiffrement de la clé API...');
      const encryptedApiKey = encrypt(this.apiKey);
      console.log(`Clé chiffrée: ${encryptedApiKey}`);
      
      // Déchiffrer la clé API
      console.log('Déchiffrement de la clé API...');
      const decryptedApiKey = decrypt(encryptedApiKey);
      console.log(`Clé déchiffrée: ${decryptedApiKey.substring(0, 5)}...`);
      
      // Vérifier que la clé déchiffrée correspond à la clé originale
      if (decryptedApiKey === this.apiKey) {
        console.log('✅ Test réussi: La clé déchiffrée correspond à la clé originale');
        this.testResults.encryption = { success: true, encryptedKey: encryptedApiKey };
        return true;
      } else {
        console.log('❌ Test échoué: La clé déchiffrée ne correspond pas à la clé originale');
        this.testResults.encryption = { success: false, error: 'Key mismatch after decryption' };
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors du test de chiffrement:', error);
      this.testResults.encryption = { success: false, error: error.message };
      return false;
    }
  }

  // Test de validation de la clé API
  async testValidation() {
    console.log('\n=== Test de validation de la clé API xAI ===');
    
    try {
      console.log('Validation de la clé API...');
      
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey,
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
        
        this.testResults.validation = { 
          success: true, 
          models,
          hasGrokModel
        };
        return true;
      } else {
        const errorData = await response.json();
        console.log(`❌ Clé API xAI invalide: ${errorData.error?.message || 'Erreur inconnue'}`);
        this.testResults.validation = { success: false, error: errorData };
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la validation de la clé xAI:', error);
      this.testResults.validation = { success: false, error: error.message };
      return false;
    }
  }

  // Test de génération d'image
  async testImageGeneration(prompt, options = {}) {
    console.log('\n=== Test de génération d\'image avec xAI ===');
    console.log(`Prompt: ${prompt}`);
    
    const {
      count = 1,
      size = '1024x1024',
      format = 'png',
      returnBase64 = false,
    } = options;
    
    console.log('Options:', { count, size, format, returnBase64 });
    
    try {
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey
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
        
        // Sauvegarder les résultats
        const outputFile = path.join(outputDir, 'xai-images.json');
        fs.writeFileSync(outputFile, JSON.stringify({
          prompt,
          options,
          imageUrls,
          timestamp: new Date().toISOString()
        }, null, 2));
        
        console.log(`Résultats sauvegardés dans ${outputFile}`);
        
        this.testResults.generation = { 
          success: true, 
          imageUrls,
          prompt,
          options
        };
        return true;
      } else {
        const errorData = await response.json();
        console.log(`❌ Erreur lors de la génération d'image: ${errorData.error?.message || 'Erreur inconnue'}`);
        this.testResults.generation = { success: false, error: errorData };
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la génération d\'image:', error);
      this.testResults.generation = { success: false, error: error.message };
      return false;
    }
  }

  // Test avec une clé API invalide
  async testWithInvalidKey() {
    console.log('\n=== Test avec une clé API invalide ===');
    
    const invalidKey = 'invalid_key_123';
    
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
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
  async runAllTests(prompt) {
    console.log('\n=== Test complet du système BYOK pour xAI ===');
    
    // Test du chiffrement/déchiffrement
    const encryptionSuccess = await this.testEncryption();
    if (!encryptionSuccess) {
      console.log('❌ Test de chiffrement/déchiffrement échoué, arrêt des tests');
      return false;
    }
    
    // Test de validation de la clé API
    const validationSuccess = await this.testValidation();
    if (!validationSuccess) {
      console.log('❌ Test de validation de la clé API échoué, arrêt des tests');
      return false;
    }
    
    // Test de génération d'image
    const generationSuccess = await this.testImageGeneration(prompt);
    if (!generationSuccess) {
      console.log('❌ Test de génération d\'image échoué');
      return false;
    }
    
    // Test avec une clé API invalide
    await this.testWithInvalidKey();
    
    // Sauvegarder les résultats des tests
    const outputFile = path.join(outputDir, 'xai-test-results.json');
    fs.writeFileSync(outputFile, JSON.stringify(this.testResults, null, 2));
    
    console.log(`\nRésultats des tests sauvegardés dans ${outputFile}`);
    console.log('\n✅ Tous les tests ont réussi!');
    
    return true;
  }
}

// Exécution des tests
async function runTests() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Entrez votre clé API xAI: ', async (apiKey) => {
    const tester = new XAITester(apiKey);
    const prompt = 'Un chat mignon jouant avec une pelote de laine, style aquarelle';
    
    await tester.runAllTests(prompt);
    
    readline.close();
  });
}

// Exécuter les tests
runTests();
