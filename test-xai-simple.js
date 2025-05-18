/**
 * Script de test simple pour l'API xAI
 * 
 * Ce script teste :
 * 1. La validation d'une clé API (valide et invalide)
 * 2. La génération d'images avec différents paramètres
 * 
 * Exécuter avec : node test-xai-simple.js VOTRE_CLE_API
 */

// Vérifier si une clé API a été fournie en argument
const apiKey = process.argv[2];
if (!apiKey) {
  console.error('❌ Erreur: Veuillez fournir une clé API xAI en argument.');
  console.error('   Exemple: node test-xai-simple.js xai-votre-cle-api');
  process.exit(1);
}

// Configuration
const baseUrl = 'https://api.x.ai/v1';
const imageModel = 'grok-2-image-1212';

// Fonction pour valider une clé API
async function validateApiKey(key) {
  console.log('\n=== Test de validation de la clé API ===');
  console.log(`Clé API: ${key.substring(0, 5)}...${key.substring(key.length - 5)}`);
  
  try {
    const response = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`,
        'X-API-Key': key,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
      console.log('Réponse parsée avec succès');
    } catch (e) {
      console.log(`Erreur lors du parsing de la réponse: ${e.message}`);
      console.log(`Réponse brute: ${responseText}`);
      return { isValid: false, error: e.message, rawResponse: responseText };
    }
    
    if (response.ok) {
      // Vérifier si le modèle grok-2-image-1212 est disponible
      const models = responseData.data.map(model => model.id);
      const hasImageModel = models.includes(imageModel);
      
      console.log('✅ Clé API valide');
      console.log(`Modèles disponibles: ${models.join(', ')}`);
      console.log(`Modèle ${imageModel} disponible: ${hasImageModel ? 'Oui ✅' : 'Non ❌'}`);
      
      return { 
        isValid: true, 
        models,
        hasImageModel,
        rawResponse: responseData
      };
    } else {
      console.log('❌ Clé API invalide');
      console.log(`Message d'erreur: ${responseData.error?.message || 'Erreur inconnue'}`);
      console.log(`Détails: ${JSON.stringify(responseData, null, 2)}`);
      
      return { 
        isValid: false, 
        error: responseData.error?.message || 'Erreur inconnue',
        rawResponse: responseData
      };
    }
  } catch (error) {
    console.log(`❌ Erreur lors de la validation: ${error.message}`);
    return { isValid: false, error: error.message };
  }
}

// Fonction pour générer une image
async function generateImage(key, prompt, options = {}) {
  const { count = 1, returnBase64 = false } = options;
  
  console.log('\n=== Test de génération d\'image ===');
  console.log(`Prompt: "${prompt}"`);
  console.log(`Nombre d'images: ${count}`);
  console.log(`Format de réponse: ${returnBase64 ? 'base64' : 'url'}`);
  
  const requestBody = {
    model: imageModel,
    prompt,
    n: Math.min(count, 10), // Maximum 10 images par requête
    response_format: returnBase64 ? 'b64_json' : 'url'
  };
  
  console.log(`Requête: ${JSON.stringify(requestBody, null, 2)}`);
  
  try {
    console.log('Envoi de la requête...');
    const startTime = Date.now();
    
    const response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'X-API-Key': key
      },
      body: JSON.stringify(requestBody)
    });
    
    const endTime = Date.now();
    console.log(`Temps de réponse: ${(endTime - startTime) / 1000} secondes`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
      console.log('Réponse parsée avec succès');
    } catch (e) {
      console.log(`❌ Erreur lors du parsing de la réponse: ${e.message}`);
      console.log(`Réponse brute: ${responseText}`);
      return { success: false, error: e.message, rawResponse: responseText };
    }
    
    if (response.ok) {
      const imageUrls = responseData.data.map(item => 
        returnBase64 ? `data:image/jpeg;base64,${item.b64_json.substring(0, 50)}...` : item.url
      );
      
      console.log('✅ Image(s) générée(s) avec succès');
      console.log(`Nombre d'images générées: ${imageUrls.length}`);
      console.log(`URLs/Base64: ${JSON.stringify(imageUrls, null, 2)}`);
      
      return { 
        success: true, 
        imageUrls,
        rawResponse: responseData
      };
    } else {
      console.log('❌ Erreur lors de la génération d\'image');
      console.log(`Message d'erreur: ${responseData.error?.message || 'Erreur inconnue'}`);
      console.log(`Détails: ${JSON.stringify(responseData, null, 2)}`);
      
      return { 
        success: false, 
        error: responseData.error?.message || 'Erreur inconnue',
        rawResponse: responseData
      };
    }
  } catch (error) {
    console.log(`❌ Erreur lors de la génération d'image: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Fonction pour tester une clé API invalide
async function testInvalidKey() {
  console.log('\n=== Test avec une clé API invalide ===');
  const invalidKey = 'xai-invalid-key-123456789';
  
  const result = await validateApiKey(invalidKey);
  
  if (!result.isValid) {
    console.log('✅ Le système a correctement rejeté la clé API invalide');
  } else {
    console.log('❌ Le système a accepté une clé API invalide (ceci est un problème)');
  }
  
  return result;
}

// Fonction principale pour exécuter tous les tests
async function runAllTests() {
  console.log('=== Début des tests de l\'API xAI ===');
  console.log(`Date et heure: ${new Date().toISOString()}`);
  console.log(`Clé API: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`);
  
  // 1. Valider la clé API fournie
  const validationResult = await validateApiKey(apiKey);
  
  if (!validationResult.isValid) {
    console.log('\n❌ La clé API fournie est invalide. Arrêt des tests.');
    return;
  }
  
  // 2. Tester la génération d'image avec un prompt simple
  await generateImage(apiKey, 'Un chat mignon jouant avec une pelote de laine, style aquarelle');
  
  // 3. Tester la génération de plusieurs images
  await generateImage(apiKey, 'Un paysage de montagne avec un lac, style impressionniste', { count: 2 });
  
  // 4. Tester la génération d'image avec format base64
  await generateImage(apiKey, 'Un robot futuriste dans un jardin japonais', { returnBase64: true });
  
  // 5. Tester une clé API invalide
  await testInvalidKey();
  
  console.log('\n=== Fin des tests ===');
}

// Exécuter les tests
runAllTests().catch(error => {
  console.error(`\n❌ Erreur non gérée: ${error.message}`);
  console.error(error.stack);
});
