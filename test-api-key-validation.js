// Script de test pour la validation des clés API
// Exécuter avec: node test-api-key-validation.js

require('dotenv').config({ path: '.env.local' });

// Fonction pour valider une clé API OpenAI
async function validateOpenAIKey(apiKey) {
  try {
    console.log('Validation de la clé API OpenAI...');
    
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

// Fonction pour valider une clé API Google Gemini
async function validateGeminiKey(apiKey) {
  try {
    console.log('Validation de la clé API Google Gemini...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Clé API Google Gemini valide');
      return true;
    } else {
      const errorData = await response.json();
      console.log(`❌ Clé API Google Gemini invalide: ${errorData.error?.message || 'Erreur inconnue'}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la validation de la clé Google Gemini:', error);
    return false;
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
      console.log('✅ Clé API xAI valide');
      return true;
    } else {
      const errorData = await response.json();
      console.log(`❌ Clé API xAI invalide: ${errorData.error?.message || 'Erreur inconnue'}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la validation de la clé xAI:', error);
    return false;
  }
}

// Fonction pour valider une clé API en fonction du fournisseur
async function validateApiKey(provider, apiKey) {
  console.log(`\n=== Validation de la clé API ${provider} ===`);
  
  switch (provider.toLowerCase()) {
    case 'openai':
      return await validateOpenAIKey(apiKey);
    case 'gemini':
    case 'google':
      return await validateGeminiKey(apiKey);
    case 'xai':
      return await validateXAIKey(apiKey);
    default:
      console.log(`❌ Fournisseur non supporté: ${provider}`);
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
    
    await validateApiKey(provider, apiKey);
    console.log('\n');
  }
  
  readline.close();
}

// Exécuter les tests
runTests();
