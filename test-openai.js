/**
 * Script de test pour l'API OpenAI
 * 
 * Ce script teste :
 * 1. La validation d'une clé API (valide et invalide)
 * 2. Le chiffrement/déchiffrement de la clé API
 * 3. La génération d'images avec différents paramètres
 * 
 * Exécuter avec : node test-openai.js
 */

const { encrypt, decrypt } = require('./utils/encryption');

// Fonction pour valider une clé API OpenAI
async function validateOpenAIKey(apiKey) {
  try {
    console.log('Validation de la clé API OpenAI...');

    // Vérification basique du format
    if (!apiKey.startsWith('sk-')) {
      console.log('❌ Format de clé API OpenAI invalide (doit commencer par "sk-")');
      return { isValid: false, error: 'Format de clé API invalide' };
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Clé API OpenAI valide');
      
      // Vérifier si les modèles de génération d'images sont disponibles
      const models = data.data.map(model => model.id);
      console.log('Modèles disponibles:', models.join(', '));
      
      const hasDallE3 = models.includes('dall-e-3');
      const hasGptImage = models.includes('gpt-image-1');
      
      if (hasDallE3) {
        console.log('✅ Le modèle DALL-E 3 est disponible');
      } else {
        console.log('⚠️ Le modèle DALL-E 3 n\'est pas disponible');
      }
      
      if (hasGptImage) {
        console.log('✅ Le modèle GPT Image 1 est disponible');
      } else {
        console.log('⚠️ Le modèle GPT Image 1 n\'est pas disponible');
      }
      
      return { isValid: true, models, hasDallE3, hasGptImage };
    } else {
      const errorData = await response.json();
      console.log(`❌ Clé API OpenAI invalide: ${errorData.error?.message || 'Erreur inconnue'}`);
      return { isValid: false, error: errorData };
    }
  } catch (error) {
    console.log(`❌ Erreur lors de la validation de la clé API OpenAI: ${error.message}`);
    return { isValid: false, error };
  }
}

// Fonction pour générer une image avec OpenAI
async function generateImageWithOpenAI(apiKey, prompt, options = {}) {
  try {
    console.log('Génération d\'image avec OpenAI...');
    console.log(`Prompt: ${prompt}`);

    const {
      count = 1,
      model = 'dall-e-3',
      size = '1024x1024',
      quality = 'standard',
      style = 'vivid',
      returnBase64 = false,
    } = options;

    // Préparer les paramètres de la requête
    const requestBody = {
      model,
      prompt,
      n: model === 'dall-e-3' ? 1 : Math.min(count, 4), // DALL-E 3 ne supporte qu'une image à la fois
      size,
      response_format: returnBase64 ? 'b64_json' : 'url'
    };

    // Ajouter les paramètres spécifiques à DALL-E 3
    if (model === 'dall-e-3') {
      requestBody.quality = quality;
      requestBody.style = style;
    }

    console.log(`Paramètres de la requête: ${JSON.stringify(requestBody, null, 2)}`);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log(`❌ Erreur lors de la génération d'image: ${errorData.error?.message || 'Erreur inconnue'}`);
      return { success: false, error: errorData };
    }

    const data = await response.json();
    console.log('✅ Image(s) générée(s) avec succès');
    
    // Extraire les URLs des images
    const imageUrls = data.data.map(image => 
      returnBase64 ? `data:image/jpeg;base64,${image.b64_json}` : image.url
    );
    
    console.log(`Nombre d'images générées: ${imageUrls.length}`);
    imageUrls.forEach((url, index) => {
      if (returnBase64) {
        console.log(`Image ${index + 1} (base64): ${url.substring(0, 50)}...`);
      } else {
        console.log(`Image ${index + 1}: ${url}`);
      }
    });
    
    return { success: true, imageUrls };
  } catch (error) {
    console.log(`❌ Erreur lors de la génération d'image: ${error.message}`);
    return { success: false, error };
  }
}

// Fonction pour tester avec une clé API invalide
async function testWithInvalidKey() {
  console.log('\n=== Test avec une clé API invalide ===');
  const invalidKey = 'sk-invalid-key-123456789';
  const result = await validateOpenAIKey(invalidKey);
  
  if (!result.isValid) {
    console.log('✅ Test réussi: La clé invalide a été correctement rejetée');
  } else {
    console.log('❌ Test échoué: La clé invalide a été acceptée');
  }
}

// Fonction principale pour tester le système BYOK avec OpenAI
async function testOpenAISystem(apiKey, prompt) {
  console.log('\n=== Test du système BYOK pour OpenAI ===');
  
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
    const validationResult = await validateOpenAIKey(decryptedApiKey);
    
    if (!validationResult.isValid) {
      throw new Error('Validation de la clé API échouée');
    }
    
    // 4. Générer une image avec DALL-E 3
    console.log('\n4. Génération d\'une image avec DALL-E 3...');
    const generationResult = await generateImageWithOpenAI(decryptedApiKey, prompt, {
      model: 'dall-e-3',
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid'
    });
    
    if (!generationResult.success) {
      throw new Error('Génération d\'image avec DALL-E 3 échouée');
    }
    
    // 5. Générer une image avec GPT Image 1 (si disponible)
    if (validationResult.hasGptImage) {
      console.log('\n5. Génération d\'une image avec GPT Image 1...');
      const gptImageResult = await generateImageWithOpenAI(decryptedApiKey, prompt, {
        model: 'gpt-image-1',
        size: '1024x1024'
      });
      
      if (!gptImageResult.success) {
        console.log('⚠️ Génération d\'image avec GPT Image 1 échouée');
      }
    }
    
    // 6. Test avec format base64
    console.log('\n6. Test avec format base64...');
    const base64Result = await generateImageWithOpenAI(decryptedApiKey, prompt, {
      returnBase64: true
    });
    
    if (!base64Result.success) {
      console.log('⚠️ Test avec format base64 échoué');
    }
    
    // 7. Test avec une clé API invalide
    console.log('\n7. Test avec une clé API invalide...');
    await testWithInvalidKey();
    
    console.log('\n✅ Test du système BYOK pour OpenAI réussi!');
    return true;
  } catch (error) {
    console.error('\n❌ Test du système BYOK pour OpenAI échoué:', error);
    return false;
  }
}

// Exécution des tests
async function runTests() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Entrez votre clé API OpenAI: ', async (apiKey) => {
    const prompt = 'Un chat mignon jouant avec une pelote de laine, style aquarelle';
    await testOpenAISystem(apiKey, prompt);
    readline.close();
  });
}

// Exécuter les tests
runTests();
