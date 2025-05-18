// Script de test pour xAI
// Exécuter avec: node test-xai.js

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
  try {
    console.log('Validation de la clé API xAI...');

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
      console.log('Modèles disponibles:', data.data.map(model => model.id).join(', '));
      return { isValid: true, data };
    } else {
      const errorData = await response.json();
      console.log(`❌ Clé API xAI invalide: ${errorData.error?.message || 'Erreur inconnue'}`);
      return { isValid: false, error: errorData };
    }
  } catch (error) {
    console.error('❌ Erreur lors de la validation de la clé xAI:', error);
    return { isValid: false, error };
  }
}

// Fonction pour générer une image avec xAI
async function generateImageWithXAI(apiKey, prompt, options = {}) {
  try {
    console.log('Génération d\'image avec xAI...');
    console.log(`Prompt: ${prompt}`);

    const {
      count = 1,
      format = 'png',
      returnBase64 = false,
    } = options;

    // Note: xAI API ne supporte pas le paramètre 'size'
    const requestBody = {
      model: 'grok-2-image-1212',
      prompt,
      n: count,
      response_format: returnBase64 ? 'b64_json' : 'url'
    };

    console.log(`Paramètres de la requête: ${JSON.stringify(requestBody, null, 2)}`);

    const response = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`Requête envoyée à ${response.url}`);
    console.log(`Status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    console.log(`Réponse brute: ${responseText}`);

    try {
      const responseData = JSON.parse(responseText);

      if (response.ok) {
        console.log('✅ Image générée avec succès');

        const imageUrls = responseData.data.map(item =>
          returnBase64
            ? `data:image/${format};base64,${item.b64_json}`
            : item.url
        );

        console.log(`URLs des images: ${JSON.stringify(imageUrls, null, 2)}`);
        return { success: true, imageUrls, data: responseData };
      } else {
        console.log(`❌ Erreur lors de la génération d'image: ${responseData.error?.message || 'Erreur inconnue'}`);
        console.log(`Détails de l'erreur: ${JSON.stringify(responseData, null, 2)}`);
        return { success: false, error: responseData };
      }
    } catch (parseError) {
      console.log(`❌ Erreur lors de l'analyse de la réponse: ${parseError.message}`);
      console.log(`Réponse non-JSON: ${responseText}`);
      return { success: false, error: { message: 'Réponse non-JSON', details: responseText } };
    }
  } catch (error) {
    console.error('❌ Erreur lors de la génération d\'image:', error);
    return { success: false, error };
  }
}

// Test complet du système BYOK pour xAI
async function testXAISystem(apiKey, prompt) {
  console.log('\n=== Test du système BYOK pour xAI ===');

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

    // 4. Générer une image avec différentes tailles
    console.log('\n4. Tests de génération d\'images avec différentes tailles...');

    // Test avec taille par défaut (1024x1024)
    console.log('\n4.1. Test avec taille par défaut (1024x1024)...');
    const defaultSizeResult = await generateImageWithXAI(decryptedApiKey, prompt);

    if (!defaultSizeResult.success) {
      console.error('❌ Test avec taille par défaut échoué');
      throw new Error('Génération d\'image avec taille par défaut échouée');
    } else {
      console.log('✅ Test avec taille par défaut réussi');
    }

    // Test avec plusieurs images
    console.log('\n4.2. Test avec génération de 2 images...');
    const multipleImagesResult = await generateImageWithXAI(decryptedApiKey, prompt, {
      count: 2
    });

    if (!multipleImagesResult.success) {
      console.error('❌ Test avec génération de 2 images échoué');
    } else {
      console.log('✅ Test avec génération de 2 images réussi');
      console.log(`Nombre d'images générées: ${multipleImagesResult.imageUrls.length}`);
    }

    // Test avec un prompt différent
    console.log('\n4.3. Test avec un prompt différent...');
    const differentPromptResult = await generateImageWithXAI(
      decryptedApiKey,
      'Un paysage de montagne avec un lac, style impressionniste'
    );

    if (!differentPromptResult.success) {
      console.error('❌ Test avec un prompt différent échoué');
    } else {
      console.log('✅ Test avec un prompt différent réussi');
    }

    // Test avec format base64
    console.log('\n4.4. Test avec format base64...');
    const base64Result = await generateImageWithXAI(decryptedApiKey, prompt, {
      returnBase64: true
    });

    if (!base64Result.success) {
      console.error('❌ Test avec format base64 échoué');
    } else {
      console.log('✅ Test avec format base64 réussi');
      // Afficher seulement les premiers caractères de l'image base64
      if (base64Result.imageUrls && base64Result.imageUrls.length > 0) {
        const base64Url = base64Result.imageUrls[0];
        console.log(`Image base64 (début): ${base64Url.substring(0, 50)}...`);
      }
    }

    console.log('\n✅ Tests de génération d\'images terminés');
    return true;
  } catch (error) {
    console.error('\n❌ Test du système BYOK pour xAI échoué:', error);
    return false;
  }
}

// Test avec une clé API invalide
async function testWithInvalidKey() {
  console.log('\n=== Test avec une clé API invalide ===');

  const invalidKey = 'invalid_key_123';
  const validationResult = await validateXAIKey(invalidKey);

  if (!validationResult.isValid) {
    console.log('✅ Le système a correctement rejeté la clé API invalide');
  } else {
    console.log('❌ Le système a accepté une clé API invalide');
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

    // Test avec la clé API valide
    await testXAISystem(apiKey, prompt);

    // Test avec une clé API invalide
    await testWithInvalidKey();

    readline.close();
  });
}

// Exécuter les tests
runTests();
