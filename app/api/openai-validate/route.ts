import { NextRequest, NextResponse } from 'next/server';
import { validateApiKeyForProvider } from '@/services/image-generation/factory';

/**
 * API pour valider une clé API OpenAI
 * Cette route est utilisée uniquement pour la page de test OpenAI
 * Utilise l'API OpenAI réelle pour valider la clé
 * ATTENTION: Cette route peut consommer des crédits OpenAI
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

    console.log('openai-validate - Validation de la clé API OpenAI (mode réel)');

    // Utiliser le service de validation réel
    const validationResult = await validateApiKeyForProvider('openai', apiKey, false);

    if (validationResult.isValid) {
      return NextResponse.json({
        isValid: true,
        message: validationResult.message,
        models: validationResult.details?.models || ['dall-e-3', 'gpt-image-1'],
        hasDallE3: validationResult.details?.hasImageModels || true,
        hasGptImage: validationResult.details?.hasImageModels || true,
        isMock: false
      });
    } else {
      return NextResponse.json({
        isValid: false,
        error: validationResult.message,
        details: validationResult.details
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('openai-validate - Erreur:', error);
    return NextResponse.json({
      isValid: false,
      error: `Erreur serveur: ${error.message}`
    }, { status: 500 });
  }
}
