// Script de test pour le système BYOK
// Exécuter avec: node test-byok.js

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

// Test du chiffrement/déchiffrement
async function testEncryption() {
  console.log('=== Test du chiffrement/déchiffrement ===');
  
  const originalText = 'ma_clé_api_secrète';
  console.log(`Texte original: ${originalText}`);
  
  try {
    const encrypted = encrypt(originalText);
    console.log(`Texte chiffré: ${encrypted}`);
    
    const decrypted = decrypt(encrypted);
    console.log(`Texte déchiffré: ${decrypted}`);
    
    if (decrypted === originalText) {
      console.log('✅ Test réussi: Le texte déchiffré correspond au texte original');
    } else {
      console.log('❌ Test échoué: Le texte déchiffré ne correspond pas au texte original');
    }
  } catch (error) {
    console.error('❌ Erreur lors du test de chiffrement:', error);
  }
}

// Test de validation d'une clé API OpenAI
async function testOpenAIValidation(apiKey) {
  console.log('\n=== Test de validation d\'une clé API OpenAI ===');
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Clé API OpenAI valide');
      return true;
    } else {
      const errorData = await response.json();
      console.log(`❌ Clé API OpenAI invalide: ${errorData.error?.message || 'Erreur inconnue'}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la validation de la clé OpenAI:', error);
    return false;
  }
}

// Test de génération d'image avec OpenAI
async function testOpenAIImageGeneration(apiKey, prompt) {
  console.log('\n=== Test de génération d\'image avec OpenAI ===');
  console.log(`Prompt: ${prompt}`);
  
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Image générée avec succès');
      console.log(`URL de l'image: ${data.data[0].url}`);
      return data.data[0].url;
    } else {
      const errorData = await response.json();
      console.log(`❌ Erreur lors de la génération d'image: ${errorData.error?.message || 'Erreur inconnue'}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la génération d\'image:', error);
    return null;
  }
}

// Exécution des tests
async function runTests() {
  // Test du chiffrement/déchiffrement
  await testEncryption();
  
  // Demander la clé API à l'utilisateur
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('\nEntrez votre clé API OpenAI (commençant par sk-): ', async (apiKey) => {
    // Test de validation de la clé API
    const isValid = await testOpenAIValidation(apiKey);
    
    if (isValid) {
      // Test de génération d'image
      const prompt = 'Un chat mignon jouant avec une pelote de laine, style aquarelle';
      await testOpenAIImageGeneration(apiKey, prompt);
    }
    
    readline.close();
  });
}

// Exécuter les tests
runTests();
