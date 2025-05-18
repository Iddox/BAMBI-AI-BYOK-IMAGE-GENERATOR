'use client';

import { createClient } from '@/utils/supabase/client';

export type Tag = {
  id: string;
  name: string;
  color: string;
  created_at: string;
  image_count?: number;
};

/**
 * Récupère tous les tags de l'utilisateur
 */
export async function getUserTags(): Promise<Tag[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('tags')
    .select(`
      *,
      image_count:image_tags(count)
    `)
    .eq('user_id', user.id)
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Erreur lors de la récupération des tags:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Récupère les images associées à un tag
 */
export async function getImagesWithTag(tagId: string): Promise<any[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  // Vérifier que l'utilisateur est propriétaire du tag
  const { data: tag, error: tagError } = await supabase
    .from('tags')
    .select('id')
    .eq('id', tagId)
    .eq('user_id', user.id)
    .single();
  
  if (tagError || !tag) {
    console.error('Erreur lors de la vérification du tag:', tagError);
    return [];
  }
  
  // Récupérer les images avec ce tag
  const { data, error } = await supabase
    .from('image_tags')
    .select(`
      tag_id,
      generated_images:image_id(id, image_url, prompt, created_at)
    `)
    .eq('tag_id', tagId);
  
  if (error) {
    console.error('Erreur lors de la récupération des images avec tag:', error);
    return [];
  }
  
  // Transformer les données
  return data.map(item => ({
    id: item.generated_images.id,
    url: item.generated_images.image_url,
    prompt: item.generated_images.prompt,
    timestamp: new Date(item.generated_images.created_at)
  }));
}

/**
 * Crée un nouveau tag
 */
export async function createTag(name: string, color: string = '#7B5CFA'): Promise<string | null> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('tags')
    .insert({
      user_id: user.id,
      name,
      color
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Erreur lors de la création du tag:', error);
    return null;
  }
  
  return data.id;
}

/**
 * Met à jour un tag existant
 */
export async function updateTag(tagId: string, name: string, color: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { error } = await supabase
    .from('tags')
    .update({ name, color })
    .eq('id', tagId)
    .eq('user_id', user.id);
  
  if (error) {
    console.error('Erreur lors de la mise à jour du tag:', error);
    return false;
  }
  
  return true;
}

/**
 * Supprime un tag
 */
export async function deleteTag(tagId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', tagId)
    .eq('user_id', user.id);
  
  if (error) {
    console.error('Erreur lors de la suppression du tag:', error);
    return false;
  }
  
  return true;
}

/**
 * Ajoute un tag à une image
 */
export async function addTagToImage(tagId: string, imageId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // Vérifier que l'utilisateur est propriétaire du tag
  const { data: tag, error: tagError } = await supabase
    .from('tags')
    .select('id')
    .eq('id', tagId)
    .eq('user_id', user.id)
    .single();
  
  if (tagError || !tag) {
    console.error('Erreur lors de la vérification du tag:', tagError);
    return false;
  }
  
  // Ajouter le tag à l'image
  const { error } = await supabase
    .from('image_tags')
    .insert({
      tag_id: tagId,
      image_id: imageId
    });
  
  if (error) {
    // Si l'erreur est due à une contrainte de clé primaire, c'est que le tag est déjà associé à l'image
    if (error.code === '23505') {
      console.log('Le tag est déjà associé à l\'image');
      return true;
    }
    
    console.error('Erreur lors de l\'ajout du tag à l\'image:', error);
    return false;
  }
  
  return true;
}

/**
 * Supprime un tag d'une image
 */
export async function removeTagFromImage(tagId: string, imageId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // Vérifier que l'utilisateur est propriétaire du tag
  const { data: tag, error: tagError } = await supabase
    .from('tags')
    .select('id')
    .eq('id', tagId)
    .eq('user_id', user.id)
    .single();
  
  if (tagError || !tag) {
    console.error('Erreur lors de la vérification du tag:', tagError);
    return false;
  }
  
  const { error } = await supabase
    .from('image_tags')
    .delete()
    .eq('tag_id', tagId)
    .eq('image_id', imageId);
  
  if (error) {
    console.error('Erreur lors de la suppression du tag de l\'image:', error);
    return false;
  }
  
  return true;
}
