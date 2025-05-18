import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/utils/encryption';
import { createServerSupabaseClient } from '@/utils/supabase/server';

/**
 * API Proxy pour xAI
 * Cette route sert de proxy pour l'API xAI afin de contourner les problèmes d'encodage
 * Elle reçoit les requêtes du client, les transmet à l'API xAI, et renvoie les réponses
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer les données de la requête
    const requestData = await request.json();
    const { configurationId, prompt } = requestData;

    // Vérifier que les paramètres requis sont présents
    if (!configurationId) {
      return NextResponse.json({ error: 'ID de configuration manquant' }, { status: 400 });
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt manquant ou invalide' }, { status: 400 });
    }

    // Créer le client Supabase
    const supabase = createServerSupabaseClient();

    // Vérifier l'authentification
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer la configuration API
    const { data: config, error: configError } = await supabase
      .from('api_configurations')
      .select('*')
      .eq('id', configurationId)
      .single();

    if (configError) {
      console.error('xai-proxy - Erreur lors de la récupération de la configuration:', configError);
      return NextResponse.json({ error: 'Configuration non trouvée' }, { status: 404 });
    }

    // Vérifier que la configuration appartient à l'utilisateur
    if (config.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Vous n\'êtes pas autorisé à utiliser cette configuration' }, { status: 403 });
    }

    // Déchiffrer la clé API
    let apiKey;
    try {
      apiKey = decrypt(config.api_key);
      if (!apiKey) {
        console.error('xai-proxy - Clé API vide après déchiffrement');
        return NextResponse.json({ error: 'Erreur de déchiffrement de la clé API' }, { status: 400 });
      }
    } catch (decryptError) {
      console.error('xai-proxy - Erreur lors du déchiffrement de la clé API:', decryptError);
      return NextResponse.json({ error: 'Erreur de déchiffrement de la clé API' }, { status: 400 });
    }

    // Nettoyer le prompt de manière très stricte pour s'assurer qu'il ne contient que des caractères ASCII
    // Convertir d'abord en chaîne pour éviter les problèmes avec les types non-string
    const promptString = String(prompt);

    // Nettoyer le prompt en ne gardant que les caractères ASCII standard (32-126)
    // Utiliser une méthode simple et directe
    const sanitizedPrompt = promptString.replace(/[^\x20-\x7E]/g, ' ');

    // Vérifier si le prompt est vide après nettoyage
    if (!sanitizedPrompt.trim()) {
      console.error('xai-proxy - Le prompt est vide après sanitisation');
      return NextResponse.json({ error: 'Le prompt est vide après sanitisation' }, { status: 400 });
    }

    // Préparer les paramètres de la requête pour xAI
    // S'assurer que tous les champs sont des chaînes ASCII valides
    const xaiRequestBody = {
      model: 'grok-2-image-1212',
      prompt: sanitizedPrompt,
      n: parseInt(String(requestData.count || 2)), // Convertir en nombre entier
      response_format: 'url'
    };

    console.log('xai-proxy - Requête à l\'API xAI:', JSON.stringify(xaiRequestBody));

    try {
      // Convertir l'objet en JSON en s'assurant qu'il ne contient que des caractères ASCII
      const jsonString = JSON.stringify(xaiRequestBody);

      // Vérifier si le JSON contient des caractères non-ASCII
      const hasNonAscii = /[^\x00-\x7F]/.test(jsonString);
      let cleanJsonString = jsonString;

      if (hasNonAscii) {
        console.warn('xai-proxy - Le JSON contient des caractères non-ASCII, nettoyage supplémentaire...');
        // Remplacer tous les caractères non-ASCII par des espaces
        cleanJsonString = jsonString.replace(/[^\x00-\x7F]/g, ' ');
        console.log('xai-proxy - JSON nettoyé:', cleanJsonString);
      }

      // Créer un objet directement à partir de la chaîne JSON nettoyée
      const cleanObject = JSON.parse(cleanJsonString);

      // Appel à l'API xAI avec l'objet nettoyé
      const xaiResponse = await fetch('https://api.x.ai/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey
        },
        body: JSON.stringify(cleanObject)
      });

      // Récupérer la réponse
      const responseText = await xaiResponse.text();
      console.log(`xai-proxy - Statut de la réponse: ${xaiResponse.status} ${xaiResponse.statusText}`);

      // Analyser la réponse
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('xai-proxy - Erreur lors de l\'analyse de la réponse:', parseError);
        console.error('xai-proxy - Réponse brute:', responseText);
        return NextResponse.json({ error: 'Erreur lors de l\'analyse de la réponse de l\'API xAI' }, { status: 500 });
      }

      // Vérifier si la réponse contient une erreur
      if (!xaiResponse.ok) {
        console.error('xai-proxy - Erreur de l\'API xAI:', responseData);
        return NextResponse.json({
          error: `Erreur de l'API xAI: ${responseData.error?.message || 'Erreur inconnue'}`,
          details: responseData
        }, { status: xaiResponse.status });
      }

      // Extraire les URLs des images
      const imageUrls = responseData.data.map((image: any) => image.url);

      // Enregistrer les images générées dans la base de données
      const generatedImages = [];
      for (const imageUrl of imageUrls) {
        const { data: image, error: imageError } = await supabase
          .from('generated_images')
          .insert({
            user_id: session.user.id,
            prompt: sanitizedPrompt,
            original_prompt: prompt,
            image_url: imageUrl,
            configuration_id: configurationId,
            provider_id: config.provider_id,
            model: 'grok-2-image-1212',
            resolution: '1024x1024',
            is_public: false
          })
          .select()
          .single();

        if (imageError) {
          console.error('xai-proxy - Erreur lors de l\'enregistrement de l\'image:', imageError);
          continue;
        }

        generatedImages.push(image);
      }

      // Incrémenter le compteur de générations utilisées
      const { data: quota, error: quotaError } = await supabase
        .from('user_quotas')
        .select('monthly_generations_used, monthly_generations_limit')
        .eq('user_id', session.user.id)
        .single();

      if (!quotaError) {
        await supabase
          .from('user_quotas')
          .update({
            monthly_generations_used: (quota.monthly_generations_used || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', session.user.id);
      }

      // Retourner les images générées
      return NextResponse.json({
        images: generatedImages.map(image => ({
          id: image.id,
          url: image.image_url,
          prompt: image.prompt,
          timestamp: image.created_at
        }))
      });
    } catch (innerError) {
      console.error('xai-proxy - Erreur interne:', innerError);
      return NextResponse.json({ error: `Erreur lors de la communication avec l'API xAI: ${innerError.message}` }, { status: 500 });
    }
  } catch (error: any) {
    console.error('xai-proxy - Erreur:', error);
    return NextResponse.json({ error: `Erreur serveur: ${error.message}` }, { status: 500 });
  }
}
