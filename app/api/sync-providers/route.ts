import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { API_PROVIDERS, PROVIDER_MODELS_INFO } from '@/lib/constants/api-providers';

/**
 * Route API pour synchroniser les fournisseurs d'API entre le frontend et la base de données
 * Cette route exécute directement les requêtes SQL nécessaires pour s'assurer que tous les fournisseurs
 * définis dans le frontend existent dans la table api_providers de Supabase.
 */
export async function POST(request: Request) {
  try {
    // Créer un client Supabase côté serveur
    const supabase = createServerSupabaseClient();

    // Vérifier si l'utilisateur est authentifié et est administrateur
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer l'utilisateur
    const { data: { user } } = await supabase.auth.getUser();
    
    // Vérifier si l'utilisateur est administrateur (à adapter selon votre logique d'administration)
    // Pour le développement, nous permettons à tous les utilisateurs d'exécuter cette route
    const isAdmin = process.env.NODE_ENV === 'development' || user?.email === process.env.ADMIN_EMAIL;
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Résultats de la synchronisation
    const results = {
      providers: [] as any[],
      models: [] as any[],
      errors: [] as string[]
    };

    // Synchroniser chaque fournisseur défini dans le frontend
    for (const provider of API_PROVIDERS) {
      try {
        // Vérifier si le fournisseur existe déjà
        const { data: existingProvider, error: providerError } = await supabase
          .from('api_providers')
          .select('id, name, slug')
          .eq('slug', provider.value)
          .single();

        if (providerError && providerError.code !== 'PGRST116') { // PGRST116 = not found
          results.errors.push(`Erreur lors de la vérification du fournisseur ${provider.value}: ${providerError.message}`);
          continue;
        }

        // Déterminer l'URL de base de l'API en fonction du fournisseur
        const apiBaseUrl = 
          provider.value === 'openai' ? 'https://api.openai.com/v1' :
          provider.value === 'google' ? 'https://generativelanguage.googleapis.com/v1' :
          provider.value === 'xai' ? 'https://api.x.ai/v1' : '';

        if (existingProvider) {
          // Mettre à jour le fournisseur existant
          const { data: updatedProvider, error: updateError } = await supabase
            .from('api_providers')
            .update({
              name: provider.label,
              description: provider.description,
              api_base_url: apiBaseUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingProvider.id)
            .select()
            .single();

          if (updateError) {
            results.errors.push(`Erreur lors de la mise à jour du fournisseur ${provider.value}: ${updateError.message}`);
          } else {
            results.providers.push({ action: 'updated', provider: updatedProvider });
          }
        } else {
          // Ajouter le nouveau fournisseur
          const { data: newProvider, error: insertError } = await supabase
            .from('api_providers')
            .insert({
              name: provider.label,
              slug: provider.value,
              description: provider.description,
              website_url: provider.value === 'openai' ? 'https://openai.com' :
                          provider.value === 'google' ? 'https://cloud.google.com' :
                          provider.value === 'xai' ? 'https://x.ai' : '',
              logo_url: `/providers/${provider.value}.svg`,
              api_base_url: apiBaseUrl
            })
            .select()
            .single();

          if (insertError) {
            results.errors.push(`Erreur lors de l'ajout du fournisseur ${provider.value}: ${insertError.message}`);
          } else {
            results.providers.push({ action: 'inserted', provider: newProvider });
          }
        }

        // Récupérer l'ID du fournisseur (qu'il soit nouveau ou existant)
        const { data: providerData } = await supabase
          .from('api_providers')
          .select('id')
          .eq('slug', provider.value)
          .single();

        if (!providerData) {
          results.errors.push(`Impossible de récupérer l'ID du fournisseur ${provider.value}`);
          continue;
        }

        // Synchroniser les modèles pour ce fournisseur
        const models = PROVIDER_MODELS_INFO[provider.value] || [];
        for (const model of models) {
          try {
            // Vérifier si le modèle existe déjà
            const { data: existingModel, error: modelError } = await supabase
              .from('models')
              .select('id')
              .eq('provider_id', providerData.id)
              .eq('model_id', model.value)
              .single();

            if (modelError && modelError.code !== 'PGRST116') { // PGRST116 = not found
              results.errors.push(`Erreur lors de la vérification du modèle ${model.value}: ${modelError.message}`);
              continue;
            }

            if (existingModel) {
              // Mettre à jour le modèle existant
              const { data: updatedModel, error: updateError } = await supabase
                .from('models')
                .update({
                  name: model.label,
                  description: model.description,
                  capabilities: model.capabilities,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingModel.id)
                .select()
                .single();

              if (updateError) {
                results.errors.push(`Erreur lors de la mise à jour du modèle ${model.value}: ${updateError.message}`);
              } else {
                results.models.push({ action: 'updated', model: updatedModel });
              }
            } else {
              // Ajouter le nouveau modèle
              const { data: newModel, error: insertError } = await supabase
                .from('models')
                .insert({
                  provider_id: providerData.id,
                  name: model.label,
                  model_id: model.value,
                  description: model.description,
                  capabilities: model.capabilities,
                  is_active: true
                })
                .select()
                .single();

              if (insertError) {
                results.errors.push(`Erreur lors de l'ajout du modèle ${model.value}: ${insertError.message}`);
              } else {
                results.models.push({ action: 'inserted', model: newModel });
              }
            }
          } catch (modelError: any) {
            results.errors.push(`Exception lors de la synchronisation du modèle ${model.value}: ${modelError.message}`);
          }
        }
      } catch (providerError: any) {
        results.errors.push(`Exception lors de la synchronisation du fournisseur ${provider.value}: ${providerError.message}`);
      }
    }

    // Retourner les résultats de la synchronisation
    return NextResponse.json({
      success: true,
      message: 'Synchronisation des fournisseurs terminée',
      results
    });
  } catch (error: any) {
    console.error('Erreur lors de la synchronisation des fournisseurs:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erreur serveur'
    }, { status: 500 });
  }
}
