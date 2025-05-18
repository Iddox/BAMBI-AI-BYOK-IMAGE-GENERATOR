import { NextRequest, NextResponse } from 'next/server';

/**
 * API pour communiquer directement avec xAI sans passer par la base de données
 * Cette route est utilisée uniquement pour la page de test xAI
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer les données de la requête
    const requestData = await request.json();
    const { apiKey, prompt, count = 1, returnBase64 = false } = requestData;

    // Vérifier que les paramètres requis sont présents
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API manquante' }, { status: 400 });
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt manquant ou invalide' }, { status: 400 });
    }

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
      response_format: returnBase64 ? 'b64_json' : 'url'
    };

    // Utiliser TextEncoder pour encoder le corps de la requête en UTF-8
    const encoder = new TextEncoder();
    const encodedBody = encoder.encode(JSON.stringify(xaiRequestBody));

    // Afficher les informations de la requête pour le débogage
    console.log('xai-direct - Requête à l\'API xAI:', JSON.stringify(xaiRequestBody));
    console.log('xai-direct - Longueur de la clé API:', apiKey.length);
    console.log('xai-direct - Premiers caractères de la clé API:', apiKey.substring(0, 5) + '...');

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
      console.error('xai-direct - Erreur lors de l\'analyse de la réponse:', parseError);
      console.error('xai-direct - Réponse brute:', responseText);
      return NextResponse.json({ error: 'Erreur lors de l\'analyse de la réponse de l\'API xAI' }, { status: 500 });
    }

    // Vérifier si la réponse contient une erreur
    if (!xaiResponse.ok) {
      console.error('xai-direct - Erreur de l\'API xAI:', responseData);
      console.error('xai-direct - Statut de la réponse:', xaiResponse.status, xaiResponse.statusText);
      console.error('xai-direct - Texte brut de la réponse:', responseText);

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
    const imageUrls = responseData.data.map((image: any) =>
      returnBase64 ? `data:image/jpeg;base64,${image.b64_json}` : image.url
    );

    // Retourner les images générées
    return NextResponse.json({
      images: imageUrls,
      prompt: sanitizedPrompt
    });
  } catch (error: any) {
    console.error('xai-direct - Erreur:', error);
    return NextResponse.json({ error: `Erreur serveur: ${error.message}` }, { status: 500 });
  }
}
