'use client';

import { createClient } from '@/utils/supabase/client';

export type Collection = {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  cover_image_id: string | null;
  created_at: string;
  updated_at: string;
  image_count?: number;
};

export type CollectionWithImages = Collection & {
  images: {
    id: string;
    url: string;
    prompt: string;
    timestamp: Date;
  }[];
};

/**
 * Récupère toutes les collections de l'utilisateur
 */
export async function getUserCollections(): Promise<Collection[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      image_count:collection_images(count)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Erreur lors de la récupération des collections:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Récupère une collection avec ses images
 */
export async function getCollectionWithImages(collectionId: string): Promise<CollectionWithImages | null> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // Récupérer la collection
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('*')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single();
  
  if (collectionError || !collection) {
    console.error('Erreur lors de la récupération de la collection:', collectionError);
    return null;
  }
  
  // Récupérer les images de la collection
  const { data: collectionImages, error: imagesError } = await supabase
    .from('collection_images')
    .select(`
      image_id,
      generated_images(id, image_url, prompt, created_at)
    `)
    .eq('collection_id', collectionId);
  
  if (imagesError) {
    console.error('Erreur lors de la récupération des images de la collection:', imagesError);
    return { ...collection, images: [] };
  }
  
  // Transformer les données
  const images = collectionImages.map(item => ({
    id: item.generated_images.id,
    url: item.generated_images.image_url,
    prompt: item.generated_images.prompt,
    timestamp: new Date(item.generated_images.created_at)
  }));
  
  return { ...collection, images };
}

/**
 * Crée une nouvelle collection
 */
export async function createCollection(name: string, description: string = '', isPublic: boolean = false): Promise<string | null> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('collections')
    .insert({
      user_id: user.id,
      name,
      description,
      is_public: isPublic
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Erreur lors de la création de la collection:', error);
    return null;
  }
  
  return data.id;
}

/**
 * Met à jour une collection existante
 */
export async function updateCollection(collectionId: string, updates: Partial<Collection>): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // Vérifier que l'utilisateur est propriétaire de la collection
  const { data: collection, error: checkError } = await supabase
    .from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single();
  
  if (checkError || !collection) {
    console.error('Erreur lors de la vérification de la collection:', checkError);
    return false;
  }
  
  // Préparer les données à mettre à jour
  const updateData: any = {
    updated_at: new Date().toISOString()
  };
  
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.is_public !== undefined) updateData.is_public = updates.is_public;
  if (updates.cover_image_id !== undefined) updateData.cover_image_id = updates.cover_image_id;
  
  // Mettre à jour la collection
  const { error } = await supabase
    .from('collections')
    .update(updateData)
    .eq('id', collectionId);
  
  if (error) {
    console.error('Erreur lors de la mise à jour de la collection:', error);
    return false;
  }
  
  return true;
}

/**
 * Supprime une collection
 */
export async function deleteCollection(collectionId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId)
    .eq('user_id', user.id);
  
  if (error) {
    console.error('Erreur lors de la suppression de la collection:', error);
    return false;
  }
  
  return true;
}

/**
 * Ajoute une image à une collection
 */
export async function addImageToCollection(collectionId: string, imageId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // Vérifier que l'utilisateur est propriétaire de la collection
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single();
  
  if (collectionError || !collection) {
    console.error('Erreur lors de la vérification de la collection:', collectionError);
    return false;
  }
  
  // Ajouter l'image à la collection
  const { error } = await supabase
    .from('collection_images')
    .insert({
      collection_id: collectionId,
      image_id: imageId
    });
  
  if (error) {
    // Si l'erreur est due à une contrainte de clé primaire, c'est que l'image est déjà dans la collection
    if (error.code === '23505') {
      console.log('L\'image est déjà dans la collection');
      return true;
    }
    
    console.error('Erreur lors de l\'ajout de l\'image à la collection:', error);
    return false;
  }
  
  // Mettre à jour la date de mise à jour de la collection
  await supabase
    .from('collections')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', collectionId);
  
  return true;
}

/**
 * Supprime une image d'une collection
 */
export async function removeImageFromCollection(collectionId: string, imageId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { error } = await supabase
    .from('collection_images')
    .delete()
    .eq('collection_id', collectionId)
    .eq('image_id', imageId);
  
  if (error) {
    console.error('Erreur lors de la suppression de l\'image de la collection:', error);
    return false;
  }
  
  // Mettre à jour la date de mise à jour de la collection
  await supabase
    .from('collections')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', collectionId);
  
  return true;
}
