'use client';

import { createClient } from '@/utils/supabase/client';

export type GeneratedImage = {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
  isPublic?: boolean;
};

// Cache pour les IDs des fournisseurs
const providerIdCache: Record<string, number> = {};

// Cache pour l'ID utilisateur
let cachedUserId: string | null = null;

/**
 * Récupère l'ID du fournisseur à partir du slug, avec mise en cache
 * @param supabase Client Supabase
 * @param provider Slug du fournisseur
 * @returns ID du fournisseur ou null
 */
async function getProviderId(supabase: any, provider: string): Promise<number | null> {
  // Si l'ID est déjà en cache, le retourner
  if (providerIdCache[provider] !== undefined) {
    return providerIdCache[provider];
  }

  // Sinon, récupérer l'ID depuis Supabase
  if (provider) {
    try {
      const { data: providerData } = await supabase
        .from('api_providers')
        .select('id')
        .eq('slug', provider)
        .single();

      if (providerData) {
        // Mettre en cache l'ID pour les prochaines requêtes
        providerIdCache[provider] = providerData.id;
        return providerData.id;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ID du fournisseur:', error);
    }
  }

  return null;
}

/**
 * Récupère l'ID de l'utilisateur actuel, avec mise en cache
 * @param supabase Client Supabase
 * @returns ID de l'utilisateur ou null
 */
async function getUserId(supabase: any): Promise<string | null> {
  // Si l'ID est déjà en cache, le retourner
  if (cachedUserId) {
    return cachedUserId;
  }

  // Sinon, récupérer l'ID depuis Supabase
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Mettre en cache l'ID pour les prochaines requêtes
      cachedUserId = user.id;
      return user.id;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
  }

  return null;
}

/**
 * Enregistre une image générée dans Supabase de manière asynchrone
 * @param imageUrl URL de l'image générée
 * @param prompt Prompt utilisé pour générer l'image
 * @param configurationId ID de la configuration API utilisée
 * @param provider Fournisseur de l'API (openai, google, xai, etc.)
 * @param model Modèle utilisé (dall-e-3, imagen-2, grok-2-image-1212, etc.)
 * @returns Promise qui se résout avec l'ID de l'image ou null
 */
export async function saveGeneratedImage(
  imageUrl: string,
  prompt: string,
  configurationId: string,
  provider: string,
  model: string
): Promise<string | null> {
  const supabase = createClient();

  try {
    // Récupérer l'ID utilisateur et l'ID du fournisseur en parallèle
    const [userId, providerId] = await Promise.all([
      getUserId(supabase),
      getProviderId(supabase, provider)
    ]);

    if (!userId) return null;

    // Enregistrer l'image dans Supabase
    const { data, error } = await supabase
      .from('generated_images')
      .insert({
        user_id: userId,
        prompt: prompt,
        image_url: imageUrl,
        configuration_id: configurationId,
        provider_id: providerId,
        model: model,
        is_public: false, // Par défaut, les images ne sont pas publiques
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      // Gérer les erreurs spécifiques
      if (error.code === 'PGRST204') {
        // Erreur de colonne manquante, essayer sans le champ is_public
        const { data: retryData, error: retryError } = await supabase
          .from('generated_images')
          .insert({
            user_id: userId,
            prompt: prompt,
            image_url: imageUrl,
            configuration_id: configurationId,
            provider_id: providerId,
            model: model,
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (retryError) {
          console.error('Erreur lors de la seconde tentative d\'enregistrement de l\'image:', retryError);
          return null;
        }

        console.log('Image enregistrée avec succès (sans is_public), ID:', retryData.id);
        return retryData.id;
      }

      console.error('Erreur lors de l\'enregistrement de l\'image:', error);
      return null;
    }

    console.log('Image enregistrée avec succès, ID:', data.id);
    return data.id;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'image:', error);
    return null;
  }
}

/**
 * Enregistre plusieurs images générées dans Supabase de manière asynchrone
 * @param images Tableau d'objets contenant les informations des images
 * @param configurationId ID de la configuration API utilisée
 * @param provider Fournisseur de l'API
 * @param model Modèle utilisé
 * @returns Promise qui se résout avec un tableau des IDs des images
 */
export async function saveGeneratedImages(
  images: { url: string; prompt: string }[],
  configurationId: string,
  provider: string,
  model: string
): Promise<string[]> {
  // Si aucune image à enregistrer, retourner un tableau vide
  if (!images || images.length === 0) return [];

  const supabase = createClient();

  try {
    // Récupérer l'ID utilisateur et l'ID du fournisseur en parallèle
    const [userId, providerId] = await Promise.all([
      getUserId(supabase),
      getProviderId(supabase, provider)
    ]);

    if (!userId) return [];

    // Préparer les données pour l'insertion en masse
    const imagesToInsert = images.map(image => ({
      user_id: userId,
      prompt: image.prompt,
      image_url: image.url,
      configuration_id: configurationId,
      provider_id: providerId,
      model: model,
      is_public: false,
      created_at: new Date().toISOString()
    }));

    // Insérer toutes les images en une seule requête
    const { data, error } = await supabase
      .from('generated_images')
      .insert(imagesToInsert)
      .select('id');

    if (error) {
      // Gérer les erreurs spécifiques
      if (error.code === 'PGRST204') {
        // Erreur de colonne manquante, essayer sans le champ is_public
        const imagesToInsertWithoutPublic = images.map(image => ({
          user_id: userId,
          prompt: image.prompt,
          image_url: image.url,
          configuration_id: configurationId,
          provider_id: providerId,
          model: model,
          created_at: new Date().toISOString()
        }));

        const { data: retryData, error: retryError } = await supabase
          .from('generated_images')
          .insert(imagesToInsertWithoutPublic)
          .select('id');

        if (retryError) {
          console.error('Erreur lors de la seconde tentative d\'enregistrement des images:', retryError);
          return [];
        }

        console.log(`${retryData.length} images enregistrées avec succès (sans is_public)`);
        return retryData.map(item => item.id);
      }

      console.error('Erreur lors de l\'enregistrement des images:', error);
      return [];
    }

    console.log(`${data.length} images enregistrées avec succès`);
    return data.map(item => item.id);
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des images:', error);
    return [];
  }
}

/**
 * Récupère toutes les images générées par l'utilisateur
 * @returns Tableau des images générées
 */
export async function getUserImages(): Promise<GeneratedImage[]> {
  const supabase = createClient();

  // Récupérer l'utilisateur actuel
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    // Récupérer les images générées par l'utilisateur
    const { data, error } = await supabase
      .from('generated_images')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des images:', error);
      return [];
    }

    // Transformer les données pour correspondre à notre format GeneratedImage
    return data.map(item => ({
      id: item.id,
      url: item.image_url,
      prompt: item.prompt,
      timestamp: new Date(item.created_at),
      isPublic: item.is_public || false,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des images:', error);
    return [];
  }
}
