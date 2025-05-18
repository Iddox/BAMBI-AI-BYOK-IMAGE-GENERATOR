import { NextRequest, NextResponse } from 'next/server';

/**
 * API pour valider une clé API xAI directement
 * Cette route est utilisée uniquement pour la page de test xAI
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer les données de la requête
    const requestData = await request.json();
    const { apiKey } = requestData;

    // Vérifier que la clé API est présente
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API manquante' }, { status: 400 });
    }

    // Appel à l'API xAI pour valider la clé
    const response = await fetch('https://api.x.ai/v1/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey
      }
    });

    // Récupérer la réponse
    const responseText = await response.text();
    
    // Analyser la réponse
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('xai-validate - Erreur lors de l\'analyse de la réponse:', parseError);
      console.error('xai-validate - Réponse brute:', responseText);
      return NextResponse.json({ 
        isValid: false,
        error: 'Erreur lors de l\'analyse de la réponse de l\'API xAI'
      }, { status: 500 });
    }

    if (response.ok) {
      // Vérifier si le modèle grok-2-image-1212 est disponible
      const models = responseData.data.map((model: any) => model.id);
      const hasImageModel = models.includes('grok-2-image-1212');
      
      return NextResponse.json({
        isValid: true,
        models,
        hasImageModel,
        message: `Clé API valide. Modèles disponibles: ${models.join(', ')}`
      });
    } else {
      return NextResponse.json({
        isValid: false,
        error: responseData.error?.message || 'Erreur inconnue',
        details: responseData
      }, { status: response.status });
    }
  } catch (error: any) {
    console.error('xai-validate - Erreur:', error);
    return NextResponse.json({ 
      isValid: false,
      error: `Erreur serveur: ${error.message}`
    }, { status: 500 });
  }
}
