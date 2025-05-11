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

// Alias du type ApiConfig pour éviter les conflits
type ApiConfig = ApiConfigType;

// Utilisation des constantes importées depuis lib/constants/api-providers.ts

export function ApiKeyManager() {
  // Utiliser le contexte API et le router
  const { configs, addConfig: addApiConfig, updateConfig: updateApiConfig, deleteConfig: deleteApiConfig } = useApiConfig();
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

  // Gérer l'ouverture/fermeture du modal avec animation
  const closeModal = () => {
    setIsModalExiting(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsModalExiting(false);
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

    setIsValidating(true);
    setError(null);

    try {
      // Simuler une validation d'API (à remplacer par un appel API réel)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simuler une validation réussie
      const isValid = true;

      if (isValid) {
        return true;
      } else {
        setError("La clé API n'est pas valide. Veuillez vérifier et réessayer.");
        return false;
      }
    } catch (err) {
      setError("Erreur lors de la validation de la clé API. Veuillez réessayer.");
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
    }
  }, [formData.provider]);

  // Gérer l'ouverture/fermeture du modal et le défilement du body
  useEffect(() => {
    // Empêcher le défilement du body quand le modal est ouvert
    if (isModalOpen || showUpsellModal) {
      openModal();
    } else {
      closeModal();
    }

    // Gérer la touche Escape pour fermer le modal
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) closeModal();
        if (showUpsellModal) setShowUpsellModal(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    // Nettoyer les effets
    return () => {
      closeModal();
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

    if (!isEditing && !formData.key.trim()) {
      setError("La clé API est requise.");
      return;
    }

    // Valider la clé API si elle a été modifiée
    if (formData.key.trim()) {
      setIsValidating(true);
      const isValid = await validateApiKey();
      setIsValidating(false);

      if (!isValid) {
        return; // Arrêter si la validation échoue
      }
    }

    // Aucune logique de configuration par défaut n'est nécessaire

    if (isEditing && currentConfig) {
      // Mise à jour d'une configuration existante
      updateApiConfig(currentConfig.id, {
        name: formData.name,
        provider: formData.provider,
        model: formData.model,
        ...(formData.key ? { key: formData.key } : {}),
        isValidated: formData.key ? true : currentConfig.isValidated,
      });
    } else {
      // Ajout d'une nouvelle configuration
      const newConfigId = addApiConfig({
        name: formData.name,
        provider: formData.provider,
        model: formData.model,
        key: formData.key,
        isValidated: true,
      });

      // Sélectionner automatiquement le nouveau profil
      setSelectedConfigId(newConfigId);
    }

    // Fermer le modal avec animation
    setIsModalExiting(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsModalExiting(false);
      closeModal();
    }, 200);

    // Afficher un feedback de succès
    showFeedback('success', isEditing ? 'Profil API mis à jour avec succès' : 'Profil API créé avec succès');
  };

  // Supprimer une configuration
  const deleteConfig = (id: string) => {
    // Confirmation
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette configuration ?")) {
      return;
    }

    const configToDelete = configs.find(config => config.id === id);

    // Supprimer la configuration
    deleteApiConfig(id);

    // Si on supprime le profil sélectionné, sélectionner le premier profil restant
    if (id === selectedConfigId) {
      const remainingConfigs = configs.filter(config => config.id !== id);
      if (remainingConfigs.length > 0) {
        setSelectedConfigId(remainingConfigs[0].id);
      } else {
        setSelectedConfigId(null);
      }
    }

    // Afficher un feedback de succès
    showFeedback('success', `Profil "${configToDelete?.name}" supprimé avec succès`);
  };

  // Obtenir la configuration sélectionnée
  const selectedConfig = configs.find(config => config.id === selectedConfigId);

  // Aucune fonction setAsDefault n'est nécessaire

  return (
    <div className="space-y-6 md:space-y-8">
      {/* En-tête avec titre et bouton d'ajout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Gestion de vos Profils API</h1>
        <Button
          onClick={openAddModal}
          className="btn-primary flex items-center w-full sm:w-auto animate-card-entrance"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Ajouter un nouveau Profil
        </Button>
      </div>

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
                        </div>
                      </div>
                      <div className="text-xs text-bambi-subtext mt-1 flex items-center">
                        {API_PROVIDERS.find(p => p.value === config.provider)?.label || config.provider}
                        <span className="mx-1">•</span>
                        {PROVIDER_MODELS[config.provider]?.find(m => m.value === config.model)?.label || config.model}
                      </div>
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
                        </div>
                        <div className="bg-bambi-background/50 border border-bambi-border rounded-md p-3">
                          <h3 className="text-xs uppercase text-bambi-subtext mb-1 font-medium">Modèle</h3>
                          <div className="text-bambi-text font-medium">
                            {PROVIDER_MODELS[selectedConfig.provider]?.find(m => m.value === selectedConfig.model)?.label || selectedConfig.model}
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
                          {selectedConfig.isValidated && (
                            <div className="border-t border-bambi-border bg-green-500/10 text-green-500 p-2 text-xs flex items-center justify-center">
                              <CheckIcon className="h-3 w-3 mr-1" />
                              Clé validée
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
                onClick={closeModal}
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
                      placeholder={isEditing ? "••••••••••••••••••••" : "sk-..."}
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
                onClick={closeModal}
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
