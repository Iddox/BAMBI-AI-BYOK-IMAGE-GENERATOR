#!/usr/bin/env node

/**
 * Script pour synchroniser les fournisseurs d'API et leurs modèles
 * Exécuter avec: node scripts/sync-providers.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Vérifier les variables d'environnement
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Erreur: Les variables d\'environnement NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requises');
  process.exit(1);
}

// Créer un client Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Définition des fournisseurs d'API
const API_PROVIDERS = [
  {
    name: 'OpenAI',
    slug: 'openai',
    description: 'DALL-E 3 et autres modèles de génération d\'images de haute qualité',
    website_url: 'https://openai.com',
    logo_url: '/providers/openai.svg',
    api_base_url: 'https://api.openai.com/v1'
  },
  {
    name: 'Google Gemini',
    slug: 'google',
    description: 'Imagen 3 et autres modèles de génération d\'images via l\'API Gemini',
    website_url: 'https://cloud.google.com',
    logo_url: '/providers/google.svg',
    api_base_url: 'https://generativelanguage.googleapis.com/v1'
  },
  {
    name: 'xAI',
    slug: 'xai',
    description: 'Modèle Grok-2-image-1212 de xAI',
    website_url: 'https://x.ai',
    logo_url: '/providers/xai.svg',
    api_base_url: 'https://api.x.ai/v1'
  }
];

// Définition des modèles par fournisseur
const MODELS = {
  'openai': [
    {
      name: 'DALL·E 3',
      model_id: 'dall-e-3',
      description: 'Modèle de génération d\'images le plus avancé d\'OpenAI',
      capabilities: {
        max_resolution: '1024x1024',
        formats: ['png', 'jpg'],
        supportsHD: true,
        supportedAspectRatios: ['1:1', '16:9', '9:16']
      }
    }
  ],
  'google': [
    {
      name: 'Imagen 3',
      model_id: 'imagen-3.0-generate-002',
      description: 'Modèle de génération d\'images de Google via l\'API Gemini',
      capabilities: {
        max_resolution: '1024x1024',
        formats: ['png'],
        supportsHD: false,
        supportedAspectRatios: ['1:1', '16:9', '9:16', '3:4', '4:3']
      }
    }
  ],
  'xai': [
    {
      name: 'Grok-2-image-1212',
      model_id: 'grok-2-image-1212',
      description: 'Modèle de génération d\'images de xAI',
      capabilities: {
        max_resolution: '1024x1024',
        formats: ['jpeg'],
        supportsHD: false,
        supportedAspectRatios: ['1:1']
      }
    }
  ]
};

// Fonction pour synchroniser les fournisseurs d'API
async function syncProviders() {
  console.log('Synchronisation des fournisseurs d\'API...');
  
  const results = {
    providers: [],
    models: [],
    errors: []
  };
  
  // Synchroniser chaque fournisseur
  for (const provider of API_PROVIDERS) {
    try {
      console.log(`Traitement du fournisseur: ${provider.name} (${provider.slug})`);
      
      // Vérifier si le fournisseur existe déjà
      const { data: existingProvider, error: providerError } = await supabase
        .from('api_providers')
        .select('id, name, slug, api_base_url')
        .eq('slug', provider.slug)
        .maybeSingle();
      
      if (providerError) {
        results.errors.push(`Erreur lors de la vérification du fournisseur ${provider.slug}: ${providerError.message}`);
        continue;
      }
      
      let providerId;
      
      if (existingProvider) {
        // Mettre à jour le fournisseur existant
        const { data: updatedProvider, error: updateError } = await supabase
          .from('api_providers')
          .update({
            name: provider.name,
            description: provider.description,
            website_url: provider.website_url,
            logo_url: provider.logo_url,
            api_base_url: provider.api_base_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProvider.id)
          .select()
          .single();
        
        if (updateError) {
          results.errors.push(`Erreur lors de la mise à jour du fournisseur ${provider.slug}: ${updateError.message}`);
          continue;
        }
        
        providerId = updatedProvider.id;
        results.providers.push({ action: 'updated', provider: updatedProvider });
        console.log(`Fournisseur mis à jour: ${provider.name}`);
      } else {
        // Ajouter le nouveau fournisseur
        const { data: newProvider, error: insertError } = await supabase
          .from('api_providers')
          .insert({
            name: provider.name,
            slug: provider.slug,
            description: provider.description,
            website_url: provider.website_url,
            logo_url: provider.logo_url,
            api_base_url: provider.api_base_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (insertError) {
          results.errors.push(`Erreur lors de l'ajout du fournisseur ${provider.slug}: ${insertError.message}`);
          continue;
        }
        
        providerId = newProvider.id;
        results.providers.push({ action: 'inserted', provider: newProvider });
        console.log(`Nouveau fournisseur ajouté: ${provider.name}`);
      }
      
      // Synchroniser les modèles pour ce fournisseur
      const models = MODELS[provider.slug] || [];
      for (const model of models) {
        try {
          console.log(`Traitement du modèle: ${model.name} (${model.model_id})`);
          
          // Vérifier si le modèle existe déjà
          const { data: existingModel, error: modelError } = await supabase
            .from('models')
            .select('id, name, model_id')
            .eq('provider_id', providerId)
            .eq('model_id', model.model_id)
            .maybeSingle();
          
          if (modelError) {
            results.errors.push(`Erreur lors de la vérification du modèle ${model.model_id}: ${modelError.message}`);
            continue;
          }
          
          if (existingModel) {
            // Mettre à jour le modèle existant
            const { data: updatedModel, error: updateModelError } = await supabase
              .from('models')
              .update({
                name: model.name,
                description: model.description,
                capabilities: model.capabilities,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingModel.id)
              .select()
              .single();
            
            if (updateModelError) {
              results.errors.push(`Erreur lors de la mise à jour du modèle ${model.model_id}: ${updateModelError.message}`);
              continue;
            }
            
            results.models.push({ action: 'updated', model: updatedModel });
            console.log(`Modèle mis à jour: ${model.name}`);
          } else {
            // Ajouter le nouveau modèle
            const { data: newModel, error: insertModelError } = await supabase
              .from('models')
              .insert({
                provider_id: providerId,
                name: model.name,
                model_id: model.model_id,
                description: model.description,
                capabilities: model.capabilities,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();
            
            if (insertModelError) {
              results.errors.push(`Erreur lors de l'ajout du modèle ${model.model_id}: ${insertModelError.message}`);
              continue;
            }
            
            results.models.push({ action: 'inserted', model: newModel });
            console.log(`Nouveau modèle ajouté: ${model.name}`);
          }
        } catch (modelError) {
          results.errors.push(`Exception lors de la synchronisation du modèle ${model.model_id}: ${modelError.message}`);
        }
      }
    } catch (providerError) {
      results.errors.push(`Exception lors de la synchronisation du fournisseur ${provider.slug}: ${providerError.message}`);
    }
  }
  
  return results;
}

// Exécuter la synchronisation
syncProviders()
  .then(results => {
    console.log('\nRésultats de la synchronisation:');
    console.log(`Fournisseurs: ${results.providers.length} (${results.providers.filter(p => p.action === 'inserted').length} ajoutés, ${results.providers.filter(p => p.action === 'updated').length} mis à jour)`);
    console.log(`Modèles: ${results.models.length} (${results.models.filter(m => m.action === 'inserted').length} ajoutés, ${results.models.filter(m => m.action === 'updated').length} mis à jour)`);
    
    if (results.errors.length > 0) {
      console.log(`\nErreurs (${results.errors.length}):`);
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\nSynchronisation terminée!');
  })
  .catch(error => {
    console.error('Erreur lors de la synchronisation:', error);
    process.exit(1);
  });
