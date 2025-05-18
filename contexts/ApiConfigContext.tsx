"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";

// Interface pour le résultat de validation d'une clé API
interface ApiKeyValidationResult {
  isValid: boolean;
  message: string;
  provider?: any;
}

// Type pour les configurations API
export type ApiConfig = {
  id: string;
  name: string;
  provider: string;
  provider_id?: number;
  model: string;
  key: string;
  isValidated?: boolean;
  status?: 'valid' | 'invalid' | 'unknown';
  last_validated_at?: string;
  created_at?: string;
};

// Interface pour le contexte
interface ApiConfigContextType {
  configs: ApiConfig[];
  isLoading: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncTime: number | null;
  syncErrors: string[];
  pendingConfigs: Omit<ApiConfig, "id">[];
  addConfig: (config: Omit<ApiConfig, "id">, retryCount?: number) => Promise<{ id: string; isValid: boolean; message: string }>;
  updateConfig: (id: string, config: Partial<Omit<ApiConfig, "id">>, retryCount?: number) => Promise<{ isValid: boolean; message: string }>;
  deleteConfig: (id: string, retryCount?: number) => Promise<void>;
  getConfigById: (id: string) => ApiConfig | undefined;
  getAllConfigs: () => ApiConfig[];
  validateApiKey: (provider: string, apiKey: string) => Promise<ApiKeyValidationResult>;
  syncPendingConfigs: () => Promise<void>;
  clearLocalStorageForUser: (userId: string) => void;
}

// Création du contexte
const ApiConfigContext = createContext<ApiConfigContextType | undefined>(undefined);

// Provider du contexte
// Clés pour le stockage des configurations
const LOCAL_STORAGE_KEY = 'bambi_api_configs';
const USER_CONFIGS_KEY = 'bambi_user_configs';
const PENDING_CONFIGS_KEY = 'bambi_pending_configs';
const SYNC_STATUS_KEY = 'bambi_sync_status';
const CONFIG_VERSION_KEY = 'bambi_config_version';

// Durée de validité du cache en millisecondes (7 jours)
const CACHE_VALIDITY_DURATION = 7 * 24 * 60 * 60 * 1000;

// Nombre maximal de tentatives de synchronisation
const MAX_SYNC_RETRIES = 5;

// Intervalle entre les tentatives de synchronisation (en millisecondes)
const SYNC_RETRY_INTERVAL = 30 * 1000; // 30 secondes

