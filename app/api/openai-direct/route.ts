import { NextRequest, NextResponse } from 'next/server';

/**
 * API pour communiquer directement avec OpenAI sans passer par la base de données
 * Cette route est utilisée uniquement pour la page de test OpenAI
 * ATTENTION: Cette route consomme des crédits OpenAI réels
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer les données de la requête
    const requestData = await request.json();
    const {
      apiKey,
      prompt,
      count = 1,
      returnBase64 = false,
      model = 'dall-e-3',
      size = '1024x1024',
      quality = 'standard',
      style = 'vivid'
    } = requestData;

    // Vérifier que les paramètres requis sont présents
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API manquante' }, { status: 400 });
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt manquant ou invalide' }, { status: 400 });
    }

    // Nettoyer le prompt pour éviter les problèmes d'encodage
    // Filtrer les caractères non-ASCII
    const asciiOnly = [];
    for (let i = 0; i < prompt.length; i++) {
      const charCode = prompt.charCodeAt(i);
      if (charCode >= 32 && charCode <= 126) {
        asciiOnly.push(prompt[i]);
      } else if (charCode === 10 || charCode === 13) {
        // Permettre les sauts de ligne
        asciiOnly.push(prompt[i]);
      } else {
        // Remplacer les caractères non-ASCII par des espaces
        asciiOnly.push(' ');
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

    // Préparer les paramètres de la requête pour OpenAI
    const openaiRequestBody: any = {
      model,
      prompt: sanitizedPrompt,
      n: Math.min(Number(count), model === 'dall-e-3' ? 1 : 4), // Maximum 1 image pour DALL-E 3, 4 pour GPT-image-1
      size,
    };

    // Ajouter le format de réponse en fonction du modèle
    if (model === 'dall-e-3') {
      openaiRequestBody.response_format = returnBase64 ? 'b64_json' : 'url';
    }

    // Ajouter les paramètres spécifiques à DALL-E 3
    if (model === 'dall-e-3') {
      openaiRequestBody.quality = quality;
      openaiRequestBody.style = style;
    }

    // Afficher les informations de la requête pour le débogage
    console.log('openai-direct - Requête à l\'API OpenAI:', JSON.stringify(openaiRequestBody));
    console.log('openai-direct - Longueur de la clé API:', apiKey.length);
    console.log('openai-direct - Premiers caractères de la clé API:', apiKey.substring(0, 5) + '...');

    // Appel à l'API OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(openaiRequestBody)
    });

    // Récupérer la réponse
    const responseText = await openaiResponse.text();

    // Analyser la réponse
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('openai-direct - Erreur lors de l\'analyse de la réponse:', parseError);
      console.error('openai-direct - Réponse brute:', responseText);
      return NextResponse.json({ error: 'Erreur lors de l\'analyse de la réponse de l\'API OpenAI' }, { status: 500 });
    }

    // Vérifier si la requête a réussi
    if (!openaiResponse.ok) {
      const errorMessage = responseData.error?.message || 'Erreur inconnue';
      const errorType = responseData.error?.type || '';
      const errorCode = responseData.error?.code || '';

      console.error('openai-direct - Erreur de l\'API OpenAI:', errorMessage);
      console.error('openai-direct - Type d\'erreur:', errorType);
      console.error('openai-direct - Code d\'erreur:', errorCode);
      console.error('openai-direct - Réponse complète:', JSON.stringify(responseData));

      // Déterminer si c'est une erreur de crédit
      let statusCode = openaiResponse.status;
      let formattedErrorMessage = errorMessage;

      if (errorType === 'insufficient_quota' ||
          errorCode === 'insufficient_quota' ||
          errorMessage.includes('quota') ||
          errorMessage.includes('credit') ||
          errorMessage.includes('billing')) {
        statusCode = 402; // Payment Required
        formattedErrorMessage = 'Erreur de facturation: crédits insuffisants ou quota dépassé';
        console.error('openai-direct - ERREUR DE CRÉDIT DÉTECTÉE');
      }

      return NextResponse.json({
        error: `Erreur de l'API OpenAI: ${formattedErrorMessage}`,
        details: responseData,
        isCreditsError: statusCode === 402
      }, { status: statusCode });
    }

    // Extraire les URLs des images
    const imageUrls = responseData.data.map((image: any) =>
      returnBase64 ? `data:image/jpeg;base64,${image.b64_json}` : image.url
    );

    // Retourner les images générées
    return NextResponse.json({
      images: imageUrls,
      prompt: sanitizedPrompt
    });
  } catch (error: any) {
    console.error('openai-direct - Erreur:', error);
    console.error('openai-direct - Détails de l\'erreur:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Déterminer le code d'erreur approprié
    let statusCode = 500;
    let errorMessage = `Erreur serveur: ${error.message}`;

    if (error.message.includes('authentication') || error.message.includes('invalid') || error.message.includes('key')) {
      statusCode = 401;
      errorMessage = 'Erreur d\'authentification: clé API invalide ou expirée';
    } else if (error.message.includes('billing') || error.message.includes('quota') || error.message.includes('credit')) {
      statusCode = 402;
      errorMessage = 'Erreur de facturation: crédits insuffisants ou quota dépassé';
    } else if (error.message.includes('content policy') || error.message.includes('safety')) {
      statusCode = 400;
      errorMessage = 'Erreur de contenu: le prompt viole les règles de contenu d\'OpenAI';
    }

    return NextResponse.json({
      error: errorMessage,
      details: 'Une erreur s\'est produite lors de la génération d\'images avec OpenAI'
    }, { status: statusCode });
  }
}
