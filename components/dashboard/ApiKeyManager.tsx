"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon, PencilIcon, TrashIcon, XIcon, CheckIcon, EyeIcon,
  EyeOffIcon, CopyIcon, InfoIcon, AlertCircleIcon, LockIcon, Loader2Icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { CustomSelect } from "@/components/ui/custom-select";
import { useApiConfig, ApiConfig as ApiConfigType } from "@/contexts/ApiConfigContext";
import {
  API_PROVIDERS,
  PROVIDER_MODELS,
  getProviderLabel,
  getModelLabel
} from "@/lib/constants/api-providers";
import { openModal, closeModal, cleanupModal, navigateTo } from "@/lib/modal-utils";

// Fonction pour vérifier si un modèle est compatible avec un fournisseur
const isModelCompatibleWithProvider = (provider: string, model: string): boolean => {
  if (!provider || !model) return true; // Si l'un des deux est vide, on considère que c'est compatible

  // Modèles compatibles par fournisseur
  const compatibleModels: Record<string, string[]> = {
    'openai': ['dall-e-2', 'dall-e-3', 'gpt-image-1'],
    'xai': ['grok-2-image-1212'],
    'google': ['imagen-2', 'imagen-3'],
    'gemini': ['imagen-2', 'imagen-3']
  };

  // Vérifier si le fournisseur est connu
  if (!compatibleModels[provider]) return true;

  // Vérifier si le modèle est compatible avec le fournisseur
  return compatibleModels[provider].includes(model);
};

// Fonction pour obtenir le modèle par défaut pour un fournisseur
const getDefaultModelForProvider = (provider: string): string => {
  switch (provider) {
    case 'openai': return 'dall-e-3';
    case 'xai': return 'grok-2-image-1212';
    case 'google':
    case 'gemini': return 'imagen-3';
    default: return 'dall-e-3';
  }
};
import { createClient } from "@/utils/supabase/client";

// Alias du type ApiConfig pour éviter les conflits
type ApiConfig = ApiConfigType;

// Utilisation des constantes importées depuis lib/constants/api-providers.ts