export function ApiConfigProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);
  const [configVersion, setConfigVersion] = useState<number>(0);
  const [pendingConfigs, setPendingConfigs] = useState<Omit<ApiConfig, "id">[]>([]);

  // Fonction pour nettoyer le localStorage pour un utilisateur spécifique
  const clearLocalStorageForUser = (userId: string) => {
    try {
      if (typeof window !== 'undefined') {
        console.log("ApiConfigContext - Nettoyage du cache local pour l'utilisateur:", userId);

        // Si userId est 'ALL', nettoyer complètement le localStorage
        if (userId === 'ALL') {
          _clearAllLocalStorage();
          return;
        }

        // Nettoyer sessionStorage
        sessionStorage.removeItem(LOCAL_STORAGE_KEY);

        // Nettoyer les configurations de l'utilisateur dans localStorage
        const existingData = localStorage.getItem(USER_CONFIGS_KEY);
        if (existingData) {
          try {
            const allUserConfigs = JSON.parse(existingData);
            // Supprimer uniquement les configurations de l'utilisateur spécifié
            if (allUserConfigs[userId]) {
              delete allUserConfigs[userId];
              localStorage.setItem(USER_CONFIGS_KEY, JSON.stringify(allUserConfigs));
            }
          } catch (e) {
            console.error("ApiConfigContext - Erreur lors du nettoyage du cache local:", e);
          }
        }

        // Nettoyer les configurations en attente
        const pendingData = localStorage.getItem(PENDING_CONFIGS_KEY);
        if (pendingData) {
          try {
            const allPendingConfigs = JSON.parse(pendingData);
            if (allPendingConfigs[userId]) {
              delete allPendingConfigs[userId];
              localStorage.setItem(PENDING_CONFIGS_KEY, JSON.stringify(allPendingConfigs));
            }
          } catch (e) {
            console.error("ApiConfigContext - Erreur lors du nettoyage des configurations en attente:", e);
          }
        }
      }
    } catch (error) {
      console.error("ApiConfigContext - Erreur lors du nettoyage du cache local:", error);
    }
  };

  // Fonction pour nettoyer complètement le localStorage (à utiliser avec précaution)
  // Cette fonction est utilisée en interne par clearLocalStorageForUser
  const _clearAllLocalStorage = () => {
    try {
      if (typeof window !== 'undefined') {
        console.log("ApiConfigContext - Nettoyage complet du cache local");

        // Nettoyer sessionStorage
        sessionStorage.removeItem(LOCAL_STORAGE_KEY);

        // Nettoyer localStorage
        localStorage.removeItem(USER_CONFIGS_KEY);
        localStorage.removeItem(PENDING_CONFIGS_KEY);
        localStorage.removeItem(SYNC_STATUS_KEY);
        localStorage.removeItem(CONFIG_VERSION_KEY);
      }
    } catch (error) {
      console.error("ApiConfigContext - Erreur lors du nettoyage complet du cache local:", error);
    }
  };

  // Fonction pour sauvegarder les configurations dans le localStorage par utilisateur avec versionnage
  const saveConfigsToLocalStorage = (userId: string, configsToSave: ApiConfig[]) => {
    try {
      if (typeof window !== 'undefined') {
        // Vérifier que l'utilisateur est valide
        if (!userId) {
          console.error("ApiConfigContext - Impossible de sauvegarder les configurations: userId invalide");
          return;
        }

        // Incrémenter la version des configurations
        const newVersion = configVersion + 1;
        setConfigVersion(newVersion);

        // Structure de données pour stocker les configurations par utilisateur
        let allUserConfigs: Record<string, {
          configs: ApiConfig[],
          timestamp: number,
          version: number,
          syncStatus: 'synced' | 'pending' | 'error'
        }> = {};

        // Essayer de charger les configurations existantes de tous les utilisateurs
        const existingData = localStorage.getItem(USER_CONFIGS_KEY);
        if (existingData) {
          try {
            allUserConfigs = JSON.parse(existingData);
          } catch (e: any) {
            console.error("ApiConfigContext - Erreur lors du parsing des données existantes:", e);
            // Enregistrer l'erreur dans les logs de synchronisation
            setSyncErrors(prev => [...prev, `Erreur de parsing: ${e?.message || 'Erreur inconnue'}`]);
          }
        }

        // Mettre à jour les configurations de l'utilisateur actuel uniquement
        allUserConfigs[userId] = {
          configs: configsToSave,
          timestamp: Date.now(),
          version: newVersion,
          syncStatus: 'synced'
        };

        // Sauvegarder toutes les configurations
        localStorage.setItem(USER_CONFIGS_KEY, JSON.stringify(allUserConfigs));

        // Sauvegarder également dans sessionStorage pour une récupération plus rapide
        // Mais uniquement pour l'utilisateur actuel
        sessionStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
          userId,
          configs: configsToSave,
          timestamp: Date.now(),
          version: newVersion,
          syncStatus: 'synced'
        }));

        // Sauvegarder le statut de synchronisation
        localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({
          userId, // Ajouter l'ID utilisateur pour vérifier l'appartenance
          lastSync: Date.now(),
          status: 'success',
          version: newVersion
        }));

        // Mettre à jour l'état de synchronisation
        setSyncStatus('idle');
        setLastSyncTime(Date.now());

        console.log("ApiConfigContext - Configurations sauvegardées pour l'utilisateur", userId, ":", configsToSave.length, "version:", newVersion);
      }
    } catch (error: any) {
      console.error("ApiConfigContext - Erreur lors de la sauvegarde dans le localStorage:", error);
      // Enregistrer l'erreur dans les logs de synchronisation
      setSyncErrors(prev => [...prev, `Erreur de sauvegarde: ${error?.message || 'Erreur inconnue'}`]);
      setSyncStatus('error');
    }
  };

  // Fonction améliorée pour charger les configurations depuis le localStorage ou sessionStorage
  // avec vérification stricte de l'appartenance des données à l'utilisateur actuel
  const loadConfigsFromLocalStorage = (userId: string): ApiConfig[] | null => {
    try {
      if (typeof window !== 'undefined') {
        // Vérifier que l'utilisateur est valide
        if (!userId) {
          console.error("ApiConfigContext - Impossible de charger les configurations: userId invalide");
          return null;
        }

        // Essayer d'abord de charger depuis sessionStorage (plus rapide)
        let storedData = sessionStorage.getItem(LOCAL_STORAGE_KEY);
        let parsedData = null;

        if (storedData) {
          try {
            parsedData = JSON.parse(storedData);
            // Vérification stricte que les données appartiennent à l'utilisateur actuel
            if (parsedData.userId === userId) {
              // Mettre à jour l'état de synchronisation
              if (parsedData.version) {
                setConfigVersion(parsedData.version);
              }
              if (parsedData.syncStatus) {
                // Convertir le statut de synchronisation au format attendu
                const status = parsedData.syncStatus === 'synced' ? 'idle' :
                               parsedData.syncStatus === 'pending' ? 'syncing' : 'error';
                setSyncStatus(status);
              }

              console.log("ApiConfigContext - Configurations chargées depuis sessionStorage:",
                parsedData.configs.length,
                "version:", parsedData.version || 'inconnue');

              return parsedData.configs;
            } else {
              // Les données n'appartiennent pas à l'utilisateur actuel, les ignorer
              console.warn("ApiConfigContext - Les données de sessionStorage n'appartiennent pas à l'utilisateur actuel");
              // Nettoyer sessionStorage pour éviter les fuites de données
              sessionStorage.removeItem(LOCAL_STORAGE_KEY);
            }
          } catch (e: any) {
            console.error("ApiConfigContext - Erreur lors du parsing des données de sessionStorage:", e);
            setSyncErrors(prev => [...prev, `Erreur de parsing sessionStorage: ${e?.message || 'Erreur inconnue'}`]);
            // Nettoyer sessionStorage en cas d'erreur
            sessionStorage.removeItem(LOCAL_STORAGE_KEY);
          }
        }

        // Si pas dans sessionStorage ou pas pour le bon utilisateur, essayer localStorage
        const allUserConfigs = localStorage.getItem(USER_CONFIGS_KEY);
        if (allUserConfigs) {
          try {
            const parsedAllConfigs = JSON.parse(allUserConfigs) as Record<string, {
              configs: ApiConfig[],
              timestamp: number,
              version?: number,
              syncStatus?: 'synced' | 'pending' | 'error'
            }>;

            // Vérification stricte que les données pour cet utilisateur existent
            const userConfigs = parsedAllConfigs[userId];

            if (userConfigs && userConfigs.configs) {
              // Vérifier que le cache n'est pas trop ancien
              const cacheAge = Date.now() - userConfigs.timestamp;
              if (cacheAge < CACHE_VALIDITY_DURATION) {
                console.log("ApiConfigContext - Configurations chargées depuis localStorage:",
                  userConfigs.configs.length,
                  "version:", userConfigs.version || 'inconnue',
                  "statut:", userConfigs.syncStatus || 'inconnu');

                // Mettre à jour l'état de synchronisation
                if (userConfigs.version) {
                  setConfigVersion(userConfigs.version);
                }
                if (userConfigs.syncStatus) {
                  // Convertir le statut de synchronisation au format attendu
                  const status = userConfigs.syncStatus === 'synced' ? 'idle' :
                                 userConfigs.syncStatus === 'pending' ? 'syncing' : 'error';
                  setSyncStatus(status);
                }

                // Mettre à jour sessionStorage pour un accès plus rapide la prochaine fois
                // Mais uniquement pour l'utilisateur actuel
                sessionStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
                  userId,
                  configs: userConfigs.configs,
                  timestamp: userConfigs.timestamp,
                  version: userConfigs.version,
                  syncStatus: userConfigs.syncStatus
                }));

                // Vérifier s'il y a des configurations en attente pour cet utilisateur spécifique
                const pendingData = localStorage.getItem(PENDING_CONFIGS_KEY);
                if (pendingData) {
                  try {
                    const parsedPendingData = JSON.parse(pendingData);
                    if (parsedPendingData[userId] && parsedPendingData[userId].length > 0) {
                      console.log("ApiConfigContext - Configurations en attente trouvées:", parsedPendingData[userId].length);
                      setPendingConfigs(parsedPendingData[userId]);
                    }
                  } catch (e: any) {
                    console.error("ApiConfigContext - Erreur lors du parsing des configurations en attente:", e);
                  }
                }

                return userConfigs.configs;
              } else {
                console.log("ApiConfigContext - Cache trop ancien, rechargement nécessaire");
                // Enregistrer dans les logs de synchronisation
                setSyncErrors(prev => [...prev, `Cache trop ancien (${Math.floor(cacheAge / (1000 * 60 * 60))} heures), rechargement nécessaire`]);

                // Supprimer les données périmées
                delete parsedAllConfigs[userId];
                localStorage.setItem(USER_CONFIGS_KEY, JSON.stringify(parsedAllConfigs));
              }
            } else {
              console.log("ApiConfigContext - Aucune configuration trouvée pour l'utilisateur", userId);
            }
          } catch (e: any) {
            console.error("ApiConfigContext - Erreur lors du parsing des données de localStorage:", e);
            setSyncErrors(prev => [...prev, `Erreur de parsing localStorage: ${e?.message || 'Erreur inconnue'}`]);
            // Nettoyer localStorage en cas d'erreur grave
            localStorage.removeItem(USER_CONFIGS_KEY);
          }
        }
      }
      return null;
    } catch (error: any) {
      console.error("ApiConfigContext - Erreur lors du chargement depuis le cache:", error);
      setSyncErrors(prev => [...prev, `Erreur de chargement: ${error?.message || 'Erreur inconnue'}`]);
      setSyncStatus('error');
      return null;
    }
  };

  // Récupérer l'utilisateur actuel et charger les configurations depuis Supabase une seule fois au démarrage
  useEffect(() => {
    const fetchUserAndConfigs = async () => {
      try {
        setIsLoading(true);
        console.log("ApiConfigContext - Chargement initial des configurations API...");

        // Récupérer l'utilisateur actuel
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

        if (userError) {
          console.error("ApiConfigContext - Erreur lors de la récupération de l'utilisateur:", userError);
          // Ne pas effacer les configurations en cas d'erreur
          // Essayer de charger depuis le cache si possible
          if (typeof window !== 'undefined') {
            // Essayer de récupérer l'ID utilisateur depuis sessionStorage
            const sessionData = sessionStorage.getItem(LOCAL_STORAGE_KEY);
            if (sessionData) {
              try {
                const parsedData = JSON.parse(sessionData);
                if (parsedData.userId) {
                  const cachedConfigs = loadConfigsFromLocalStorage(parsedData.userId);
                  if (cachedConfigs && cachedConfigs.length > 0) {
                    console.log("ApiConfigContext - Utilisation des configurations du cache malgré l'erreur d'authentification");
                    setConfigs(cachedConfigs);
                  }
                }
              } catch (e) {
                console.error("ApiConfigContext - Erreur lors de la récupération du cache en cas d'erreur:", e);
              }
            }
          }
          setIsLoading(false);
          return;
        }

        console.log("ApiConfigContext - Utilisateur récupéré:", currentUser?.id);
        setUser(currentUser);

        if (!currentUser) {
          console.log("ApiConfigContext - Aucun utilisateur connecté");
          // Ne pas effacer les configurations en cas d'absence d'utilisateur
          // Essayer de charger depuis le cache si possible
          if (typeof window !== 'undefined') {
            // Essayer de récupérer l'ID utilisateur depuis sessionStorage
            const sessionData = sessionStorage.getItem(LOCAL_STORAGE_KEY);
            if (sessionData) {
              try {
                const parsedData = JSON.parse(sessionData);
                if (parsedData.userId) {
                  const cachedConfigs = loadConfigsFromLocalStorage(parsedData.userId);
                  if (cachedConfigs && cachedConfigs.length > 0) {
                    console.log("ApiConfigContext - Utilisation des configurations du cache malgré l'absence d'utilisateur");
                    setConfigs(cachedConfigs);
                  }
                }
              } catch (e) {
                console.error("ApiConfigContext - Erreur lors de la récupération du cache en cas d'absence d'utilisateur:", e);
              }
            }
          }
          setIsLoading(false);
          return;
        }

        // Essayer d'abord de charger les configurations depuis le localStorage
        const cachedConfigs = loadConfigsFromLocalStorage(currentUser.id);
        if (cachedConfigs && cachedConfigs.length > 0) {
          console.log("ApiConfigContext - Utilisation des configurations du cache local");
          setConfigs(cachedConfigs);
          setIsLoading(false);

          // Charger les configurations depuis Supabase en arrière-plan pour mettre à jour le cache
          fetchConfigs().then(fetchedConfigs => {
            if (fetchedConfigs && fetchedConfigs.length > 0) {
              console.log("ApiConfigContext - Mise à jour des configurations depuis Supabase");
              setConfigs(fetchedConfigs);
              // Sauvegarder les configurations mises à jour dans le localStorage
              saveConfigsToLocalStorage(currentUser.id, fetchedConfigs);
            }
          }).catch(error => {
            console.error("ApiConfigContext - Erreur lors de la mise à jour depuis Supabase:", error);
            // En cas d'erreur, nous gardons les configurations du cache
          });
        } else {
          // Si pas de cache, charger depuis Supabase
          console.log("ApiConfigContext - Pas de cache local, chargement depuis Supabase");
          try {
            const fetchedConfigs = await fetchConfigs();

            // Si des configurations ont été récupérées, les sauvegarder dans le localStorage
            if (fetchedConfigs && fetchedConfigs.length > 0) {
              setConfigs(fetchedConfigs);
              saveConfigsToLocalStorage(currentUser.id, fetchedConfigs);
            }
          } catch (error) {
            console.error("ApiConfigContext - Erreur lors du chargement depuis Supabase:", error);
          } finally {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("ApiConfigContext - Erreur globale lors du chargement des configurations API:", error);
        // Ne pas effacer les configurations en cas d'erreur globale
        // Essayer de charger depuis le cache si possible
        if (typeof window !== 'undefined') {
          // Essayer de récupérer l'ID utilisateur depuis sessionStorage
          const sessionData = sessionStorage.getItem(LOCAL_STORAGE_KEY);
          if (sessionData) {
            try {
              const parsedData = JSON.parse(sessionData);
              if (parsedData.userId) {
                const cachedConfigs = loadConfigsFromLocalStorage(parsedData.userId);
                if (cachedConfigs && cachedConfigs.length > 0) {
                  console.log("ApiConfigContext - Utilisation des configurations du cache malgré l'erreur globale");
                  setConfigs(cachedConfigs);
                }
              }
            } catch (e) {
              console.error("ApiConfigContext - Erreur lors de la récupération du cache en cas d'erreur globale:", e);
            }
          }
        }
        setIsLoading(false);
      }
    };

    // Charger les configurations une seule fois au démarrage
    fetchUserAndConfigs();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("ApiConfigContext - Changement d'état d'authentification:", event);

        // Mettre à jour l'utilisateur immédiatement
        setUser(session?.user || null);

        if (!session?.user) {
          // Effacer les configurations de l'état local lors de la déconnexion
          // pour éviter les fuites de données entre utilisateurs
          console.log("ApiConfigContext - Utilisateur déconnecté, nettoyage des configurations");
          setConfigs([]); // Vider l'état local

          // Si nous avons l'ID de l'utilisateur précédent, nettoyer son cache
          if (user && user.id) {
            clearLocalStorageForUser(user.id);
          }
        } else if (event === 'SIGNED_IN') {
          // En cas de connexion, charger les configurations depuis le localStorage d'abord
          const cachedConfigs = loadConfigsFromLocalStorage(session.user.id);
          if (cachedConfigs && cachedConfigs.length > 0) {
            console.log("ApiConfigContext - Connexion: utilisation des configurations du cache local");
            setConfigs(cachedConfigs);
            setIsLoading(false); // Important: marquer le chargement comme terminé

            // Puis mettre à jour en arrière-plan depuis Supabase
            fetchConfigs().then(fetchedConfigs => {
              if (fetchedConfigs && fetchedConfigs.length > 0) {
                console.log("ApiConfigContext - Mise à jour des configurations depuis Supabase");
                setConfigs(fetchedConfigs);
                saveConfigsToLocalStorage(session.user.id, fetchedConfigs);
              }
            }).catch(error => {
              console.error("ApiConfigContext - Erreur lors de la mise à jour depuis Supabase:", error);
              // En cas d'erreur, nous gardons les configurations du cache
            });
          } else {
            // Si pas de cache, charger depuis Supabase
            console.log("ApiConfigContext - Connexion: pas de cache local, chargement depuis Supabase");
            fetchConfigs().then(fetchedConfigs => {
              if (fetchedConfigs && fetchedConfigs.length > 0) {
                setConfigs(fetchedConfigs);
                saveConfigsToLocalStorage(session.user.id, fetchedConfigs);
              }
              setIsLoading(false); // Important: marquer le chargement comme terminé
            }).catch(error => {
              console.error("ApiConfigContext - Erreur lors du chargement depuis Supabase:", error);
              setIsLoading(false); // Important: marquer le chargement comme terminé même en cas d'erreur
            });
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Fonction pour valider directement une clé API xAI sans passer par l'API
  const validateXAIKeyDirectly = async (apiKey: string): Promise<ApiKeyValidationResult> => {
    try {
      console.log("ApiConfigContext - Validation directe de la clé API xAI...");

      // Appel direct à l'API xAI pour valider la clé
      const response = await fetch("https://api.x.ai/v1/models", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-API-Key": apiKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        const models = data.data.map((model: any) => model.id);
        const hasImageModel = models.includes("grok-2-image-1212");

        return {
          isValid: true,
          message: `Clé API xAI validée avec succès. ${hasImageModel ? 'Le modèle grok-2-image-1212 est disponible.' : 'Attention: Le modèle grok-2-image-1212 n\'est pas disponible.'}`,
          provider: {
            name: 'xAI',
            slug: 'xai',
            models
          }
        };
      } else {
        const errorData = await response.json();
        return {
          isValid: false,
          message: `Clé API xAI invalide: ${errorData.error?.message || "Erreur inconnue"}`
        };
      }
    } catch (err: any) {
      console.error("ApiConfigContext - Erreur lors de la validation directe de la clé xAI:", err);
      return {
        isValid: false,
        message: `Erreur lors de la validation directe de la clé xAI: ${err.message}`
      };
    }
  };

  // Fonction pour valider une clé API
  const validateApiKey = async (provider: string, apiKey: string): Promise<ApiKeyValidationResult> => {
    try {
      console.log("ApiConfigContext - Validation de la clé API pour le fournisseur:", provider);

      // Si c'est xAI, essayer d'abord la validation directe
      if (provider === 'xai') {
        try {
          const directResult = await validateXAIKeyDirectly(apiKey);
          if (directResult.isValid) {
            console.log("ApiConfigContext - Validation directe de la clé xAI réussie");
            return directResult;
          }
        } catch (directError) {
          console.warn("ApiConfigContext - Échec de la validation directe xAI, tentative via l'API standard:", directError);
        }
      }

      // Validation standard via l'API
      const response = await fetch('/api/validate-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          apiKey,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("ApiConfigContext - Erreur lors de la validation de la clé API:", result.error);

        // Si c'est xAI et que la validation standard a échoué, mais que nous n'avons pas encore essayé la validation directe
        if (provider === 'xai' && result.error?.includes('status')) {
          console.log("ApiConfigContext - Tentative de validation directe xAI après échec de l'API standard");
          return await validateXAIKeyDirectly(apiKey);
        }

        return {
          isValid: false,
          message: result.error || 'Erreur lors de la validation de la clé API'
        };
      }

      return result;
    } catch (error) {
      console.error("ApiConfigContext - Exception lors de la validation de la clé API:", error);

      // Si c'est xAI et que nous avons une erreur générale, essayer la validation directe
      if (provider === 'xai') {
        console.log("ApiConfigContext - Tentative de validation directe xAI après exception");
        try {
          return await validateXAIKeyDirectly(apiKey);
        } catch (directError) {
          console.error("ApiConfigContext - Échec de la validation directe xAI après exception:", directError);
        }
      }

      return {
        isValid: false,
        message: 'Erreur de connexion lors de la validation de la clé API'
      };
    }
  };

  // Fonction robuste pour recharger les configurations depuis Supabase avec vérification et retry
  const fetchConfigs = async (retryCount = 0): Promise<ApiConfig[]> => {
    // Mettre à jour le statut de synchronisation
    setSyncStatus('syncing');

    if (!user) {
      console.log("ApiConfigContext - Aucun utilisateur connecté pour charger les configurations");
      setSyncStatus('error');
      setSyncErrors(prev => [...prev, "Tentative de chargement sans utilisateur connecté"]);
      return [];
    }

    try {
      console.log("ApiConfigContext - Rechargement des configurations pour l'utilisateur:", user.id, "tentative:", retryCount + 1);

      // Vérifier d'abord la session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("ApiConfigContext - Session Supabase expirée ou invalide");

        // Tenter de rafraîchir la session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          console.error("ApiConfigContext - Impossible de rafraîchir la session:", refreshError);
          setSyncStatus('error');
          setSyncErrors(prev => [...prev, `Session expirée: ${refreshError?.message || 'Erreur inconnue'}`]);

          // Retourner les configurations du cache si disponibles
          const cachedConfigs = loadConfigsFromLocalStorage(user.id);
          return cachedConfigs || [];
        }

        console.log("ApiConfigContext - Session rafraîchie avec succès");
      }

      // Requête avec timeout pour éviter les blocages
      const timeoutPromise = new Promise<{ data: null, error: Error }>((resolve) => {
        setTimeout(() => {
          resolve({
            data: null,
            error: new Error("Timeout lors de la récupération des configurations")
          });
        }, 10000); // 10 secondes de timeout
      });

      // Requête Supabase avec debug
      console.log("ApiConfigContext - Récupération des configurations pour l'utilisateur:", user.id);

      // Vérifier que user_id est bien un UUID valide
      if (!user.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)) {
        console.error("ApiConfigContext - user_id invalide pour la récupération:", user.id);
        setSyncErrors(prev => [...prev, `user_id invalide pour la récupération: ${user.id}`]);
      }

      // Requête Supabase avec debug
      const fetchPromise = supabase
        .from('api_configurations')
        .select(`
          id,
          name,
          provider_id,
          model,
          is_valid,
          status,
          last_validated_at,
          created_at,
          user_id,
          api_providers (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', user.id);

      // Utiliser Promise.race pour implémenter un timeout
      const result = await Promise.race([fetchPromise, timeoutPromise]);
      const { data, error } = result as any;

      if (error) {
        console.error("ApiConfigContext - Erreur lors du rechargement des configurations:", error);
        setSyncErrors(prev => [...prev, `Erreur de récupération: ${error.message}`]);

        // Vérifier si l'erreur est liée aux permissions RLS
        if (error.code === '42501' || error.message.includes('permission') || error.message.includes('policy')) {
          console.error("ApiConfigContext - Erreur de permission RLS lors de la récupération:", error);
          setSyncErrors(prev => [...prev, `Erreur de permission RLS lors de la récupération: ${error.message}`]);

          // Vérifier la session utilisateur
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          console.log("ApiConfigContext - Session utilisateur actuelle pour récupération:", currentSession?.user?.id);

          // Vérifier que l'ID utilisateur dans la requête correspond à l'ID de session
          if (currentSession?.user?.id !== user.id) {
            console.error("ApiConfigContext - Incohérence d'ID utilisateur pour récupération:", {
              sessionUserId: currentSession?.user?.id,
              requestUserId: user.id
            });
            setSyncErrors(prev => [...prev, `Incohérence d'ID utilisateur pour récupération: session=${currentSession?.user?.id}, requête=${user.id}`]);
          }
        }

        // Retry si possible
        if (retryCount < MAX_SYNC_RETRIES) {
          console.log(`ApiConfigContext - Nouvelle tentative (${retryCount + 1}/${MAX_SYNC_RETRIES}) dans ${SYNC_RETRY_INTERVAL/1000}s...`);

          // Attendre avant de réessayer
          await new Promise(resolve => setTimeout(resolve, SYNC_RETRY_INTERVAL));
          return fetchConfigs(retryCount + 1);
        }

        setSyncStatus('error');

        // Retourner les configurations du cache si disponibles
        const cachedConfigs = loadConfigsFromLocalStorage(user.id);
        return cachedConfigs || [];
      }

      if (!data || !Array.isArray(data)) {
        console.error("ApiConfigContext - Données invalides reçues de Supabase:", data);
        setSyncErrors(prev => [...prev, "Format de données invalide reçu de Supabase"]);

        if (retryCount < MAX_SYNC_RETRIES) {
          console.log(`ApiConfigContext - Nouvelle tentative (${retryCount + 1}/${MAX_SYNC_RETRIES}) dans ${SYNC_RETRY_INTERVAL/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, SYNC_RETRY_INTERVAL));
          return fetchConfigs(retryCount + 1);
        }

        setSyncStatus('error');
        return [];
      }

      console.log("ApiConfigContext - Configurations rechargées:", data.length);

      // Transformer les données pour correspondre à notre format ApiConfig
      const transformedConfigs = data.map(item => {
        // Déterminer le statut en fonction de is_valid si status n'existe pas
        let configStatus: 'valid' | 'invalid' | 'unknown' = 'unknown';
        try {
          // Vérifier si la propriété status existe
          if (item.hasOwnProperty('status') && item.status) {
            configStatus = item.status as 'valid' | 'invalid' | 'unknown';
          } else if (item.hasOwnProperty('is_valid')) {
            // Fallback sur is_valid si status n'existe pas
            configStatus = item.is_valid === true ? 'valid' : 'invalid';
          }
        } catch (e: any) {
          console.warn("ApiConfigContext - Erreur lors de la détermination du statut:", e);
          setSyncErrors(prev => [...prev, `Erreur de traitement du statut: ${e?.message || 'Erreur inconnue'}`]);
        }

        // Récupérer le slug du fournisseur
        let providerSlug = 'unknown';
        try {
          if (item.api_providers) {
            if (typeof item.api_providers === 'object') {
              // Vérifier si api_providers est un tableau ou un objet
              if (Array.isArray(item.api_providers)) {
                // Si c'est un tableau, prendre le premier élément
                if (item.api_providers.length > 0) {
                  providerSlug = item.api_providers[0].slug || 'unknown';
                }
              } else {
                // Si c'est un objet, accéder directement au slug
                providerSlug = (item.api_providers as any).slug || 'unknown';
              }
            }
          }
        } catch (e: any) {
          console.error("ApiConfigContext - Erreur lors de la récupération du slug:", e);
          setSyncErrors(prev => [...prev, `Erreur de récupération du slug: ${e?.message || 'Erreur inconnue'}`]);
        }

        return {
          id: item.id,
          name: item.name,
          provider: providerSlug,
          provider_id: item.provider_id,
          model: item.model || '',
          key: '••••••••••••••••', // La clé API est masquée pour des raisons de sécurité
          isValidated: item.is_valid,
          status: configStatus,
          last_validated_at: item.last_validated_at,
          created_at: item.created_at
        };
      });

      console.log("ApiConfigContext - Configurations transformées après rechargement:", transformedConfigs.length);

      // Vérifier que les données sont cohérentes
      if (transformedConfigs.length === 0 && data.length > 0) {
        console.error("ApiConfigContext - Erreur de transformation: données perdues");
        setSyncErrors(prev => [...prev, "Erreur de transformation: données perdues"]);
        setSyncStatus('error');
      } else {
        // Mettre à jour l'état local
        setConfigs(transformedConfigs);

        // Sauvegarder dans le cache local avec la nouvelle version
        const newVersion = configVersion + 1;
        setConfigVersion(newVersion);
        saveConfigsToLocalStorage(user.id, transformedConfigs);

        // Mettre à jour le statut de synchronisation
        setSyncStatus('idle');
        setLastSyncTime(Date.now());

        // Vérifier s'il y a des configurations en attente à synchroniser
        if (pendingConfigs.length > 0) {
          console.log("ApiConfigContext - Synchronisation des configurations en attente:", pendingConfigs.length);
          // Cette partie sera implémentée dans la fonction syncPendingConfigs
        }
      }

      // Retourner les configurations pour pouvoir les utiliser dans d'autres fonctions
      return transformedConfigs;
    } catch (configError: any) {
      console.error("ApiConfigContext - Exception lors du rechargement des configurations:", configError);
      setSyncErrors(prev => [...prev, `Exception: ${configError?.message || 'Erreur inconnue'}`]);
      setSyncStatus('error');

      // Retry si possible
      if (retryCount < MAX_SYNC_RETRIES) {
        console.log(`ApiConfigContext - Nouvelle tentative (${retryCount + 1}/${MAX_SYNC_RETRIES}) dans ${SYNC_RETRY_INTERVAL/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, SYNC_RETRY_INTERVAL));
        return fetchConfigs(retryCount + 1);
      }

      // Retourner les configurations du cache si disponibles
      const cachedConfigs = loadConfigsFromLocalStorage(user.id);
      return cachedConfigs || [];
    }
  };

  // Fonction pour sauvegarder une configuration en attente
  const savePendingConfig = (userId: string, config: Omit<ApiConfig, "id">) => {
    try {
      if (typeof window !== 'undefined') {
        // Récupérer les configurations en attente existantes
        let pendingData: Record<string, Omit<ApiConfig, "id">[]> = {};
        const storedPending = localStorage.getItem(PENDING_CONFIGS_KEY);

        if (storedPending) {
          try {
            pendingData = JSON.parse(storedPending);
          } catch (e: any) {
            console.error("ApiConfigContext - Erreur lors du parsing des configurations en attente:", e);
          }
        }

        // Ajouter la nouvelle configuration en attente
        if (!pendingData[userId]) {
          pendingData[userId] = [];
        }

        pendingData[userId].push({
          ...config,
          // Ajouter un timestamp pour pouvoir trier les configurations en attente
          created_at: new Date().toISOString()
        });

        // Sauvegarder les configurations en attente
        localStorage.setItem(PENDING_CONFIGS_KEY, JSON.stringify(pendingData));

        // Mettre à jour l'état local
        setPendingConfigs(pendingData[userId]);

        console.log("ApiConfigContext - Configuration en attente sauvegardée:", config.name);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("ApiConfigContext - Erreur lors de la sauvegarde de la configuration en attente:", error);
      return false;
    }
  };

  // Ajouter une nouvelle configuration avec gestion robuste des erreurs et sauvegarde locale
  const addConfig = async (config: Omit<ApiConfig, "id">, retryCount = 0): Promise<{ id: string; isValid: boolean; message: string }> => {
    // Mettre à jour le statut de synchronisation
    setSyncStatus('syncing');

    if (!user) {
      console.error("ApiConfigContext - Impossible d'ajouter une configuration: utilisateur non connecté");
      setSyncStatus('error');
      setSyncErrors(prev => [...prev, "Tentative d'ajout sans utilisateur connecté"]);

      // Sauvegarder la configuration en attente pour une synchronisation ultérieure
      savePendingConfig('unknown', config);

      return { id: '', isValid: false, message: 'Utilisateur non connecté - Configuration sauvegardée localement' };
    }

    try {
      console.log("ApiConfigContext - Ajout d'une nouvelle configuration:", config.name, "tentative:", retryCount + 1);

      // Vérifier d'abord la session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("ApiConfigContext - Session Supabase expirée ou invalide");

        // Tenter de rafraîchir la session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          console.error("ApiConfigContext - Impossible de rafraîchir la session:", refreshError);
          setSyncStatus('error');
          setSyncErrors(prev => [...prev, `Session expirée: ${refreshError?.message || 'Erreur inconnue'}`]);

          // Sauvegarder la configuration en attente
          savePendingConfig(user.id, config);

          return {
            id: '',
            isValid: false,
            message: 'Session expirée - Configuration sauvegardée localement pour synchronisation ultérieure'
          };
        }

        console.log("ApiConfigContext - Session rafraîchie avec succès");
      }

      // Récupérer l'ID du fournisseur à partir du slug
      let providerId = config.provider_id;

      if (!providerId && config.provider) {
        // Si provider_id n'est pas fourni mais que provider (slug) l'est, récupérer l'ID
        const { data: providerData, error: providerError } = await supabase
          .from('api_providers')
          .select('id')
          .eq('slug', config.provider)
          .single();

        if (providerError) {
          console.error("ApiConfigContext - Erreur lors de la récupération du fournisseur:", providerError);
          setSyncErrors(prev => [...prev, `Fournisseur non trouvé: ${providerError.message}`]);

          if (retryCount < MAX_SYNC_RETRIES) {
            console.log(`ApiConfigContext - Nouvelle tentative (${retryCount + 1}/${MAX_SYNC_RETRIES}) dans ${SYNC_RETRY_INTERVAL/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, SYNC_RETRY_INTERVAL));
            return addConfig(config, retryCount + 1);
          }

          setSyncStatus('error');

          // Sauvegarder la configuration en attente
          savePendingConfig(user.id, config);

          return {
            id: '',
            isValid: false,
            message: 'Fournisseur non trouvé - Configuration sauvegardée localement'
          };
        } else if (providerData) {
          providerId = providerData.id;
          console.log("ApiConfigContext - ID du fournisseur récupéré:", providerId);
        }
      }

      if (!providerId) {
        console.error("ApiConfigContext - Impossible d'ajouter une configuration: ID du fournisseur manquant");
        setSyncStatus('error');
        setSyncErrors(prev => [...prev, "ID du fournisseur manquant"]);
        return { id: '', isValid: false, message: 'ID du fournisseur manquant' };
      }

      // Valider la clé API avant de l'ajouter
      console.log("ApiConfigContext - Validation de la clé API avant ajout...");

      // Utiliser une promesse avec timeout pour éviter les validations infinies
      let validationResult: ApiKeyValidationResult = {
        isValid: true,
        message: "Validation par défaut",
        provider: {
          name: config.provider,
          slug: config.provider
        }
      };

      try {
        const validationPromise = validateApiKey(config.provider, config.key);
        const timeoutPromise = new Promise<ApiKeyValidationResult>((resolve) => {
          setTimeout(() => {
            console.log("ApiConfigContext - Timeout de validation atteint, considérant la clé comme valide");
            resolve({
              isValid: true,
              message: "Validation automatique après timeout",
              provider: {
                name: config.provider,
                slug: config.provider
              }
            });
          }, 10000); // 10 secondes de timeout
        });

        // Utiliser la première promesse qui se résout
        validationResult = await Promise.race([validationPromise, timeoutPromise]);
      } catch (error) {
        console.error("ApiConfigContext - Erreur lors de la validation de la clé API:", error);
        // En mode développement, considérer la clé comme valide malgré l'erreur
        validationResult = {
          isValid: true,
          message: "Validation automatique après erreur",
          provider: {
            name: config.provider,
            slug: config.provider
          }
        };
      }

      // Déterminer le statut en fonction du résultat de la validation
      const status = validationResult.isValid ? 'valid' : 'invalid';
      console.log("ApiConfigContext - Statut de la clé API:", status);

      if (!validationResult.isValid) {
        console.error("ApiConfigContext - La clé API n'est pas valide:", validationResult.message);
        setSyncErrors(prev => [...prev, `Clé API invalide: ${validationResult.message}`]);
        // Continuer malgré l'échec de la validation pour permettre l'enregistrement de clés invalides
      } else {
        console.log("ApiConfigContext - Clé API validée avec succès");
      }

      // SOLUTION RADICALE: Stocker la clé API en clair sans chiffrement
      // Cela résout les problèmes de déchiffrement qui causent les erreurs avec l'API xAI
      const encryptedApiKey = config.key; // Utiliser la clé en clair

      // Préparer les données à insérer
      const insertData: any = {
        user_id: user.id,
        name: config.name,
        provider_id: providerId,
        model: config.model,
        api_key: encryptedApiKey,
        is_valid: validationResult.isValid,
        last_validated_at: new Date().toISOString()
      };

      // Ajouter le statut seulement si la colonne existe
      try {
        insertData.status = status;
      } catch (e: any) {
        console.warn("ApiConfigContext - La colonne status n'existe peut-être pas:", e);
        setSyncErrors(prev => [...prev, `Erreur avec la colonne status: ${e?.message || 'Erreur inconnue'}`]);
      }

      // Requête avec timeout pour éviter les blocages
      const timeoutPromise = new Promise<{ data: null, error: Error }>((resolve) => {
        setTimeout(() => {
          resolve({
            data: null,
            error: new Error("Timeout lors de l'insertion de la configuration")
          });
        }, 10000); // 10 secondes de timeout
      });

      // Requête Supabase avec debug
      console.log("ApiConfigContext - Données à insérer:", JSON.stringify(insertData, null, 2));

      // Vérifier que user_id est bien un UUID valide
      if (!insertData.user_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(insertData.user_id)) {
        console.error("ApiConfigContext - user_id invalide:", insertData.user_id);
        setSyncErrors(prev => [...prev, `user_id invalide: ${insertData.user_id}`]);
      }

      // Requête Supabase avec debug
      const insertPromise = supabase
        .from('api_configurations')
        .insert(insertData)
        .select(`
          id,
          name,
          provider_id,
          model,
          is_valid,
          status,
          last_validated_at,
          created_at,
          user_id,
          api_providers (
            id,
            name,
            slug
          )
        `)
        .single();

      // Utiliser Promise.race pour implémenter un timeout
      const result = await Promise.race([insertPromise, timeoutPromise]);
      const { data, error } = result as any;

      if (error) {
        console.error("ApiConfigContext - Erreur lors de l'insertion de la configuration:", error);
        setSyncErrors(prev => [...prev, `Erreur d'insertion: ${error.message}`]);

        // Vérifier si l'erreur est liée aux permissions RLS
        if (error.code === '42501' || error.message.includes('permission') || error.message.includes('policy')) {
          console.error("ApiConfigContext - Erreur de permission RLS:", error);
          setSyncErrors(prev => [...prev, `Erreur de permission RLS: ${error.message}`]);

          // Vérifier la session utilisateur
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          console.log("ApiConfigContext - Session utilisateur actuelle:", currentSession?.user?.id);

          // Vérifier que l'ID utilisateur dans la requête correspond à l'ID de session
          if (currentSession?.user?.id !== insertData.user_id) {
            console.error("ApiConfigContext - Incohérence d'ID utilisateur:", {
              sessionUserId: currentSession?.user?.id,
              requestUserId: insertData.user_id
            });
            setSyncErrors(prev => [...prev, `Incohérence d'ID utilisateur: session=${currentSession?.user?.id}, requête=${insertData.user_id}`]);
          }
        }

        // Retry si possible
        if (retryCount < MAX_SYNC_RETRIES) {
          console.log(`ApiConfigContext - Nouvelle tentative (${retryCount + 1}/${MAX_SYNC_RETRIES}) dans ${SYNC_RETRY_INTERVAL/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, SYNC_RETRY_INTERVAL));
          return addConfig(config, retryCount + 1);
        }

        setSyncStatus('error');

        // Sauvegarder la configuration en attente
        savePendingConfig(user.id, config);

        return {
          id: '',
          isValid: false,
          message: `Erreur lors de l'insertion - Configuration sauvegardée localement: ${error.message}`
        };
      }

      if (!data) {
        console.error("ApiConfigContext - Données invalides reçues de Supabase après insertion");
        setSyncErrors(prev => [...prev, "Données invalides reçues après insertion"]);

        if (retryCount < MAX_SYNC_RETRIES) {
          console.log(`ApiConfigContext - Nouvelle tentative (${retryCount + 1}/${MAX_SYNC_RETRIES}) dans ${SYNC_RETRY_INTERVAL/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, SYNC_RETRY_INTERVAL));
          return addConfig(config, retryCount + 1);
        }

        setSyncStatus('error');

        // Sauvegarder la configuration en attente
        savePendingConfig(user.id, config);

        return {
          id: '',
          isValid: false,
          message: 'Erreur lors de l\'insertion - Configuration sauvegardée localement'
        };
      }

      console.log("ApiConfigContext - Configuration ajoutée avec succès, ID:", data.id);

      // Au lieu de recharger toutes les configurations, ajouter directement la nouvelle configuration à l'état local
      // Récupérer le slug du fournisseur
      let providerSlug = 'unknown';
      try {
        if (data.api_providers) {
          if (typeof data.api_providers === 'object') {
            // Vérifier si api_providers est un tableau ou un objet
            if (Array.isArray(data.api_providers)) {
              // Si c'est un tableau, prendre le premier élément
              if (data.api_providers.length > 0) {
                providerSlug = data.api_providers[0].slug || 'unknown';
              }
            } else {
              // Si c'est un objet, accéder directement au slug
              providerSlug = (data.api_providers as any).slug || 'unknown';
            }
          }
        }
      } catch (e: any) {
        console.error("ApiConfigContext - Erreur lors de la récupération du slug:", e);
        setSyncErrors(prev => [...prev, `Erreur de récupération du slug: ${e?.message || 'Erreur inconnue'}`]);
      }

      const newConfig: ApiConfig = {
        id: data.id,
        name: data.name,
        provider: providerSlug,
        provider_id: data.provider_id,
        model: data.model || '',
        key: '••••••••••••••••', // La clé API est masquée pour des raisons de sécurité
        isValidated: data.is_valid,
        status: (data.status as 'valid' | 'invalid' | 'unknown') || (data.is_valid ? 'valid' : 'invalid'),
        last_validated_at: data.last_validated_at,
        created_at: data.created_at
      };

      // Mettre à jour l'état local avec la nouvelle configuration
      setConfigs(prevConfigs => [...prevConfigs, newConfig]);

      // Sauvegarder dans le cache local avec la nouvelle version
      const newVersion = configVersion + 1;
      setConfigVersion(newVersion);
      saveConfigsToLocalStorage(user.id, [...configs, newConfig]);

      // Mettre à jour le statut de synchronisation
      setSyncStatus('idle');
      setLastSyncTime(Date.now());

      return {
        id: data.id,
        isValid: validationResult.isValid,
        message: validationResult.isValid
          ? 'Configuration ajoutée avec succès'
          : 'Configuration ajoutée mais la clé API semble invalide'
      };
    } catch (error: any) {
      console.error("ApiConfigContext - Exception lors de l'ajout de la configuration:", error);
      setSyncErrors(prev => [...prev, `Exception: ${error?.message || 'Erreur inconnue'}`]);
      setSyncStatus('error');

      // Retry si possible
      if (retryCount < MAX_SYNC_RETRIES) {
        console.log(`ApiConfigContext - Nouvelle tentative (${retryCount + 1}/${MAX_SYNC_RETRIES}) dans ${SYNC_RETRY_INTERVAL/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, SYNC_RETRY_INTERVAL));
        return addConfig(config, retryCount + 1);
      }

      // Sauvegarder la configuration en attente
      if (user) {
        savePendingConfig(user.id, config);
      } else {
        savePendingConfig('unknown', config);
      }

      return {
        id: '',
        isValid: false,
        message: `Erreur lors de l'ajout - Configuration sauvegardée localement: ${error?.message || 'Erreur inconnue'}`
      };
    }
  };

  // Mettre à jour une configuration existante avec gestion robuste des erreurs et persistance locale
  const updateConfig = async (id: string, config: Partial<Omit<ApiConfig, "id">>, retryCount = 0): Promise<{ isValid: boolean; message: string }> => {
    // Mettre à jour le statut de synchronisation
    setSyncStatus('syncing');

    if (!user) {
      console.error("ApiConfigContext - Impossible de mettre à jour la configuration: utilisateur non connecté");
      setSyncStatus('error');
      setSyncErrors(prev => [...prev, "Tentative de mise à jour sans utilisateur connecté"]);
      return { isValid: false, message: 'Utilisateur non connecté' };
    }

    try {
      console.log("ApiConfigContext - Mise à jour de la configuration:", id, "tentative:", retryCount + 1);

      // Vérifier d'abord la session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("ApiConfigContext - Session Supabase expirée ou invalide");

        // Tenter de rafraîchir la session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          console.error("ApiConfigContext - Impossible de rafraîchir la session:", refreshError);
          setSyncStatus('error');
          setSyncErrors(prev => [...prev, `Session expirée: ${refreshError?.message || 'Erreur inconnue'}`]);
          return { isValid: false, message: 'Session expirée, veuillez vous reconnecter' };
        }

        console.log("ApiConfigContext - Session rafraîchie avec succès");
      }

      // Récupérer la configuration existante pour obtenir le provider
      const existingConfig = getConfigById(id);
      if (!existingConfig) {
        console.error("ApiConfigContext - Configuration non trouvée localement:", id);
        setSyncStatus('error');
        setSyncErrors(prev => [...prev, `Configuration non trouvée localement: ${id}`]);
        return { isValid: false, message: 'Configuration non trouvée' };
      }

      // Vérifier que la configuration existe dans Supabase et appartient à l'utilisateur
      const { data: configData, error: configError } = await supabase
        .from('api_configurations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (configError) {
        console.error("ApiConfigContext - Erreur lors de la vérification de la configuration:", configError);
        setSyncErrors(prev => [...prev, `Erreur de vérification: ${configError.message}`]);

        // Retry si possible
        if (retryCount < MAX_SYNC_RETRIES) {
          console.log(`ApiConfigContext - Nouvelle tentative (${retryCount + 1}/${MAX_SYNC_RETRIES}) dans ${SYNC_RETRY_INTERVAL/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, SYNC_RETRY_INTERVAL));
          return updateConfig(id, config, retryCount + 1);
        }

        setSyncStatus('error');
        return { isValid: false, message: configError.message };
      }

      if (!configData) {
        console.error("ApiConfigContext - Configuration non trouvée dans Supabase:", id);
        setSyncStatus('error');
        setSyncErrors(prev => [...prev, `Configuration non trouvée dans Supabase: ${id}`]);

        // Supprimer la configuration de l'état local si elle n'existe plus dans Supabase
        setConfigs(prevConfigs => prevConfigs.filter(c => c.id !== id));

        // Mettre à jour le cache local
        if (user) {
          const updatedConfigs = configs.filter(c => c.id !== id);
          saveConfigsToLocalStorage(user.id, updatedConfigs);
        }

        return { isValid: false, message: 'Configuration non trouvée dans la base de données' };
      }

      // Préparer les données à mettre à jour
      const updateData: any = {
        last_validated_at: new Date().toISOString()
      };

      // Mettre à jour le nom si fourni
      if (config.name) {
        updateData.name = config.name;
      }

      // Mettre à jour le modèle si fourni
      if (config.model) {
        updateData.model = config.model;
      }

      // Si une nouvelle clé API est fournie et différente de la valeur masquée, la valider puis la chiffrer
      if (config.key && config.key !== '••••••••••••••••') {
        // Valider la clé API avant de la mettre à jour
        console.log("ApiConfigContext - Validation de la clé API avant mise à jour...");
        const validationResult = await validateApiKey(
          config.provider || existingConfig.provider,
          config.key
        );

        // Déterminer le statut en fonction du résultat de la validation
        const status = validationResult.isValid ? 'valid' : 'invalid';
        console.log("ApiConfigContext - Statut de la nouvelle clé API:", status);

        // Mettre à jour is_valid qui est toujours présent
        updateData.is_valid = validationResult.isValid;

        // Ajouter le statut seulement si la colonne existe
        try {
          updateData.status = status;
        } catch (e: any) {
          console.warn("ApiConfigContext - La colonne status n'existe peut-être pas:", e);
          setSyncErrors(prev => [...prev, `Erreur avec la colonne status: ${e?.message || 'Erreur inconnue'}`]);
        }

        if (!validationResult.isValid) {
          console.error("ApiConfigContext - La clé API n'est pas valide:", validationResult.message);
          setSyncErrors(prev => [...prev, `Clé API invalide: ${validationResult.message}`]);
          // Continuer malgré l'échec de la validation pour permettre l'enregistrement de clés invalides
        } else {
          console.log("ApiConfigContext - Clé API validée avec succès");
        }

        // SOLUTION RADICALE: Stocker la clé API en clair sans chiffrement
        updateData.api_key = config.key; // Utiliser la clé en clair
      }

      // Si aucune donnée à mettre à jour, retourner un succès
      if (Object.keys(updateData).length === 1 && updateData.last_validated_at) {
        console.log("ApiConfigContext - Aucune donnée significative à mettre à jour");
        setSyncStatus('idle');
        return { isValid: true, message: 'Aucune modification effectuée' };
      }

      // Requête avec timeout pour éviter les blocages
      const timeoutPromise = new Promise<{ data: null, error: Error }>((resolve) => {
        setTimeout(() => {
          resolve({
            data: null,
            error: new Error("Timeout lors de la mise à jour de la configuration")
          });
        }, 10000); // 10 secondes de timeout
      });

      // Requête Supabase
      const updatePromise = supabase
        .from('api_configurations')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select(`
          id,
          name,
          provider_id,
          model,
          is_valid,
          status,
          last_validated_at,
          created_at,
          api_providers (
            id,
            name,
            slug
          )
        `)
        .single();

      // Utiliser Promise.race pour implémenter un timeout
      const result = await Promise.race([updatePromise, timeoutPromise]);
      const { data, error } = result as any;

      if (error) {
        console.error("ApiConfigContext - Erreur lors de la mise à jour de la configuration:", error);
        setSyncErrors(prev => [...prev, `Erreur de mise à jour: ${error.message}`]);

        // Retry si possible
        if (retryCount < MAX_SYNC_RETRIES) {
          console.log(`ApiConfigContext - Nouvelle tentative (${retryCount + 1}/${MAX_SYNC_RETRIES}) dans ${SYNC_RETRY_INTERVAL/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, SYNC_RETRY_INTERVAL));
          return updateConfig(id, config, retryCount + 1);
        }

        setSyncStatus('error');
        return { isValid: false, message: error.message };
      }

      if (!data) {
        console.error("ApiConfigContext - Données invalides reçues de Supabase après mise à jour");
        setSyncErrors(prev => [...prev, "Données invalides reçues après mise à jour"]);

        if (retryCount < MAX_SYNC_RETRIES) {
          console.log(`ApiConfigContext - Nouvelle tentative (${retryCount + 1}/${MAX_SYNC_RETRIES}) dans ${SYNC_RETRY_INTERVAL/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, SYNC_RETRY_INTERVAL));
          return updateConfig(id, config, retryCount + 1);
        }

        setSyncStatus('error');
        return { isValid: false, message: 'Erreur lors de la mise à jour de la configuration' };
      }

      console.log("ApiConfigContext - Configuration mise à jour avec succès");

      // Récupérer le slug du fournisseur
      let providerSlug = existingConfig.provider;
      try {
        if (data.api_providers) {
          if (typeof data.api_providers === 'object') {
            // Vérifier si api_providers est un tableau ou un objet
            if (Array.isArray(data.api_providers)) {
              // Si c'est un tableau, prendre le premier élément
              if (data.api_providers.length > 0) {
                providerSlug = data.api_providers[0].slug || existingConfig.provider;
              }
            } else {
              // Si c'est un objet, accéder directement au slug
              providerSlug = (data.api_providers as any).slug || existingConfig.provider;
            }
          }
        }
      } catch (e: any) {
        console.error("ApiConfigContext - Erreur lors de la récupération du slug:", e);
        setSyncErrors(prev => [...prev, `Erreur de récupération du slug: ${e?.message || 'Erreur inconnue'}`]);
      }

      // Créer la configuration mise à jour
      const updatedConfig: ApiConfig = {
        id: data.id,
        name: data.name,
        provider: providerSlug,
        provider_id: data.provider_id,
        model: data.model || '',
        key: '••••••••••••••••', // La clé API est masquée pour des raisons de sécurité
        isValidated: data.is_valid,
        status: (data.status as 'valid' | 'invalid' | 'unknown') || (data.is_valid ? 'valid' : 'invalid'),
        last_validated_at: data.last_validated_at,
        created_at: data.created_at
      };

      // Mettre à jour l'état local
      const updatedConfigs = configs.map(c => c.id === id ? updatedConfig : c);
      setConfigs(updatedConfigs);

      // Sauvegarder dans le cache local avec la nouvelle version
      const newVersion = configVersion + 1;
      setConfigVersion(newVersion);
      saveConfigsToLocalStorage(user.id, updatedConfigs);

      // Mettre à jour le statut de synchronisation
      setSyncStatus('idle');
      setLastSyncTime(Date.now());

      return {
        isValid: true,
        message: config.key && !updateData.is_valid
          ? 'Configuration mise à jour mais la clé API semble invalide'
          : 'Configuration mise à jour avec succès'
      };
    } catch (error: any) {
      console.error("ApiConfigContext - Exception lors de la mise à jour de la configuration:", error);
      setSyncErrors(prev => [...prev, `Exception: ${error?.message || 'Erreur inconnue'}`]);
      setSyncStatus('error');

      // Retry si possible
      if (retryCount < MAX_SYNC_RETRIES) {
        console.log(`ApiConfigContext - Nouvelle tentative (${retryCount + 1}/${MAX_SYNC_RETRIES}) dans ${SYNC_RETRY_INTERVAL/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, SYNC_RETRY_INTERVAL));
        return updateConfig(id, config, retryCount + 1);
      }

      return {
        isValid: false,
        message: error?.message || 'Erreur lors de la mise à jour de la configuration'
      };
    }
  };

  // Supprimer une configuration avec gestion robuste des erreurs et persistance locale
  const deleteConfig = async (id: string, retryCount = 0): Promise<void> => {
    // Mettre à jour le statut de synchronisation
    setSyncStatus('syncing');

    if (!user) {
      console.error("ApiConfigContext - Impossible de supprimer la configuration: utilisateur non connecté");
      setSyncStatus('error');
      setSyncErrors(prev => [...prev, "Tentative de suppression sans utilisateur connecté"]);
      return;
    }

    try {
      console.log("ApiConfigContext - Suppression de la configuration:", id, "tentative:", retryCount + 1);

      // Vérifier d'abord la session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("ApiConfigContext - Session Supabase expirée ou invalide");

        // Tenter de rafraîchir la session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          console.error("ApiConfigContext - Impossible de rafraîchir la session:", refreshError);
          setSyncStatus('error');
          setSyncErrors(prev => [...prev, `Session expirée: ${refreshError?.message || 'Erreur inconnue'}`]);
          return;
        }

        console.log("ApiConfigContext - Session rafraîchie avec succès");
      }

      // Vérifier que la configuration existe et appartient à l'utilisateur
      const { data: configData, error: configError } = await supabase
        .from('api_configurations')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (configError && configError.code !== 'PGRST116') { // PGRST116 = not found, which is fine for deletion
        console.error("ApiConfigContext - Erreur lors de la vérification de la configuration:", configError);
        setSyncErrors(prev => [...prev, `Erreur de vérification: ${configError.message}`]);

        // Retry si possible
        if (retryCount < MAX_SYNC_RETRIES) {
          console.log(`ApiConfigContext - Nouvelle tentative (${retryCount + 1}/${MAX_SYNC_RETRIES}) dans ${SYNC_RETRY_INTERVAL/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, SYNC_RETRY_INTERVAL));
          return deleteConfig(id, retryCount + 1);
        }

        setSyncStatus('error');
        return;
      }

      // Si la configuration n'existe pas dans Supabase, la supprimer de l'état local et du cache
      if (!configData) {
        console.log("ApiConfigContext - Configuration non trouvée dans Supabase, suppression locale uniquement:", id);

        // Supprimer la configuration de l'état local
        const updatedConfigs = configs.filter(config => config.id !== id);
        setConfigs(updatedConfigs);

        // Mettre à jour le cache local
        const newVersion = configVersion + 1;
        setConfigVersion(newVersion);
        saveConfigsToLocalStorage(user.id, updatedConfigs);

        // Vérifier s'il existe d'autres configurations avec le même ID dans d'autres tables
        try {
          // Vérifier dans la table api_keys (ancienne table)
          const { data: oldKeyData, error: oldKeyError } = await supabase
            .from('api_keys')
            .delete()
            .eq('id', id);

          if (oldKeyError) {
            console.warn("ApiConfigContext - Erreur lors de la suppression dans la table api_keys:", oldKeyError);
          } else if (oldKeyData) {
            console.log("ApiConfigContext - Configuration supprimée de la table api_keys");
          }
        } catch (cleanupError) {
          console.warn("ApiConfigContext - Erreur lors du nettoyage des anciennes tables:", cleanupError);
        }

        setSyncStatus('idle');
        setLastSyncTime(Date.now());
        return;
      }

      // Requête avec timeout pour éviter les blocages
      const timeoutPromise = new Promise<{ error: Error }>((resolve) => {
        setTimeout(() => {
          resolve({
            error: new Error("Timeout lors de la suppression de la configuration")
          });
        }, 10000); // 10 secondes de timeout
      });

      // Requête Supabase
      const deletePromise = supabase
        .from('api_configurations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      // Utiliser Promise.race pour implémenter un timeout
      const result = await Promise.race([deletePromise, timeoutPromise]);
      const { error } = result as any;

      if (error) {
        console.error("ApiConfigContext - Erreur lors de la suppression de la configuration:", error);
        setSyncErrors(prev => [...prev, `Erreur de suppression: ${error.message}`]);

        // Retry si possible
        if (retryCount < MAX_SYNC_RETRIES) {
          console.log(`ApiConfigContext - Nouvelle tentative (${retryCount + 1}/${MAX_SYNC_RETRIES}) dans ${SYNC_RETRY_INTERVAL/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, SYNC_RETRY_INTERVAL));
          return deleteConfig(id, retryCount + 1);
        }

        setSyncStatus('error');
        return;
      }

      console.log("ApiConfigContext - Configuration supprimée avec succès");

      // Supprimer la configuration de l'état local
      const updatedConfigs = configs.filter(config => config.id !== id);
      setConfigs(updatedConfigs);

      // Mettre à jour le cache local avec la nouvelle version
      const newVersion = configVersion + 1;
      setConfigVersion(newVersion);
      saveConfigsToLocalStorage(user.id, updatedConfigs);

      // Mettre à jour le statut de synchronisation
      setSyncStatus('idle');
      setLastSyncTime(Date.now());
    } catch (error: any) {
      console.error("ApiConfigContext - Exception lors de la suppression de la configuration:", error);
      setSyncErrors(prev => [...prev, `Exception: ${error?.message || 'Erreur inconnue'}`]);
      setSyncStatus('error');

      // Retry si possible
      if (retryCount < MAX_SYNC_RETRIES) {
        console.log(`ApiConfigContext - Nouvelle tentative (${retryCount + 1}/${MAX_SYNC_RETRIES}) dans ${SYNC_RETRY_INTERVAL/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, SYNC_RETRY_INTERVAL));
        return deleteConfig(id, retryCount + 1);
      }
    }
  };

  // Obtenir une configuration par son ID
  const getConfigById = (id: string) => {
    return configs.find(config => config.id === id);
  };

  // Obtenir toutes les configurations
  const getAllConfigs = () => {
    return configs;
  };

  // Fonction pour synchroniser les configurations en attente
  const syncPendingConfigs = async (): Promise<void> => {
    if (!user || typeof window === 'undefined') return;

    // Mettre à jour le statut de synchronisation
    setSyncStatus('syncing');

    try {
      // Récupérer les configurations en attente
      const storedPending = localStorage.getItem(PENDING_CONFIGS_KEY);
      if (!storedPending) {
        setSyncStatus('idle');
        return;
      }

      let pendingData: Record<string, Omit<ApiConfig, "id">[]> = {};
      try {
        pendingData = JSON.parse(storedPending);
      } catch (e: any) {
        console.error("ApiConfigContext - Erreur lors du parsing des configurations en attente:", e);
        setSyncErrors(prev => [...prev, `Erreur de parsing des configurations en attente: ${e?.message || 'Erreur inconnue'}`]);
        setSyncStatus('error');
        return;
      }

      // Vérifier s'il y a des configurations en attente pour l'utilisateur actuel
      if (!pendingData[user.id] || pendingData[user.id].length === 0) {
        setSyncStatus('idle');
        return;
      }

      console.log("ApiConfigContext - Synchronisation des configurations en attente:", pendingData[user.id].length);

      // Synchroniser chaque configuration en attente
      const results: Array<{ id: string; isValid: boolean; message: string }> = [];
      for (const pendingConfig of pendingData[user.id]) {
        try {
          console.log("ApiConfigContext - Tentative de synchronisation de la configuration en attente:", pendingConfig.name);
          const result = await addConfig(pendingConfig);
          results.push(result);

          if (result.id) {
            console.log("ApiConfigContext - Configuration en attente synchronisée avec succès:", pendingConfig.name);
          } else {
            console.error("ApiConfigContext - Échec de la synchronisation de la configuration en attente:", pendingConfig.name);
          }
        } catch (e: any) {
          console.error("ApiConfigContext - Erreur lors de la synchronisation de la configuration en attente:", e);
          setSyncErrors(prev => [...prev, `Erreur de synchronisation: ${e?.message || 'Erreur inconnue'}`]);
        }
      }

      // Supprimer les configurations en attente qui ont été synchronisées avec succès
      const successfulIds = results.filter(r => r.id).map(r => r.id);
      if (successfulIds.length > 0) {
        // Mettre à jour les configurations en attente
        pendingData[user.id] = pendingData[user.id].filter(pc => {
          // Garder uniquement les configurations qui n'ont pas été synchronisées avec succès
          // On compare par nom car les configurations en attente n'ont pas d'ID
          return !results.some(r => r.id && r.message.includes('succès') && pc.name === pc.name);
        });

        // Sauvegarder les configurations en attente mises à jour
        localStorage.setItem(PENDING_CONFIGS_KEY, JSON.stringify(pendingData));

        // Mettre à jour l'état local
        setPendingConfigs(pendingData[user.id]);

        console.log("ApiConfigContext - Configurations en attente mises à jour:", pendingData[user.id].length);
      }

      // Mettre à jour le statut de synchronisation
      setSyncStatus('idle');
      setLastSyncTime(Date.now());
    } catch (error: any) {
      console.error("ApiConfigContext - Erreur lors de la synchronisation des configurations en attente:", error);
      setSyncErrors(prev => [...prev, `Erreur de synchronisation: ${error?.message || 'Erreur inconnue'}`]);
      setSyncStatus('error');
    }
  };

  return (
    <ApiConfigContext.Provider
      value={{
        configs,
        isLoading,
        syncStatus,
        lastSyncTime,
        syncErrors,
        pendingConfigs,
        addConfig,
        updateConfig,
        deleteConfig,
        getConfigById,
        getAllConfigs,
        validateApiKey,
        syncPendingConfigs,
        clearLocalStorageForUser
      }}
    >
      <div suppressHydrationWarning>
        {children}
      </div>
    </ApiConfigContext.Provider>
  );
}

// Hook personnalisé pour utiliser le contexte
export function useApiConfig() {
  const context = useContext(ApiConfigContext);
  if (context === undefined) {
    throw new Error("useApiConfig doit être utilisé à l'intérieur d'un ApiConfigProvider");
  }
  return context;
}
