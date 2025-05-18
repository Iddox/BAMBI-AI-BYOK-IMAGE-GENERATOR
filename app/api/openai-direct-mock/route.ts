import { NextRequest, NextResponse } from 'next/server';

/**
 * API pour simuler l'API OpenAI sans consommer de crédits
 * Cette route est utilisée uniquement pour la page de test OpenAI
 */
export async function POST(request: NextRequest) {
  try {
    console.log('openai-direct-mock - Début du traitement de la requête');

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

    console.log(`openai-direct-mock - Requête reçue avec modèle: ${model}, taille: ${size}`);

    // Vérifier que les paramètres requis sont présents
    if (!apiKey) {
      console.log('openai-direct-mock - Erreur: Clé API manquante');
      return NextResponse.json({ error: 'Clé API manquante' }, { status: 400 });
    }

    if (!prompt || typeof prompt !== 'string') {
      console.log('openai-direct-mock - Erreur: Prompt manquant ou invalide');
      return NextResponse.json({ error: 'Prompt manquant ou invalide' }, { status: 400 });
    }

    console.log(`openai-direct-mock - Génération d'images pour le prompt: "${prompt.substring(0, 30)}..."`);

    // Simuler un délai pour rendre l'expérience plus réaliste
    console.log('openai-direct-mock - Simulation d\'un délai de traitement...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Images de démonstration (URLs d'images réelles pour une meilleure expérience)
    // Utiliser des images statiques hébergées sur des CDN fiables pour éviter les problèmes de CORS
    // Utiliser des URLs d'images fixes pour éviter les problèmes de cache et de redirection
    const mockImages = [
      'https://i.imgur.com/jNNT4ew.jpg', // Image fixe 1
      'https://i.imgur.com/L7Lv8Nd.jpg', // Image fixe 2
      'https://i.imgur.com/vxAXP9J.jpg', // Image fixe 3
      'https://i.imgur.com/D4ZV27q.jpg'  // Image fixe 4
    ];

    // Si returnBase64 est true, on renvoie des données base64 simulées
    const base64Images = [
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    ];

    // Sélectionner le nombre d'images demandé
    const numImages = Math.min(Number(count), 4);
    const selectedImages = returnBase64
      ? base64Images.slice(0, numImages)
      : mockImages.slice(0, numImages);

    // Utiliser les images telles quelles sans ajouter de texte
    // Les images d'Unsplash sont déjà de haute qualité et n'ont pas besoin de texte supplémentaire

    // Simuler la réponse de l'API OpenAI
    const mockResponse = {
      created: Math.floor(Date.now() / 1000),
      data: selectedImages.map(url => ({ url })),
      model: model,
      // Inclure les paramètres reçus pour montrer qu'ils sont bien pris en compte
      params: {
        model,
        size,
        quality,
        style,
        count
      }
    };

    console.log(`openai-direct-mock - Génération réussie, retour de ${selectedImages.length} images`);

    // Retourner les images générées
    return NextResponse.json({
      images: selectedImages,
      prompt: prompt,
      mockData: mockResponse
    });
  } catch (error: any) {
    console.error('openai-direct-mock - Erreur:', error);
    console.error('openai-direct-mock - Détails de l\'erreur:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    return NextResponse.json({
      error: `Erreur serveur: ${error.message}`,
      details: 'Une erreur s\'est produite lors de la simulation de génération d\'images'
    }, { status: 500 });
  }
}
