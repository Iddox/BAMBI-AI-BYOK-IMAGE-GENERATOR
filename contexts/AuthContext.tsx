'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { logLoadingEvent, monitorStateChanges } from '@/utils/debug';

// Type pour les données utilisateur
export type UserData = {
  messagesCount: number;
  messagesLimit: number;
  isPremium: boolean;
  createdImages: number;
  hasApiKey: boolean;
};

// Interface pour le contexte
interface AuthContextType {
  user: User | null;
  session: Session | null;
  userData: UserData | null;
  isLoading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

// Création du contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider du contexte
export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fonction pour récupérer les données utilisateur
  const fetchUserData = async (userId: string) => {
    console.log('AuthContext - Fetching user data for user:', userId);
    logLoadingEvent('AuthContext', 'Fetching user data', { userId });

    // Valeurs par défaut pour les données utilisateur
    let userData = {
      messagesCount: 0,
      messagesLimit: 50,
      isPremium: false,
      createdImages: 0,
      hasApiKey: false
    };

    try {
      // Créer une promesse qui se résout avec les données utilisateur
      const fetchDataPromise = async () => {
        try {
          // Utiliser Promise.allSettled pour exécuter toutes les requêtes en parallèle
          // et continuer même si certaines échouent
          const [quotaResult, subscriptionResult, imagesResult, apiKeyResult] = await Promise.allSettled([
            // Récupérer les quotas
            supabase
              .from('user_quotas')
              .select('monthly_generations_used, monthly_generations_limit')
              .eq('user_id', userId)
              .single(),

            // Récupérer l'abonnement
            supabase
              .from('user_subscriptions')
              .select('status')
              .eq('user_id', userId)
              .eq('status', 'active')
              .single(),

            // Compter les images
            supabase
              .from('generated_images')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', userId),

            // Vérifier les clés API
            supabase
              .from('api_configurations')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', userId)
          ]);

          // Traiter les résultats des quotas
          if (quotaResult.status === 'fulfilled') {
            const { data: quotaData, error: quotaError } = quotaResult.value;
            if (quotaData) {
              userData.messagesCount = quotaData.monthly_generations_used || 0;
              userData.messagesLimit = quotaData.monthly_generations_limit || 50;
              console.log('AuthContext - User quota data:', quotaData);
            } else if (quotaError && quotaError.code !== 'PGRST116') {
              console.error('Erreur lors de la récupération des quotas:', quotaError);
            }
          } else {
            console.error('Échec de la récupération des quotas:', quotaResult.reason);
          }

          // Traiter les résultats de l'abonnement
          if (subscriptionResult.status === 'fulfilled') {
            const { data: subscriptionData } = subscriptionResult.value;
            if (subscriptionData) {
              userData.isPremium = true;
              console.log('AuthContext - User has active subscription');
            }
          } else {
            console.error('Échec de la récupération de l\'abonnement:', subscriptionResult.reason);
          }

          // Traiter les résultats du comptage des images
          if (imagesResult.status === 'fulfilled') {
            const { count: imagesCount } = imagesResult.value;
            if (imagesCount !== null) {
              userData.createdImages = imagesCount;
              console.log('AuthContext - User has', imagesCount, 'created images');
            }
          } else {
            console.error('Échec du comptage des images:', imagesResult.reason);
          }

          // Traiter les résultats de la vérification des clés API
          if (apiKeyResult.status === 'fulfilled') {
            const { count: apiKeyCount } = apiKeyResult.value;
            if (apiKeyCount !== null) {
              userData.hasApiKey = apiKeyCount > 0;
              console.log('AuthContext - User has', apiKeyCount, 'API keys');
            }
          } else {
            console.error('Échec de la vérification des clés API:', apiKeyResult.reason);
          }

          return userData;
        } catch (error) {
          console.error('Erreur lors de la récupération des données:', error);
          return userData; // Retourner les données par défaut en cas d'erreur
        }
      };

      // Créer une promesse de timeout
      const timeoutPromise = new Promise<typeof userData>(resolve => {
        setTimeout(() => {
          console.warn('AuthContext - Timeout lors de la récupération des données utilisateur');
          logLoadingEvent('AuthContext', 'Timeout lors de la récupération des données utilisateur');
          resolve(userData); // Résoudre avec les données par défaut
        }, 15000); // Timeout de 15 secondes (augmenté de 8 à 15 secondes)
      });

      // Utiliser Promise.race pour prendre le résultat le plus rapide
      const result = await Promise.race([fetchDataPromise(), timeoutPromise]);

      console.log('AuthContext - Final user data:', result);
      setUserData(result);
    } catch (err) {
      console.error('Erreur globale lors de la récupération des données utilisateur:', err);
      // En cas d'erreur, définir des valeurs par défaut
      setUserData(userData);
    }
  };

  // Fonction pour rafraîchir les données utilisateur
  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  // Fonction de connexion
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      setUser(data.user);
      setSession(data.session);

      if (data.user) {
        await fetchUserData(data.user.id);
      }

