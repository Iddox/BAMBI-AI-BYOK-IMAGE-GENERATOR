'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

export type UserData = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  messagesCount: number;
  messagesLimit: number;
  isPremium: boolean;
  createdImages: number;
  hasApiKey: boolean;
  refreshUserData: () => Promise<void>;
};

export function useUserData(): UserData {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [messagesCount, setMessagesCount] = useState(0);
  const [messagesLimit, setMessagesLimit] = useState(50);
  const [isPremium, setIsPremium] = useState(false);
  const [createdImages, setCreatedImages] = useState(0);
  const [hasApiKey, setHasApiKey] = useState(false);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer l'utilisateur actuel
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (!user) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      setUser(user);
      
      // Récupérer les quotas de l'utilisateur
      const { data: quotaData, error: quotaError } = await supabase
        .from('user_quotas')
        .select('monthly_generations_used, monthly_generations_limit')
        .eq('user_id', user.id)
        .single();
      
      if (quotaError && quotaError.code !== 'PGRST116') {
        // PGRST116 est l'erreur "No rows returned" - c'est normal si l'utilisateur n'a pas encore de quota
        console.error('Erreur lors de la récupération des quotas:', quotaError);
      }
      
      if (quotaData) {
        setMessagesCount(quotaData.monthly_generations_used || 0);
        setMessagesLimit(quotaData.monthly_generations_limit || 50);
      }
      
      // Vérifier si l'utilisateur a un abonnement premium
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        console.error('Erreur lors de la récupération de l\'abonnement:', subscriptionError);
      }
      
      setIsPremium(!!subscriptionData);
      
      // Compter les images créées par l'utilisateur
      const { count: imagesCount, error: imagesError } = await supabase
        .from('generated_images')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (imagesError) {
        console.error('Erreur lors du comptage des images:', imagesError);
      }
      
      setCreatedImages(imagesCount || 0);
      
      // Vérifier si l'utilisateur a configuré une clé API
      const { count: apiKeyCount, error: apiKeyError } = await supabase
        .from('api_configurations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (apiKeyError) {
        console.error('Erreur lors de la vérification des clés API:', apiKeyError);
      }
      
      setHasApiKey(apiKeyCount ? apiKeyCount > 0 : false);
      
    } catch (err) {
      console.error('Erreur lors de la récupération des données utilisateur:', err);
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    
    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserData();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    isLoading,
    error,
    messagesCount,
    messagesLimit,
    isPremium,
    createdImages,
    hasApiKey,
    refreshUserData: fetchUserData
  };
}