export function ApiKeyManager() {
  // Utiliser le contexte API et le router
  const { configs, addConfig: addApiConfig, updateConfig: updateApiConfig, deleteConfig: deleteApiConfig, clearLocalStorageForUser } = useApiConfig();
  const router = useRouter();

  // États
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(configs.length > 0 ? configs[0].id : null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<ApiConfig | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    provider: "",
    model: "",
    key: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'details'>('list');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    id: string;
  } | null>(null);
  const [isModalExiting, setIsModalExiting] = useState(false);

  // Nous n'avons plus besoin de recharger les configurations au montage du composant
  // car nous utilisons uniquement les données du contexte ApiConfigContext

  // Sélectionner le premier profil par défaut
  useEffect(() => {
    if (configs.length > 0 && !selectedConfigId) {
      setSelectedConfigId(configs[0].id);
    }

    // Basculer automatiquement vers l'onglet détails lorsqu'un profil est sélectionné sur mobile
    if (selectedConfigId) {
      setActiveTab('details');
    }
  }, [configs, selectedConfigId]);

  // Fonction pour afficher le feedback
  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setFeedback({ type, message, id });
    setTimeout(() => {
      setFeedback(prev => prev?.id === id ? null : prev);
    }, 3000);
  };

  // Fonction pour synchroniser les fournisseurs d'API
  const [isSyncing, setIsSyncing] = useState(false);

  const syncProviders = async () => {
    if (isSyncing) return;

    try {
      setIsSyncing(true);

      // Appel à l'API de synchronisation
      const response = await fetch('/api/sync-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Résultat de la synchronisation:", data);

        // Afficher un feedback de succès
        showFeedback('success', `Synchronisation réussie: ${data.results.providers.length} fournisseurs, ${data.results.models.length} modèles`);

        // Nous n'avons plus besoin de recharger la page
      } else {
        console.error("Erreur lors de la synchronisation:", data);
        showFeedback('error', data.error || "Erreur lors de la synchronisation des fournisseurs");
      }
    } catch (error) {
      console.error("Exception lors de la synchronisation:", error);
      showFeedback('error', "Erreur de connexion lors de la synchronisation");
    } finally {
      setIsSyncing(false);
    }
  };

  // Gérer l'ouverture/fermeture du modal avec animation
  const handleCloseModal = () => {
    setIsModalExiting(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsModalExiting(false);
      // Appeler closeModal de lib/modal-utils pour gérer la classe CSS du body
      closeModal();
    }, 200);
  };

  // Vérifier si l'utilisateur peut ajouter un nouveau profil (limite de 1 pour les utilisateurs gratuits)
  const canAddNewProfile = () => {
    // Simuler un utilisateur gratuit avec une limite de 1 profil
    const isPremiumUser = false;
    const maxProfilesForFreeUser = 1;

    if (!isPremiumUser && configs.length >= maxProfilesForFreeUser) {
      setShowUpsellModal(true);
      return false;
    }

    return true;
  };

  // Ouvrir le modal pour ajouter une nouvelle configuration
  const openAddModal = () => {
    if (!canAddNewProfile()) return;

    setIsEditing(false);
    setIsDuplicating(false);
    setFormData({
      name: "",
      provider: "",
      model: "",
      key: "",
    });
    setError(null);
    setShowKey(false);
    setIsModalOpen(true);

    // Empêcher le défilement du body quand le modal est ouvert
    openModal();
  };

  // Ouvrir le modal pour modifier une configuration existante
  const openEditModal = (config: ApiConfig) => {
    setIsEditing(true);
    setIsDuplicating(false);
    setCurrentConfig(config);
    setFormData({
      name: config.name,
      provider: config.provider,
      model: config.model,
      key: "", // Ne pas afficher la clé existante pour des raisons de sécurité
    });
    setError(null);
    setShowKey(false);
    setIsModalOpen(true);

    // Désactiver les champs provider et model en mode édition
    setTimeout(() => {
      const providerSelect = document.getElementById('provider') as HTMLSelectElement;
      const modelSelect = document.getElementById('model') as HTMLSelectElement;

      if (providerSelect) {
        providerSelect.disabled = true;
        providerSelect.classList.add('opacity-50', 'cursor-not-allowed');
      }

      if (modelSelect) {
        modelSelect.disabled = true;
        modelSelect.classList.add('opacity-50', 'cursor-not-allowed');
      }
    }, 100);

    // Empêcher le défilement du body quand le modal est ouvert
    openModal();
  };

  // Dupliquer une configuration existante
  const duplicateConfig = (config: ApiConfig) => {
    if (!canAddNewProfile()) return;

    setIsEditing(false);
    setIsDuplicating(true);
    setCurrentConfig(config);
    setFormData({
      name: `${config.name} (copie)`,
      provider: config.provider,
      model: config.model,
      key: "", // L'utilisateur doit entrer une nouvelle clé
    });
    setError(null);
    setShowKey(false);
    setIsModalOpen(true);

    // Empêcher le défilement du body quand le modal est ouvert
    openModal();
  };

  // Masquer la clé API en ne montrant que les 3 premiers caractères
  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 3) return key;
    return key.substring(0, 3) + '•'.repeat(Math.min(20, key.length - 3));
  };

  // Copier la clé API dans le presse-papiers
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        showFeedback('success', 'Clé API copiée dans le presse-papiers');
      })
      .catch(() => {
        showFeedback('error', 'Impossible de copier la clé API');
      });
  };

  // Valider une clé API
  const validateApiKey = async () => {
    if (!formData.key.trim()) {
      setError("Veuillez entrer une clé API pour la valider.");
      return false;
    }

    if (!formData.provider) {
      setError("Veuillez sélectionner un fournisseur d'API avant de valider la clé.");
      return false;
    }

    setIsValidating(true);
    setError(null);

    try {
      // Créer un client Supabase
      const supabase = createClient();

      // Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Vous devez être connecté pour valider une clé API.");
        return false;
      }

      console.log("Validation de la clé API pour le fournisseur:", formData.provider);

      // Appel à l'API de validation
      const response = await fetch('/api/validate-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: formData.provider,
          apiKey: formData.key,
        }),
      });

      // Vérifier si la requête a réussi
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur HTTP lors de la validation:", response.status, errorData);

        // Messages d'erreur spécifiques selon le fournisseur et le type d'erreur
        if (response.status === 404 && errorData.error?.includes('Fournisseur non trouvé')) {
          setError(
            "Fournisseur non trouvé dans la base de données. Veuillez contacter l'administrateur pour exécuter la migration de synchronisation des fournisseurs."
          );
        } else if (formData.provider === "openai") {
          if (errorData.error?.includes('invalid_api_key') || errorData.error?.includes('Invalid API key')) {
            setError("Clé API OpenAI invalide. Vérifiez que votre clé commence par 'sk-' et qu'elle est active.");
          } else if (errorData.error?.includes('rate_limit')) {
            setError("Limite de requêtes OpenAI atteinte. Veuillez réessayer plus tard.");
          } else {
            setError(errorData.error || `Erreur OpenAI: ${response.status}`);
          }
        } else if (formData.provider === "google") {
          if (errorData.error?.includes('invalid_api_key')) {
            setError("Clé API Google invalide. Vérifiez que votre clé est correcte et qu'elle est active.");
          } else {
            setError(errorData.error || `Erreur Google API: ${response.status}`);
          }
        } else if (formData.provider === "xai") {
          if (errorData.error?.includes('invalid_api_key')) {
            setError("Clé API xAI invalide. Vérifiez que votre clé est correcte et qu'elle est active.");
          } else {
            setError(errorData.error || `Erreur xAI API: ${response.status}`);
          }
        } else {
          setError(errorData.error || `Erreur ${response.status} lors de la validation de la clé API`);
        }

        return false;
      }

      // Analyser la réponse
      const data = await response.json();
      console.log("Résultat de la validation:", data);

      // Vérifier si la clé est valide selon la réponse
      if (data.isValid) {
        console.log("Clé API validée avec succès");
        return true;
      } else {
        setError(data.message || "La clé API n'est pas valide. Veuillez vérifier et réessayer.");
        return false;
      }
    } catch (err: any) {
      console.error("Exception lors de la validation de la clé API:", err);

      // En cas d'erreur réseau ou autre, considérer la clé comme invalide
      setError(err.message || "Erreur lors de la validation de la clé API. Veuillez réessayer.");

      // Pour le développement, accepter quand même la clé en cas d'erreur
      // Cela permet de continuer à tester même si le service de validation n'est pas disponible
      if (process.env.NODE_ENV === 'development') {
        console.warn("Mode développement: considérer la clé comme valide malgré l'erreur");
        return true;
      }

      return false;
    } finally {
      setIsValidating(false);
    }
  };

  // Gérer les changements dans le formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Gérer le changement de fournisseur pour mettre à jour les modèles disponibles
  useEffect(() => {
    if (formData.provider && PROVIDER_MODELS[formData.provider]?.length > 0) {
      // Sélectionner automatiquement le premier modèle disponible pour ce fournisseur
      setFormData(prev => ({
        ...prev,
        model: PROVIDER_MODELS[formData.provider][0].value
      }));
    } else if (formData.provider && (!PROVIDER_MODELS[formData.provider] || PROVIDER_MODELS[formData.provider].length === 0)) {
      // Si le fournisseur n'a pas de modèles définis, utiliser un modèle par défaut
      console.warn(`Aucun modèle défini pour le fournisseur ${formData.provider}, utilisation d'un modèle par défaut`);

      // Définir un modèle par défaut selon le fournisseur
      let defaultModel = 'default-model';
      if (formData.provider === 'openai') defaultModel = 'dall-e-3';
      else if (formData.provider === 'xai') defaultModel = 'grok-2-image-1212';
      else if (formData.provider === 'google' || formData.provider === 'gemini') defaultModel = 'imagen-3';

      setFormData(prev => ({
        ...prev,
        model: defaultModel
      }));
    }
  }, [formData.provider]);

  // Gérer l'ouverture/fermeture du modal et le défilement du body
  useEffect(() => {
    // Empêcher le défilement du body quand le modal est ouvert
    if (isModalOpen || showUpsellModal) {
      openModal();
    } else {
      // Seulement gérer la classe CSS du body, ne pas fermer le modal ici
      closeModal();
    }

    // Gérer la touche Escape pour fermer le modal
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) handleCloseModal();
        if (showUpsellModal) setShowUpsellModal(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    // Nettoyer les effets
    return () => {
      closeModal(); // Seulement nettoyer la classe CSS du body
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isModalOpen, showUpsellModal]);

  // Nettoyer les modales lors du démontage du composant
  useEffect(() => {
    return cleanupModal();
  }, []);

  // Sauvegarder la configuration
  const saveConfig = async () => {
    // Validation
    if (!formData.name.trim()) {
      setError("Le nom de la configuration est requis.");
      return;
    }

    if (!formData.provider) {
      setError("Veuillez sélectionner un fournisseur d'API.");
      return;
    }

    if (!formData.model) {
      setError("Veuillez sélectionner un modèle.");
      return;
    }

    // Si on est en mode édition, ne pas permettre de changer le fournisseur ou le modèle
    if (isEditing && currentConfig) {
      // Vérifier si le fournisseur a été modifié
      if (formData.provider !== currentConfig.provider) {
        setError("La modification du fournisseur n'est pas autorisée. Veuillez créer une nouvelle configuration.");
        // Restaurer le fournisseur d'origine
        setFormData(prev => ({
          ...prev,
          provider: currentConfig.provider
        }));
        return;
      }

      // Vérifier si le modèle a été modifié
      if (formData.model !== currentConfig.model) {
        setError("La modification du modèle n'est pas autorisée. Veuillez créer une nouvelle configuration.");
        // Restaurer le modèle d'origine
        setFormData(prev => ({
          ...prev,
          model: currentConfig.model
        }));
        return;
      }
    } else {
      // En mode création, vérifier la compatibilité entre le fournisseur et le modèle
      const isModelCompatible = isModelCompatibleWithProvider(formData.provider, formData.model);
      if (!isModelCompatible) {
        // Corriger automatiquement le modèle
        const defaultModel = getDefaultModelForProvider(formData.provider);
        console.warn(`Modèle ${formData.model} incompatible avec le fournisseur ${formData.provider}, correction automatique vers ${defaultModel}`);

        // Mettre à jour le formulaire avec le modèle corrigé
        setFormData(prev => ({
          ...prev,
          model: defaultModel
        }));

        // Informer l'utilisateur
        setError(`Le modèle "${formData.model}" n'est pas compatible avec le fournisseur "${formData.provider}". Le modèle a été automatiquement corrigé.`);
        return;
      }
    }

    if (!isEditing && !formData.key.trim()) {
      setError("La clé API est requise.");
      return;
    }

    // Valider la clé API si elle a été modifiée
    if (formData.key.trim()) {
      setIsValidating(true);

      // Utiliser une promesse avec timeout pour éviter les validations infinies
      try {
        const validationPromise = validateApiKey();
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => {
            console.log("Timeout de validation atteint, considérant la clé comme valide");
            resolve(true);
          }, 10000); // 10 secondes de timeout
        });

        // Utiliser la première promesse qui se résout
        const isValid = await Promise.race([validationPromise, timeoutPromise]);

        if (!isValid) {
          setIsValidating(false);
          return; // Arrêter si la validation échoue
        }
      } catch (error) {
        console.error("Erreur lors de la validation de la clé API:", error);
        // En mode développement, continuer malgré l'erreur
        if (process.env.NODE_ENV === 'development') {
          console.warn("Mode développement: considérer la clé comme valide malgré l'erreur");
        } else {
          setIsValidating(false);
          setError("Erreur lors de la validation de la clé API");
          return;
        }
      }

      setIsValidating(false);
    }

    try {
      if (isEditing && currentConfig) {
        // Mise à jour d'une configuration existante
        const result = await updateApiConfig(currentConfig.id, {
          name: formData.name,
          provider: formData.provider,
          model: formData.model,
          ...(formData.key ? { key: formData.key } : {}),
          isValidated: formData.key ? true : currentConfig.isValidated,
        });

        console.log("Configuration mise à jour:", result);

        // Fermer le modal avec animation
        handleCloseModal();

        // Afficher un feedback de succès
        showFeedback('success', 'Profil API mis à jour avec succès');

        // Nous n'avons plus besoin de recharger la page, les changements sont déjà visibles
        // grâce à la mise à jour de l'état dans le contexte ApiConfigContext
      } else {
        // Ajout d'une nouvelle configuration
        const result = await addApiConfig({
          name: formData.name,
          provider: formData.provider,
          model: formData.model,
          key: formData.key,
          isValidated: true,
        });

        console.log("Nouvelle configuration ajoutée:", result);

        if (result && result.id) {
          // Sélectionner automatiquement le nouveau profil
          setSelectedConfigId(result.id);

          // Fermer le modal avec animation
          handleCloseModal();

          // Afficher un feedback de succès
          const successMessage = result.isValid
            ? 'Profil API créé avec succès'
            : 'Profil API créé, mais la clé pourrait être invalide';

          showFeedback(result.isValid ? 'success' : 'info', successMessage);

          // Nous n'avons plus besoin de recharger la page, les changements sont déjà visibles
          // grâce à la mise à jour de l'état dans le contexte ApiConfigContext
        } else {
          // Message d'erreur détaillé
          console.error("Erreur détaillée lors de la création du profil:", result);

          if (result && result.message) {
            // Afficher le message d'erreur spécifique retourné par l'API
            setError(result.message);
          } else if (formData.provider === "openai") {
            setError("Erreur lors de la création du profil OpenAI. Vérifiez que votre clé API est valide et active.");
          } else if (formData.provider === "google") {
            setError("Erreur lors de la création du profil Google. Vérifiez que votre clé API est valide et active.");
          } else if (formData.provider === "xai") {
            setError("Erreur lors de la création du profil xAI. Vérifiez que votre clé API est valide et active.");
          } else {
            setError("Erreur lors de la création du profil API. Veuillez réessayer.");
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la configuration:", error);
      setError("Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.");
    }
  };

  // Nettoyer le localStorage
  const clearLocalStorage = () => {
    if (typeof window !== 'undefined') {
      // Utiliser la fonction du contexte pour nettoyer complètement le localStorage
      clearLocalStorageForUser('ALL');
      showFeedback('success', "Cache local nettoyé avec succès");
    }
  };

  // Supprimer une configuration
  const deleteConfig = async (id: string) => {
    // Confirmation
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette configuration ? Cette action est irréversible.")) {
      return;
    }

    try {
      const configToDelete = configs.find(config => config.id === id);

      if (!configToDelete) {
        showFeedback('error', "Configuration non trouvée");
        return;
      }

      // Supprimer la configuration
      await deleteApiConfig(id);
      console.log("Configuration supprimée:", id);

      // Si on supprime le profil sélectionné, sélectionner le premier profil restant
      if (id === selectedConfigId) {
        const remainingConfigs = configs.filter(config => config.id !== id);
        if (remainingConfigs.length > 0) {
          setSelectedConfigId(remainingConfigs[0].id);
        } else {
          setSelectedConfigId(null);
        }
      }

      // Vérifier si la configuration existe encore dans Supabase
      // et la supprimer si nécessaire
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('api_configurations')
          .delete()
          .eq('id', id);

        if (error) {
          console.warn("Erreur lors de la suppression dans Supabase:", error);
        } else {
          console.log("Configuration supprimée de Supabase avec succès");
        }
      } catch (supabaseError) {
        console.warn("Erreur lors de la suppression dans Supabase:", supabaseError);
      }

      // Afficher un feedback de succès
      showFeedback('success', `Profil "${configToDelete?.name}" supprimé avec succès`);

      // Nous n'avons plus besoin de recharger la page, les changements sont déjà visibles
      // grâce à la mise à jour de l'état dans le contexte ApiConfigContext
    } catch (error) {
      console.error("Erreur lors de la suppression de la configuration:", error);
      showFeedback('error', "Une erreur est survenue lors de la suppression");
    }
  };

  // Obtenir la configuration sélectionnée
  const selectedConfig = configs.find(config => config.id === selectedConfigId);

  // Aucune fonction setAsDefault n'est nécessaire

  return (
    <div className="space-y-6 md:space-y-8">
      {/* En-tête avec titre et boutons d'action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Gestion de vos Profils API</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={openAddModal}
            className="btn-primary flex items-center w-full sm:w-auto animate-card-entrance"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Ajouter un nouveau Profil
          </Button>

          {/* Bouton de synchronisation des fournisseurs (visible uniquement en développement) */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              onClick={syncProviders}
              disabled={isSyncing}
              variant="outline"
              className="flex items-center w-full sm:w-auto border-bambi-border"
            >
              {isSyncing ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Synchronisation...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                    <path d="M16 21h5v-5"></path>
                  </svg>
                  Synchroniser les fournisseurs
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Message d'aide pour les problèmes de validation */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-amber-600 text-sm animate-card-entrance">
          <div className="flex items-start">
            <InfoIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Problèmes de validation des clés API?</p>
              <p className="mt-1">Si vous rencontrez des erreurs "Fournisseur non trouvé" lors de la validation des clés API, cliquez sur le bouton "Synchroniser les fournisseurs" ci-dessus pour résoudre le problème.</p>
              <p className="mt-1">Cette action synchronisera les fournisseurs définis dans le frontend avec la base de données Supabase.</p>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearLocalStorage}
                  className="text-xs border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10"
                >
                  Nettoyer le cache local
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interface à deux panneaux */}
      {configs.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center border border-dashed border-bambi-border animate-card-entrance">
          <p className="text-bambi-subtext mb-4">
            Vous n'avez aucun profil de configuration API. Ajoutez-en un pour commencer !
          </p>
          <Button
            onClick={openAddModal}
            className="btn-primary"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Ajouter un Profil API
          </Button>

          {/* Aide pour les nouveaux utilisateurs */}
          <div className="mt-6 text-xs text-bambi-subtext bg-bambi-background/50 p-3 rounded-lg">
            <p className="font-medium mb-1">Comment obtenir une clé API?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Pour <strong>OpenAI</strong>: Visitez <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-bambi-accent hover:underline">platform.openai.com</a></li>
              <li>Pour <strong>Google Gemini</strong>: Visitez <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-bambi-accent hover:underline">Google AI Studio</a></li>
              <li>Pour <strong>xAI</strong>: Visitez <a href="https://x.ai/" target="_blank" rel="noopener noreferrer" className="text-bambi-accent hover:underline">x.ai</a></li>
            </ul>
          </div>
        </Card>
      ) : (
        <>
          {/* Navigation par onglets pour mobile */}
          <div className="flex lg:hidden mb-4 border-b border-bambi-border animate-card-entrance">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-3 text-center ${activeTab === 'list' ? 'text-bambi-accent border-b-2 border-bambi-accent' : 'text-bambi-subtext'}`}
              aria-label="Voir la liste des profils"
            >
              Liste des profils
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-3 text-center ${activeTab === 'details' ? 'text-bambi-accent border-b-2 border-bambi-accent' : 'text-bambi-subtext'}`}
              aria-label="Voir les détails du profil"
              disabled={!selectedConfig}
            >
              Détails
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 animate-card-entrance">
            {/* Panneau latéral - Liste des profils */}
            <div className={`w-full lg:w-1/3 lg:max-w-xs ${activeTab === 'list' ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-bambi-card border border-bambi-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="p-4 border-b border-bambi-border flex justify-between items-center">
                  <h2 className="font-semibold">Vos Profils API</h2>
                  <span className="text-xs text-bambi-subtext bg-bambi-background px-2 py-1 rounded-full">
                    {configs.length} profil{configs.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="divide-y divide-bambi-border max-h-[60vh] overflow-y-auto bambi-scrollbar">
                  {configs.map(config => (
                    <div
                      key={config.id}
                      className={`p-4 cursor-pointer transition-all duration-200 hover:bg-bambi-accent/5 ${
                        selectedConfigId === config.id ? 'bg-bambi-accent/10 border-l-2 border-bambi-accent' : 'border-l-2 border-transparent'
                      }`}
                      onClick={() => {
                        setSelectedConfigId(config.id);
                        setActiveTab('details');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="font-medium">{config.name}</div>
                          {/* Indicateur de statut de la clé API */}
                          {(config.status === 'valid' || config.isValidated === true) ? (
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 flex items-center">
                              <CheckIcon className="w-3 h-3 mr-1" />
                              Valide
                            </span>
                          ) : (
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 flex items-center">
                              <AlertCircleIcon className="w-3 h-3 mr-1" />
                              Invalide
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-bambi-subtext mt-1 flex items-center">
                        {API_PROVIDERS.find(p => p.value === config.provider)?.label || config.provider}
                        <span className="mx-1">•</span>
                        {PROVIDER_MODELS[config.provider]?.find(m => m.value === config.model)?.label || config.model}
                      </div>
                      {(config.status === 'invalid' || config.isValidated === false) && (
                        <div className="text-xs text-red-500 mt-1 flex items-center">
                          <AlertCircleIcon className="w-3 h-3 mr-1" />
                          Clé API invalide ou problème de configuration
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Panneau principal - Détails du profil sélectionné */}
            <div className={`w-full lg:flex-1 ${activeTab === 'details' ? 'block' : 'hidden lg:block'}`}>
              {selectedConfig ? (
                <Card className="border border-bambi-border shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-3 border-b border-bambi-border">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div>
                        <CardTitle className="text-xl">{selectedConfig.name}</CardTitle>
                        <CardDescription className="text-bambi-subtext mt-1">
                          Profil de configuration pour la génération d'images
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => duplicateConfig(selectedConfig)}
                          className="border-bambi-border text-bambi-subtext hover:text-bambi-text p-2.5 h-auto min-w-[40px] flex items-center justify-center"
                          aria-label="Dupliquer ce profil"
                        >
                          <CopyIcon className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => openEditModal(selectedConfig)}
                          className="border-bambi-border text-bambi-subtext hover:text-bambi-text p-2.5 h-auto min-w-[40px] flex items-center justify-center"
                          aria-label="Modifier ce profil"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => deleteConfig(selectedConfig.id)}
                          className="border-bambi-border text-bambi-subtext hover:text-red-500 p-2.5 h-auto min-w-[40px] flex items-center justify-center"
                          aria-label="Supprimer ce profil"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-bambi-background/50 border border-bambi-border rounded-md p-3">
                          <h3 className="text-xs uppercase text-bambi-subtext mb-1 font-medium">Fournisseur</h3>
                          <div className="text-bambi-text font-medium">
                            {API_PROVIDERS.find(p => p.value === selectedConfig.provider)?.label || selectedConfig.provider}
                          </div>
                          <div className="mt-2 text-xs text-bambi-subtext">
                            {selectedConfig.provider === 'openai' && (
                              <span>OpenAI propose DALL-E 3, un modèle de pointe pour la génération d'images.</span>
                            )}
                            {selectedConfig.provider === 'gemini' && (
                              <span>Google Gemini (Imagen) offre des capacités avancées de génération d'images.</span>
                            )}
                            {selectedConfig.provider === 'xai' && (
                              <span>xAI Grok propose des capacités de génération d'images innovantes.</span>
                            )}
                          </div>
                          <div className="mt-2 text-xs flex items-center">
                            <a
                              href={
                                selectedConfig.provider === 'openai' ? 'https://platform.openai.com/api-keys' :
                                selectedConfig.provider === 'gemini' ? 'https://ai.google.dev/' :
                                selectedConfig.provider === 'xai' ? 'https://x.ai/' : '#'
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-bambi-accent hover:underline flex items-center"
                            >
                              Obtenir une clé API
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                              </svg>
                            </a>
                          </div>
                        </div>
                        <div className="bg-bambi-background/50 border border-bambi-border rounded-md p-3">
                          <h3 className="text-xs uppercase text-bambi-subtext mb-1 font-medium">Modèle</h3>
                          <div className="text-bambi-text font-medium">
                            {PROVIDER_MODELS[selectedConfig.provider]?.find(m => m.value === selectedConfig.model)?.label || selectedConfig.model}
                          </div>
                          <div className="mt-2 text-xs text-bambi-subtext">
                            {selectedConfig.provider === 'openai' && selectedConfig.model === 'dall-e-3' && (
                              <span>DALL-E 3 offre une qualité exceptionnelle et une excellente compréhension des prompts.</span>
                            )}
                            {selectedConfig.provider === 'openai' && selectedConfig.model === 'dall-e-2' && (
                              <span>DALL-E 2 est un modèle plus ancien mais toujours performant pour la génération d'images.</span>
                            )}
                            {selectedConfig.provider === 'gemini' && (
                              <span>Imagen 2 offre des images de haute qualité avec une excellente compréhension du texte.</span>
                            )}
                            {selectedConfig.provider === 'xai' && (
                              <span>Grok-1 est le premier modèle de génération d'images de xAI.</span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center">
                            {(selectedConfig.status === 'valid' || selectedConfig.isValidated === true) ? (
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 flex items-center">
                                <CheckIcon className="w-3 h-3 mr-1" />
                                Prêt à l'emploi
                              </span>
                            ) : (
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 flex items-center">
                                <AlertCircleIcon className="w-3 h-3 mr-1" />
                                Clé API requise
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs uppercase text-bambi-subtext mb-1 font-medium">Clé API</h3>
                        <div className="bg-bambi-background border border-bambi-border rounded-md overflow-hidden">
                          <div className="flex items-center">
                            <div className="flex-1 p-3 font-mono text-sm overflow-x-auto whitespace-nowrap bambi-scrollbar">
                              {maskApiKey(selectedConfig.key)}
                            </div>
                            <div className="flex items-center border-l border-bambi-border">
                              <button
                                onClick={() => copyToClipboard(selectedConfig.key)}
                                className="p-3 text-bambi-subtext hover:text-bambi-text hover:bg-bambi-border/20"
                                title="Copier la clé"
                                aria-label="Copier la clé API"
                              >
                                <CopyIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          {/* Afficher le statut de la clé API */}
                          {(selectedConfig.status === 'valid' || selectedConfig.isValidated === true) ? (
                            <div className="border-t border-bambi-border bg-green-500/10 text-green-500 p-2 text-xs flex items-center justify-center">
                              <CheckIcon className="h-3 w-3 mr-1" />
                              Clé API valide et fonctionnelle
                            </div>
                          ) : (
                            <div className="border-t border-bambi-border bg-red-500/10 text-red-500 p-2 text-xs flex items-center justify-center">
                              <AlertCircleIcon className="h-3 w-3 mr-1" />
                              Clé API invalide ou expirée
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Aucun bouton "Définir comme profil par défaut" n'est nécessaire */}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border border-dashed border-bambi-border p-8 text-center">
                  <p className="text-bambi-subtext">
                    {configs.length > 0
                      ? "Sélectionnez un profil pour voir ses détails"
                      : "Vous n'avez aucun profil. Ajoutez-en un pour commencer !"}
                  </p>
                  {configs.length === 0 && (
                    <Button
                      onClick={openAddModal}
                      className="btn-primary mt-4"
                    >
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Ajouter un Profil API
                    </Button>
                  )}
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal pour ajouter/modifier une configuration */}
      {isModalOpen && (
        <div className="modal-fullscreen flex items-center justify-center p-4">
          <div
            className={`bg-bambi-card border border-bambi-border rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto bambi-scrollbar shadow-xl ${isModalExiting ? 'animate-modal-exit' : 'animate-modal-entrance'}`}
          >
            <div className="sticky top-0 bg-bambi-card border-b border-bambi-border p-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold truncate">
                {isEditing ? "Modifier le Profil API" : isDuplicating ? "Dupliquer le Profil API" : "Ajouter un Profil API"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-bambi-subtext hover:text-bambi-text p-2 rounded-full hover:bg-bambi-border/20"
                aria-label="Fermer"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm animate-error-shake">
                  <div className="flex items-start">
                    <AlertCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Nom du profil
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ex: Ma clé OpenAI pour DALL-E 3"
                    className="bg-bambi-background border-bambi-border h-11"
                    aria-required="true"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Fournisseur d'API
                  </label>
                  <CustomSelect
                    name="provider"
                    value={formData.provider}
                    onValueChange={(value: string) => setFormData(prev => ({ ...prev, provider: value }))}
                    placeholder="Sélectionner un fournisseur"
                    options={API_PROVIDERS}
                    className="bg-bambi-background border-bambi-border"
                    aria-required="true"
                  />
                </div>

                {formData.provider && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Modèle
                    </label>
                    <CustomSelect
                      name="model"
                      value={formData.model}
                      onValueChange={(value: string) => setFormData(prev => ({ ...prev, model: value }))}
                      placeholder="Sélectionner un modèle"
                      options={PROVIDER_MODELS[formData.provider] || []}
                      className="bg-bambi-background border-bambi-border"
                      aria-required="true"
                    />
                    <p className="text-xs text-bambi-subtext mt-1.5">
                      Sélectionnez le modèle de génération d'images à utiliser avec ce provider.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Clé API {isEditing && "(laisser vide pour conserver l'existante)"}
                  </label>
                  <div className="relative">
                    <Input
                      name="key"
                      type={showKey ? "text" : "password"}
                      value={formData.key}
                      onChange={handleChange}
                      placeholder={
                        isEditing ? "••••••••••••••••••••" :
                        formData.provider === "openai" ? "sk-..." :
                        formData.provider === "google" ? "AIza..." :
                        formData.provider === "xai" ? "xai-..." :
                        "Entrez votre clé API"
                      }
                      className="w-full bg-bambi-background border-bambi-border pr-10 h-11"
                      aria-required={!isEditing}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-bambi-subtext hover:text-bambi-text p-1 rounded-full hover:bg-bambi-border/20"
                      aria-label={showKey ? "Masquer la clé" : "Afficher la clé"}
                    >
                      {showKey ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Instructions spécifiques au fournisseur */}
                  {formData.provider === "openai" && (
                    <p className="text-xs text-bambi-subtext mt-1.5">
                      Les clés API OpenAI commencent par <code className="bg-bambi-background px-1 py-0.5 rounded">sk-</code> et peuvent être obtenues sur <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-bambi-accent hover:underline">platform.openai.com</a>.
                    </p>
                  )}

                  {formData.provider === "google" && (
                    <p className="text-xs text-bambi-subtext mt-1.5">
                      Les clés API Google commencent généralement par <code className="bg-bambi-background px-1 py-0.5 rounded">AIza</code> et peuvent être obtenues via <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-bambi-accent hover:underline">Google AI Studio</a>.
                    </p>
                  )}

                  {formData.provider === "xai" && (
                    <p className="text-xs text-bambi-subtext mt-1.5">
                      Les clés API xAI commencent généralement par <code className="bg-bambi-background px-1 py-0.5 rounded">xai-</code> et peuvent être obtenues sur <a href="https://x.ai/" target="_blank" rel="noopener noreferrer" className="text-bambi-accent hover:underline">x.ai</a>.
                    </p>
                  )}

                  <p className="text-xs text-bambi-subtext mt-1.5 flex items-center">
                    <LockIcon className="h-3 w-3 mr-1 text-bambi-accent" />
                    Votre clé API est stockée de manière sécurisée et n'est jamais partagée.
                  </p>
                </div>

                {/* Aucune case à cocher "Définir comme profil par défaut" n'est nécessaire */}
              </div>
            </div>

            <div className="sticky bottom-0 bg-bambi-card border-t border-bambi-border p-4 flex flex-col sm:flex-row sm:justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                className="border-bambi-border w-full sm:w-auto order-2 sm:order-1"
              >
                Annuler
              </Button>
              <Button
                onClick={saveConfig}
                disabled={isValidating}
                className="btn-primary w-full sm:w-auto order-1 sm:order-2"
              >
                {isValidating ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Validation...
                  </>
                ) : isEditing ? (
                  "Mettre à jour"
                ) : (
                  "Sauvegarder le profil"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'upsell pour les utilisateurs gratuits */}
      {showUpsellModal && (
        <div className="modal-fullscreen flex items-center justify-center p-4">
          <div className="bg-bambi-card border border-bambi-border rounded-lg w-full max-w-md shadow-xl animate-modal-entrance">
            <div className="p-4 border-b border-bambi-border flex justify-between items-center">
              <h2 className="text-xl font-bold">
                Passez à l'offre Premium
              </h2>
              <button
                onClick={() => {
                  setShowUpsellModal(false);
                }}
                className="text-bambi-subtext hover:text-bambi-text p-2 rounded-full hover:bg-bambi-border/20"
                aria-label="Fermer"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 text-center">
              <div className="bg-gradient-to-br from-bambi-accent/20 to-bambi-accentDark/20 p-5 rounded-full w-20 h-20 mx-auto mb-5 flex items-center justify-center animate-subtle-pulse">
                <LockIcon className="h-10 w-10 text-bambi-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Profils illimités avec Premium</h3>
              <div className="bg-bambi-background/50 border border-bambi-border rounded-lg p-4 mb-6 text-left">
                <p className="text-bambi-subtext mb-3">
                  L'offre gratuite est limitée à 1 profil de configuration API. Avec Premium, vous obtenez :
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Nombre illimité de profils API</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Validation automatique des clés API</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Accès à tous les fournisseurs d'API</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Fonctionnalités avancées de gestion des clés</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-4 border-t border-bambi-border flex flex-col sm:flex-row sm:justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUpsellModal(false);
                }}
                className="border-bambi-border w-full sm:w-auto order-2 sm:order-1"
              >
                Plus tard
              </Button>
              <Button
                onClick={() => {
                  setShowUpsellModal(false);
                  // Rediriger vers la page d'abonnement (à implémenter)
                  router.push("/plans");
                }}
                className="btn-primary w-full sm:w-auto order-1 sm:order-2 animate-button-pulse"
              >
                Voir les offres Premium
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Composant de feedback pour les actions */}
      {feedback && (
        <div
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center
            ${feedback.type === 'success' ? 'bg-green-500/90 text-white animate-success-pulse' :
              feedback.type === 'error' ? 'bg-red-500/90 text-white animate-error-shake' :
              'bg-bambi-accent/90 text-white'}`}
        >
          {feedback.type === 'success' ? (
            <CheckIcon className="h-5 w-5 mr-2" />
          ) : feedback.type === 'error' ? (
            <AlertCircleIcon className="h-5 w-5 mr-2" />
          ) : (
            <InfoIcon className="h-5 w-5 mr-2" />
          )}
          <span className="text-sm sm:text-base">{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Fermer"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