      router.push('/generate');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de connexion'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction d'inscription
  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`
        }
      });

      if (error) throw error;

      // Si l'email n'a pas besoin d'être confirmé
      if (data.user && data.user.email_confirmed_at) {
        setUser(data.user);
        setSession(data.session);

        if (data.user) {
          await fetchUserData(data.user.id);
        }

        router.push('/generate');
        router.refresh();
      } else {
        // Rediriger vers la page de confirmation d'email
        router.push(`/email-confirmation?email=${encodeURIComponent(email)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur d\'inscription'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de déconnexion
  const signOut = async () => {
    try {
      console.log('AuthContext - Signing out...');
      setIsLoading(true);

      // Effacer d'abord les états locaux pour éviter des problèmes de synchronisation
      setUser(null);
      setSession(null);
      setUserData(null);

      // Supprimer la clé hasBeenAuthenticated du localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hasBeenAuthenticated');
      }

      // Puis déconnecter l'utilisateur de Supabase
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      console.log('AuthContext - Sign out successful, redirecting to home page');

      // Rediriger vers la page d'accueil avec un délai pour éviter les problèmes de navigation
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 100);
    } catch (err) {
      console.error('AuthContext - Error during sign out:', err);
      setError(err instanceof Error ? err : new Error('Erreur de déconnexion'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Vérifier la session au chargement
  useEffect(() => {
    let sessionTimeoutId: NodeJS.Timeout;

    const checkSession = async () => {
      logLoadingEvent('AuthContext', 'Checking session');
      setIsLoading(true);

      // Surveiller les changements d'état
      monitorStateChanges('AuthContext', { isLoading: true });

      // Créer une promesse qui se résout avec la session
      const sessionPromise = async () => {
        try {
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            console.error('Erreur lors de la vérification de la session:', error);
            return { session: null, error };
          }

          return { session: data.session, error: null };
        } catch (err) {
          console.error('Exception lors de la vérification de la session:', err);
          return { session: null, error: err };
        }
      };

      // Créer une promesse de timeout
      const timeoutPromise = new Promise(resolve => {
        setTimeout(() => {
          logLoadingEvent('AuthContext', 'Timeout lors de la vérification de la session');
          resolve({ session: null, error: new Error('Timeout lors de la vérification de la session') });
        }, 20000); // Timeout de 20 secondes (augmenté de 10 à 20 secondes)
      });

      try {
        // Utiliser Promise.race pour prendre le résultat le plus rapide
        const result = await Promise.race([sessionPromise(), timeoutPromise]) as any;
        const { session, error } = result;

        if (error) {
          console.warn('AuthContext - Erreur ou timeout lors de la vérification de la session:', error);
          setError(error instanceof Error ? error : new Error('Erreur de session'));
          setUser(null);
          setSession(null);
          setUserData(null);
        } else {
          console.log('AuthContext - Session check result:', { hasSession: !!session });
          setSession(session);

          if (session?.user) {
            setUser(session.user);
            // Utiliser fetchUserData qui a déjà sa propre gestion de timeout
            await fetchUserData(session.user.id);
          } else {
            console.log('AuthContext - No user in session');
            setUser(null);
            setUserData(null);
          }
        }
      } catch (err) {
        console.error('Erreur globale lors de la vérification de la session:', err);
        setError(err instanceof Error ? err : new Error('Erreur de session'));

        // En cas d'erreur, définir l'utilisateur comme non authentifié
        setUser(null);
        setSession(null);
        setUserData(null);
      } finally {
        console.log('AuthContext - Session check completed, setting isLoading to false');
        setIsLoading(false);

        // Surveiller les changements d'état après la fin
        monitorStateChanges('AuthContext', { isLoading: false });
      }
    };

    checkSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logLoadingEvent('AuthContext', 'Auth state changed', { event, hasSession: !!session });

        // Éviter de mettre isLoading à true pour certains événements qui ne nécessitent pas de chargement
        const minorEvents = ['PASSWORD_RECOVERY', 'TOKEN_REFRESHED', 'USER_UPDATED'];
        if (!minorEvents.includes(event)) {
          setIsLoading(true);
          // Surveiller les changements d'état
          monitorStateChanges('AuthContext', { isLoading: true, event });
        }

        // Créer une promesse qui traite le changement d'état
        const processPromise = async () => {
          try {
            // Mettre à jour l'état de session immédiatement
            setSession(session);
            setUser(session?.user || null);

            if (session?.user) {
              // Utiliser fetchUserData qui a déjà sa propre gestion de timeout
              await fetchUserData(session.user.id);
            } else {
              console.log('AuthContext - User signed out or no user in session');
              setUserData(null);
            }

            return { success: true };
          } catch (error) {
            console.error('Erreur lors du traitement du changement d\'état:', error);

            // En cas d'erreur, définir l'utilisateur selon l'état de la session
            setUser(session?.user || null);
            setSession(session);
            if (!session?.user) {
              setUserData(null);
            }

            return { success: false, error };
          }
        };

        // Créer une promesse de timeout
        const timeoutPromise = new Promise(resolve => {
          setTimeout(() => {
            logLoadingEvent('AuthContext', 'Timeout lors du traitement du changement d\'état');
            resolve({ success: false, error: new Error('Timeout lors du traitement du changement d\'état') });
          }, 20000); // Timeout de 20 secondes (augmenté de 10 à 20 secondes)
        });

        try {
          // Utiliser Promise.race pour prendre le résultat le plus rapide
          await Promise.race([processPromise(), timeoutPromise]);
        } catch (err) {
          console.error('Erreur globale lors du changement d\'état d\'authentification:', err);
          setError(err instanceof Error ? err : new Error('Erreur de session'));
        } finally {
          // Ne pas mettre isLoading à false pour les événements mineurs
          if (!minorEvents.includes(event)) {
            console.log('AuthContext - Auth state change handled, setting isLoading to false');
            setIsLoading(false);
            // Surveiller les changements d'état après la fin
            monitorStateChanges('AuthContext', { isLoading: false, event });
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (sessionTimeoutId) clearTimeout(sessionTimeoutId);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userData,
        isLoading,
        error,
        signIn,
        signUp,
        signOut,
        refreshUserData
      }}
    >
      <div suppressHydrationWarning>
        {children}
      </div>
    </AuthContext.Provider>
  );
}

// Hook personnalisé pour utiliser le contexte
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
}
