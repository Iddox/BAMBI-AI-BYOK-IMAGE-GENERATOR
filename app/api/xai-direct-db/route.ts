import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';

/**
 * API qui utilise directement la clé API stockée dans Supabase sans déchiffrement
 * Cette route est conçue pour résoudre définitivement les problèmes de génération d'images avec xAI
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer les données de la requête
    const requestData = await request.json();
    const { configurationId, prompt, count = 2 } = requestData;

    // Vérifier que les paramètres requis sont présents
    if (!configurationId) {
      return NextResponse.json({ error: 'ID de configuration manquant' }, { status: 400 });
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt manquant ou invalide' }, { status: 400 });
    }

    // Créer un client Supabase
    const supabase = createServerSupabaseClient();

    // Vérifier si l'utilisateur est connecté
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Utilisateur non connecté' }, { status: 401 });
    }

    // Récupérer la configuration API
    const { data: config, error: configError } = await supabase
      .from('api_configurations')
      .select('*, api_providers(slug)')
      .eq('id', configurationId)
      .eq('user_id', session.user.id)
      .single();

    if (configError || !config) {
      console.error('xai-direct-db - Erreur lors de la récupération de la configuration:', configError);
      return NextResponse.json({ error: 'Configuration API non trouvée' }, { status: 404 });
    }

    // Afficher les détails de la configuration pour le débogage
    console.log('xai-direct-db - Configuration récupérée:', {
      id: config.id,
      provider_id: config.provider_id,
      provider_info: config.api_providers,
      model: config.model
    });

    // Vérifier que la configuration est pour xAI en utilisant le slug du fournisseur
    const providerSlug = config.api_providers?.slug;
    console.log('xai-direct-db - Provider slug:', providerSlug);

    if (providerSlug !== 'xai') {
      return NextResponse.json({
        error: `Cette configuration n'est pas pour xAI (provider: ${providerSlug})`,
        details: { provider: providerSlug }
      }, { status: 400 });
    }

    // Utiliser directement la clé API stockée dans Supabase sans déchiffrement
    const apiKey = config.api_key;

    // Nettoyer le prompt pour s'assurer qu'il ne contient que des caractères ASCII
    const promptString = String(prompt);

    // Nettoyer le prompt en ne gardant que les caractères ASCII standard (32-126)
    const asciiOnly = [];
    for (let i = 0; i < promptString.length; i++) {
      const charCode = promptString.charCodeAt(i);
      // Ne garder que les caractères ASCII imprimables (32-126)
      if (charCode >= 32 && charCode <= 126) {
        asciiOnly.push(promptString.charAt(i));
      } else {
        asciiOnly.push(' '); // Remplacer par un espace
      }
    }

    // Joindre les caractères en une chaîne
    const sanitizedPrompt = asciiOnly.join('');

    // Vérifier si le prompt est vide après nettoyage
    if (!sanitizedPrompt.trim()) {
      return NextResponse.json({
        error: 'Le prompt est vide après sanitisation. Veuillez utiliser uniquement des caractères ASCII standard.'
      }, { status: 400 });
    }

    // Préparer les paramètres de la requête pour xAI
    const xaiRequestBody = {
      model: 'grok-2-image-1212',
      prompt: sanitizedPrompt,
      n: Math.min(Number(count), 10), // Maximum 10 images par requête
      response_format: 'url'
    };

    // Utiliser TextEncoder pour encoder le corps de la requête en UTF-8
    const encoder = new TextEncoder();
    const encodedBody = encoder.encode(JSON.stringify(xaiRequestBody));

    // Afficher les informations de la requête pour le débogage
    console.log('xai-direct-db - Requête à l\'API xAI:', JSON.stringify(xaiRequestBody));
    console.log('xai-direct-db - Longueur de la clé API:', apiKey.length);
    console.log('xai-direct-db - Premiers caractères de la clé API:', apiKey.substring(0, 5) + '...');

    // Appel à l'API xAI
    const xaiResponse = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey
      },
      body: encodedBody
    });

    // Récupérer la réponse
    const responseText = await xaiResponse.text();

    // Analyser la réponse
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('xai-direct-db - Erreur lors de l\'analyse de la réponse:', parseError);
      console.error('xai-direct-db - Réponse brute:', responseText);
      return NextResponse.json({ error: 'Erreur lors de l\'analyse de la réponse de l\'API xAI' }, { status: 500 });
    }

    // Vérifier si la réponse contient une erreur
    if (!xaiResponse.ok) {
      console.error('xai-direct-db - Erreur de l\'API xAI:', responseData);
      console.error('xai-direct-db - Statut de la réponse:', xaiResponse.status, xaiResponse.statusText);
      console.error('xai-direct-db - Texte brut de la réponse:', responseText);

      // Construire un message d'erreur plus détaillé
      let errorMessage = 'Erreur inconnue';
      if (responseData.error?.message) {
        errorMessage = responseData.error.message;
      } else if (responseData.error?.code) {
        errorMessage = `Code d'erreur: ${responseData.error.code}`;
      } else if (responseData.error) {
        errorMessage = JSON.stringify(responseData.error);
      }

      return NextResponse.json({
        error: `Erreur de l'API xAI: ${errorMessage}`,
        details: responseData
      }, { status: xaiResponse.status });
    }

    // Extraire les URLs des images
    const imageUrls = responseData.data.map((image: any) => image.url);

    // Créer des objets image simplifiés
    const generatedImages = imageUrls.map((url, index) => ({
      id: `temp-${Date.now()}-${index}`,
      url: url,
      prompt: sanitizedPrompt,
      timestamp: new Date().toISOString()
    }));

    // Retourner les images générées
    return NextResponse.json({
      images: generatedImages
    });
  } catch (error: any) {
    console.error('xai-direct-db - Erreur:', error);
    return NextResponse.json({ error: `Erreur serveur: ${error.message}` }, { status: 500 });
  }
}
