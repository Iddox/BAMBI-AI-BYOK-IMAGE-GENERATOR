import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { validateApiKeyForProvider } from '@/services/image-generation/factory';

// Schéma de validation pour la requête
const validateApiKeySchema = z.object({
  provider: z.string().min(1, "Le fournisseur est requis"),
  apiKey: z.string().min(1, "La clé API est requise"),
});

export async function POST(request: Request) {
  try {
    // Créer un client Supabase côté serveur
    const supabase = createServerSupabaseClient();

    // Vérifier si l'utilisateur est authentifié
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer et valider les données de la requête
    const requestData = await request.json();
    const validatedData = validateApiKeySchema.parse(requestData);

    // Récupérer les informations du fournisseur
    const { data: providerData, error: providerError } = await supabase
      .from('api_providers')
      .select('id, name, slug, api_base_url')
      .eq('slug', validatedData.provider)
      .single();

    // Vérifier si le fournisseur existe dans la base de données
    if (providerError) {
      console.error(`Fournisseur '${validatedData.provider}' non trouvé dans la base de données:`, providerError);

      // Vérifier si le fournisseur est défini dans le frontend
      const frontendProviders = ['openai', 'google', 'xai'];
      if (frontendProviders.includes(validatedData.provider)) {
        // Le fournisseur est défini dans le frontend mais pas dans la base de données
        // Créer une entrée temporaire pour permettre la validation
        const tempProviderData = {
          id: 0, // ID temporaire
          name: validatedData.provider.charAt(0).toUpperCase() + validatedData.provider.slice(1),
          slug: validatedData.provider,
          api_base_url: validatedData.provider === 'openai' ? 'https://api.openai.com/v1' :
                        validatedData.provider === 'google' ? 'https://generativelanguage.googleapis.com/v1' :
                        validatedData.provider === 'xai' ? 'https://api.x.ai/v1' : ''
        };

        console.log(`Utilisation d'une entrée temporaire pour le fournisseur '${validatedData.provider}':`, tempProviderData);

        // Continuer avec l'entrée temporaire
        return await validateApiKeyWithProvider(validatedData, tempProviderData, supabase);
      }

      return NextResponse.json({
        error: `Fournisseur '${validatedData.provider}' non trouvé dans la base de données. Veuillez exécuter la migration pour synchroniser les fournisseurs.`,
        details: {
          provider: validatedData.provider,
          error: providerError
        }
      }, { status: 404 });
    }

    // Continuer avec le fournisseur trouvé dans la base de données
    return await validateApiKeyWithProvider(validatedData, providerData, supabase);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * Fonction pour valider une clé API avec un fournisseur spécifique
 */
async function validateApiKeyWithProvider(
  validatedData: { provider: string; apiKey: string },
  providerData: any,
  supabase: any
) {
  // Valider la clé API en fonction du fournisseur
  let isValid = false;
  let message = '';
  let details = {};

  try {
    console.log(`Validation de la clé API pour ${validatedData.provider}...`);

    // Effectuer quelques vérifications préliminaires basiques
    if (validatedData.provider === 'openai' && !validatedData.apiKey.startsWith('sk-')) {
      return NextResponse.json({
        isValid: false,
        message: 'La clé API OpenAI doit commencer par "sk-"',
        provider: providerData
      });
    }

    if (validatedData.provider === 'stability' && validatedData.apiKey.length < 10) {
      return NextResponse.json({
        isValid: false,
        message: 'La clé API Stability AI semble trop courte',
        provider: providerData
      });
    }

    // Vérifier si nous sommes en mode développement et si nous devons simuler la validation
    const isDev = process.env.NODE_ENV === 'development';
    const simulateValidation = process.env.SIMULATE_API_VALIDATION === 'true';

    if (isDev && simulateValidation) {
      console.log('Mode développement: simulation de la validation de la clé API');

      // Simuler la validation en fonction de la clé API
      // Pour les tests, considérer les clés contenant "valid" comme valides
      // et les clés contenant "invalid" comme invalides
      if (validatedData.apiKey.includes('valid')) {
        isValid = true;
        message = `Clé API ${providerData.name} validée avec succès (simulation)`;
        details = {
          type: 'simulated_validation',
          provider: validatedData.provider,
          simulated: true
        };
      } else if (validatedData.apiKey.includes('invalid')) {
        isValid = false;
        message = `Clé API ${providerData.name} invalide (simulation)`;
        details = {
          type: 'invalid_api_key',
          provider: validatedData.provider,
          simulated: true
        };
      } else {
        // Par défaut, considérer la clé comme valide en développement
        isValid = true;
        message = `Clé API ${providerData.name} acceptée par défaut (simulation)`;
        details = {
          type: 'simulated_validation',
          provider: validatedData.provider,
          simulated: true
        };
      }
    } else {
      // Utiliser le service de validation unifié pour une vraie validation
      try {
        console.log('Validation réelle de la clé API pour', validatedData.provider);
        const validationResult = await validateApiKeyForProvider(
          validatedData.provider,
          validatedData.apiKey
        );

        isValid = validationResult.isValid;
        message = validationResult.message;
        details = validationResult.details || {};

        // Ajouter des informations supplémentaires pour le débogage
        details.type = isValid ? 'valid_api_key' : 'invalid_api_key';
        details.provider = validatedData.provider;
        details.simulated = false;
      } catch (error: any) {
        // Si le fournisseur n'est pas supporté par nos services
        if (error.message?.includes('Unsupported provider')) {
          console.log('Fournisseur non supporté pour la validation:', validatedData.provider);
          isValid = true;
          message = `Clé API ${providerData.name} acceptée sans validation (fournisseur non supporté)`;
          details = {
            type: 'unsupported_provider',
            provider: validatedData.provider,
            simulated: false
          };
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la validation de la clé API:', error);
    return NextResponse.json({
      isValid: false,
      message: 'Erreur lors de la validation de la clé API',
      details: { error: String(error) }
    }, { status: 500 });
  }

  // Retourner le résultat de la validation
  return NextResponse.json({
    isValid,
    message,
    provider: providerData,
    details
  });
}
