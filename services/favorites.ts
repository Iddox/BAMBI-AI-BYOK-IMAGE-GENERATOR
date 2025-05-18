'use client';

import { createClient } from '@/utils/supabase/client';

export type FavoriteImage = {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
  added_at: Date;
};

/**
 * Récupère toutes les images favorites de l'utilisateur
 */
export async function getUserFavorites(): Promise<FavoriteImage[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      added_at,
      generated_images:image_id(id, image_url, prompt, created_at)
    `)
    .eq('user_id', user.id)
    .order('added_at', { ascending: false });
  
  if (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    return [];
  }
  
  // Transformer les données
  return data.map(item => ({
    id: item.generated_images.id,
    url: item.generated_images.image_url,
    prompt: item.generated_images.prompt,
    timestamp: new Date(item.generated_images.created_at),
    added_at: new Date(item.added_at)
  }));
}

/**
 * Vérifie si une image est dans les favoris de l'utilisateur
 */
export async function isImageFavorite(imageId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { data, error } = await supabase
    .from('favorites')
    .select('image_id')
    .eq('user_id', user.id)
    .eq('image_id', imageId)
    .single();
  
  if (error) {
    // Si l'erreur est PGRST116, c'est que l'image n'est pas dans les favoris
    if (error.code === 'PGRST116') {
      return false;
    }
    
    console.error('Erreur lors de la vérification des favoris:', error);
    return false;
  }
  
  return !!data;
}

/**
 * Ajoute une image aux favoris
 */
export async function addToFavorites(imageId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // Vérifier que l'image existe et appartient à l'utilisateur
  const { data: image, error: imageError } = await supabase
    .from('generated_images')
    .select('id')
    .eq('id', imageId)
    .eq('user_id', user.id)
    .single();
  
  if (imageError || !image) {
    console.error('Erreur lors de la vérification de l\'image:', imageError);
    return false;
  }
  
  const { error } = await supabase
    .from('favorites')
    .insert({
      user_id: user.id,
      image_id: imageId
    });
  
  if (error) {
    // Si l'erreur est due à une contrainte de clé primaire, c'est que l'image est déjà dans les favoris
    if (error.code === '23505') {
      console.log('L\'image est déjà dans les favoris');
      return true;
    }
    
    console.error('Erreur lors de l\'ajout aux favoris:', error);
    return false;
  }
  
  return true;
}

/**
 * Supprime une image des favoris
 */
export async function removeFromFavorites(imageId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('image_id', imageId);
  
  if (error) {
    console.error('Erreur lors de la suppression des favoris:', error);
    return false;
  }
  
  return true;
}
