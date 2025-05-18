"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  DownloadIcon,
  ShareIcon,
  RefreshCwIcon,
  Loader2Icon,
  PlusIcon,
  SparklesIcon,
  InfoIcon,
  AlertCircleIcon,
  XIcon,
  RocketIcon,
  CheckCircleIcon,
  ImageIcon,
  AspectRatioIcon,
  ZoomInIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CustomSelect } from "@/components/ui/custom-select";
import { RefreshConfigsButton } from "@/components/ui/RefreshConfigsButton";
import { useApiConfig, ApiConfig as ApiConfigType } from "@/contexts/ApiConfigContext";
import { createClient } from "@/utils/supabase/client";
import { saveGeneratedImages } from "@/services/images";
import {
  getProviderLabel,
  getModelLabel,
  getModelInfo,
  getModelCapabilities,
  getSupportedResolutions,
  PROVIDER_MODELS_INFO
} from "@/lib/constants/api-providers";

// Hook personnalisé pour la détection des médias queries
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Vérification côté client uniquement (pour éviter les erreurs SSR)
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      if (media.matches !== matches) {
        setMatches(media.matches);
      }

      const listener = () => setMatches(media.matches);

      // Utilisation de l'API moderne ou de l'API héritée selon la prise en charge du navigateur
      if (media.addEventListener) {
        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
      } else {
        // Fallback pour les anciens navigateurs
        media.addListener(listener);
        return () => media.removeListener(listener);
      }
    }

    // Valeur par défaut pour SSR
    return () => {};
  }, [matches, query]);

  return matches;
};

// Alias du type ApiConfig pour éviter les conflits
type ApiConfig = ApiConfigType;

type GeneratedImage = {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
};

// Type pour les options de génération d'images
type GenerationOptions = {
  size: string;
  aspectRatio: string;
  quality?: string;
  style?: string;
  count: number;
  model?: string;
};

// Type pour les erreurs détaillées
type DetailedError = {
  message: string;
  type: string;
  provider?: string;
  model?: string;
  retryable?: boolean;
  details?: any;
};

export function ImageGenerator() {
  // Utiliser le contexte API et le router
  const { configs } = useApiConfig();
  const router = useRouter();

  // États
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [initialPrompt, setInitialPrompt] = useState(""); // Pour suivre le prompt initial
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<DetailedError | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false); // Pour suivre si une première génération a été effectuée
  const [showConfigInfo, setShowConfigInfo] = useState(false); // Pour afficher les infos de configuration
  const [showUpsellModal, setShowUpsellModal] = useState(false); // Pour afficher le modal d'upsell
  const [userQuota, setUserQuota] = useState<{ used: number, limit: number } | null>(null); // Pour suivre le quota de l'utilisateur

  // États pour les options de génération
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>({
    size: "1024x1024",
    aspectRatio: "1:1",
    count: 2,
    quality: "standard",
    style: "vivid"
  });

  // État pour le modèle sélectionné
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  // État pour afficher les options avancées
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Détection du mode mobile
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Référence pour le conteneur principal
  const containerRef = useRef<HTMLDivElement>(null);

  // Options pour le sélecteur du nombre d'images
  const imageCountOptions = [
    { value: "1", label: "1 image" },
    { value: "2", label: "2 images" },
    { value: "4", label: "4 images" }
  ];

  // Obtenir les informations sur le fournisseur et le modèle sélectionnés avec logs de débogage
  const selectedConfigDetails = useMemo(() => {
    if (!selectedConfig) {
      console.log("ImageGenerator - Aucune configuration sélectionnée");
      return null;
    }

    const config = configs.find(c => c.id === selectedConfig);

    if (!config) {
      console.error("ImageGenerator - Configuration sélectionnée non trouvée dans la liste des configurations:", selectedConfig);
      console.log("ImageGenerator - Configurations disponibles:", configs.map(c => ({ id: c.id, name: c.name, provider: c.provider })));
      return null;
    }

    console.log("ImageGenerator - Détails de la configuration sélectionnée:", {
      id: config.id,
      name: config.name,
      provider: config.provider,
      model: config.model,
      status: config.status
    });

    return {
      provider: config.provider,
      model: config.model,
      name: config.name
    };
  }, [selectedConfig, configs]);

  // Obtenir les options disponibles pour le modèle sélectionné
  const modelCapabilities = useMemo(() => {
    if (!selectedConfigDetails) return null;

    return getModelCapabilities(
      selectedConfigDetails.provider,
      selectedConfigDetails.model
    );
  }, [selectedConfigDetails]);

  // Options pour le sélecteur de ratio d'aspect
  const aspectRatioOptions = useMemo(() => {
    if (!modelCapabilities?.supportedAspectRatios) {
      return [{ value: "1:1", label: "Carré (1:1)" }];
    }

    return modelCapabilities.supportedAspectRatios.map(ratio => {
      let label = "";
      if (ratio === "1:1") label = "Carré (1:1)";
      else if (ratio === "16:9") label = "Paysage (16:9)";
      else if (ratio === "9:16") label = "Portrait (9:16)";
      else if (ratio === "4:3") label = "Standard (4:3)";
      else if (ratio === "3:4") label = "Portrait (3:4)";
      else label = ratio;

      return { value: ratio, label };
    });
  }, [modelCapabilities]);

  // Options pour le sélecteur de résolution
  const resolutionOptions = useMemo(() => {
    if (!selectedConfigDetails) {
      return [{ value: "1024x1024", label: "Standard (1024×1024)" }];
    }

    const resolutions = getSupportedResolutions(
      selectedConfigDetails.provider,
      selectedConfigDetails.model
    );

    return resolutions.map(resolution => {
      const [width, height] = resolution.split('x').map(Number);
      return {
        value: resolution,
        label: `${width}×${height}`
      };
    });
  }, [selectedConfigDetails, generationOptions.aspectRatio]);

  // Options pour la qualité (uniquement pour OpenAI)
  const qualityOptions = useMemo(() => {
    if (!selectedConfigDetails || selectedConfigDetails.provider !== "openai") {
      return [];
    }

    return [
      { value: "standard", label: "Standard" },
      { value: "hd", label: "Haute définition" }
    ];
  }, [selectedConfigDetails]);

  // Options pour le style (uniquement pour OpenAI DALL-E 3)
  const styleOptions = useMemo(() => {
    if (!selectedConfigDetails ||
        selectedConfigDetails.provider !== "openai" ||
        selectedConfigDetails.model !== "dall-e-3") {
      return [];
    }

    return [
      { value: "vivid", label: "Vif" },
      { value: "natural", label: "Naturel" }
    ];
  }, [selectedConfigDetails]);

  // Sélectionner automatiquement la première configuration disponible au chargement
  // et rafraîchir les détails de la configuration sélectionnée
  useEffect(() => {
    if (configs.length > 0) {
      if (!selectedConfig) {
        // Prendre la première configuration disponible
        console.log("ImageGenerator - Sélection automatique de la première configuration:", configs[0].id);
        setSelectedConfig(configs[0].id);
      } else {
        // Vérifier si la configuration sélectionnée existe toujours
        const configExists = configs.some(config => config.id === selectedConfig);
        if (!configExists) {
          console.log("ImageGenerator - Configuration sélectionnée non trouvée, sélection de la première configuration:", configs[0].id);
          setSelectedConfig(configs[0].id);
        } else {
          // Vérifier si le fournisseur et le modèle sont compatibles
          const selectedConf = configs.find(config => config.id === selectedConfig);
          if (selectedConf) {
            // Vérifier si le modèle est compatible avec le fournisseur
            const isModelCompatible = isModelCompatibleWithProvider(selectedConf.provider, selectedConf.model);
            if (!isModelCompatible) {
              console.warn(`ImageGenerator - Modèle ${selectedConf.model} incompatible avec le fournisseur ${selectedConf.provider}, correction automatique`);

              // Corriger le modèle en fonction du fournisseur
              const correctedModel = getDefaultModelForProvider(selectedConf.provider);

              // Mettre à jour la configuration dans le contexte
              // Note: Cela ne modifie pas la configuration en base de données, juste l'affichage
              console.log(`ImageGenerator - Correction du modèle: ${selectedConf.model} -> ${correctedModel}`);

              // Afficher un message à l'utilisateur pour l'informer du problème
              setError(`Le modèle "${selectedConf.model}" n'est pas compatible avec le fournisseur "${selectedConf.provider}". Veuillez mettre à jour votre configuration.`);
            }
          }
        }
      }
    } else if (selectedConfig) {
      // Si aucune configuration n'est disponible mais qu'une configuration est sélectionnée, la désélectionner
      console.log("ImageGenerator - Aucune configuration disponible, désélection de la configuration actuelle");
      setSelectedConfig(null);
    }
  }, [configs, selectedConfig]);

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

  // Mettre à jour les options de génération lorsque la configuration change
  useEffect(() => {
    if (!selectedConfigDetails) return;

    // Obtenir les capacités du modèle
    const capabilities = getModelCapabilities(
      selectedConfigDetails.provider,
      selectedConfigDetails.model
    );

    if (!capabilities) return;

    // Mettre à jour les options avec les valeurs par défaut du modèle
    setGenerationOptions(prev => ({
      ...prev,
      aspectRatio: capabilities.defaultAspectRatio || "1:1",
      size: capabilities.maxResolution || "1024x1024",
      // Conserver le nombre d'images
      count: prev.count
    }));

    // Mettre à jour le modèle sélectionné
    setSelectedModel(selectedConfigDetails.model);

  }, [selectedConfigDetails]);

  // Récupérer le quota de l'utilisateur au chargement
  useEffect(() => {
    const fetchUserQuota = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        const { data: quotaData, error: quotaError } = await supabase
          .from('user_quotas')
          .select('monthly_generations_used, monthly_generations_limit')
          .eq('user_id', user.id)
          .single();

        if (quotaError && quotaError.code !== 'PGRST116') {
          console.error('Erreur lors de la récupération des quotas:', quotaError);
          return;
        }

        if (quotaData) {
          setUserQuota({
            used: quotaData.monthly_generations_used || 0,
            limit: quotaData.monthly_generations_limit || 50
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des quotas:', error);
      }
    };

    fetchUserQuota();
  }, []);

  // Fonction pour naviguer vers la page des clés API
  const navigateToApiKeys = () => {
    router.push("/api-keys");
  };

  // Fonction pour vérifier si le prompt a été modifié depuis la dernière génération
  const isPromptModified = () => {
    return prompt !== initialPrompt;
  };

  // Fonction pour naviguer vers la page des plans premium
  const navigateToPlans = () => {
    router.push("/plans");
  };

  // Fonction pour fermer le modal d'upsell
  const closeUpsellModal = () => {
    setShowUpsellModal(false);
  };

  // Fonction de génération d'images
  const generateImages = async () => {
    if (configs.length === 0) {
      setError("Aucune configuration API disponible. Veuillez en ajouter une dans la page des clés API.");
      return;
    }

    if (!selectedConfig) {
      setError("Veuillez sélectionner une configuration API.");
      return;
    }

    if (!prompt.trim()) {
      setError("Veuillez saisir un prompt.");
      return;
    }

    // Nettoyage du prompt pour tous les fournisseurs, mais plus strict pour xAI
    let cleanedPrompt = prompt;
    if (selectedConfigDetails?.provider === 'xai') {
      // Nettoyer le prompt en ne gardant que les caractères ASCII standard
      cleanedPrompt = prompt.replace(/[^\x20-\x7E]/g, ' ');

      // Vérifier si le prompt contient encore des caractères non-ASCII après nettoyage
      const nonAsciiRegex = /[^\x20-\x7E]/g;
      if (nonAsciiRegex.test(cleanedPrompt)) {
        setError("Pour xAI, veuillez utiliser uniquement des caractères ASCII standard (sans accents, émojis ou caractères spéciaux).");
        return;
      }

      // Mettre à jour le prompt dans l'interface
      setPrompt(cleanedPrompt);
    }

    // Vérifier si l'utilisateur a dépassé son quota
    if (userQuota && userQuota.used >= userQuota.limit) {
      setShowUpsellModal(true);
      return;
    }

    setError(null);
    setIsGenerating(true);
    setInitialPrompt(prompt); // Enregistrer le prompt utilisé pour cette génération

    try {
      console.log("Génération d'images avec la configuration:", selectedConfig);

      // Récupérer la configuration sélectionnée
      const config = configs.find(c => c.id === selectedConfig);
      if (!config) {
        throw new Error("Configuration non trouvée");
      }

      // Vérifier la compatibilité entre le fournisseur et le modèle
      if (!isModelCompatibleWithProvider(selectedConfigDetails?.provider || '', selectedConfigDetails?.model || '')) {
        throw new Error(`Le modèle "${selectedConfigDetails?.model}" n'est pas compatible avec le fournisseur "${selectedConfigDetails?.provider}". Veuillez mettre à jour votre configuration.`);
      }

      // Utiliser l'API spécifique pour xAI, sinon utiliser l'API standard
      const apiEndpoint = selectedConfigDetails?.provider === 'xai'
        ? '/api/xai-direct-db'  // Utiliser la nouvelle API qui accède directement à la clé API sans déchiffrement
        : '/api/generate-image';

      console.log(`Utilisation de l'endpoint: ${apiEndpoint} pour le fournisseur: ${selectedConfigDetails?.provider}`);

      // Créer un contrôleur d'abandon pour pouvoir annuler la requête si elle prend trop de temps
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log("Timeout atteint, abandon de la requête de génération d'images");
        controller.abort();
      }, 60000); // 60 secondes de timeout (optimisé pour améliorer la vitesse)

      // Appel à l'API de génération d'images avec timeout
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: cleanedPrompt, // Utiliser le prompt nettoyé
          configurationId: selectedConfig,
          count: generationOptions.count,
          size: generationOptions.size,
          aspectRatio: generationOptions.aspectRatio,
          quality: generationOptions.quality,
          style: generationOptions.style,
          provider: selectedConfigDetails?.provider,
          model: selectedConfigDetails?.model,
        }),
        signal: controller.signal
      });

      // Annuler le timeout si la requête se termine normalement
      clearTimeout(timeoutId);
      console.log("Requête de génération d'images terminée avec succès");

      // Ajouter des logs pour le débogage
      console.log("Statut de la réponse:", response.status, response.statusText);

      // Afficher les headers de manière compatible avec tous les navigateurs
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      console.log("Headers de la réponse:", headers);

      if (!response.ok) {
        const errorData = await response.json();

        // Vérifier si nous avons une erreur détaillée
        if (errorData.details) {
          setDetailedError({
            message: errorData.error || "Erreur lors de la génération d'images",
            type: errorData.details.type || "unknown",
            provider: selectedConfigDetails?.provider,
            model: selectedConfigDetails?.model,
            retryable: errorData.details.retryable || false,
            details: errorData.details
          });

          // Message d'erreur adapté au fournisseur
          let errorMessage = errorData.error || "Erreur lors de la génération d'images";

          // Personnaliser le message en fonction du fournisseur
          if (selectedConfigDetails?.provider === "openai") {
            if (errorData.details.type === "authentication") {
              errorMessage = "Clé API OpenAI invalide ou expirée";
            } else if (errorData.details.type === "content_policy") {
              errorMessage = "Le contenu demandé viole les règles de modération d'OpenAI";
            } else if (errorData.details.type === "billing") {
              errorMessage = "Crédits OpenAI insuffisants ou quota dépassé";
            } else if (errorData.details.type === "invalid_prompt") {
              errorMessage = "Prompt invalide pour OpenAI: " + errorData.error;
            }
          } else if (selectedConfigDetails?.provider === "google") {
            if (errorData.details.type === "invalid_api_key") {
              errorMessage = "Clé API Google Gemini invalide ou expirée";
            } else if (errorData.details.type === "content_policy_violation") {
              errorMessage = "Le contenu demandé viole les règles de modération de Google";
            }
          } else if (selectedConfigDetails?.provider === "xai") {
            if (errorData.details.type === "invalid_api_key") {
              errorMessage = "Clé API xAI invalide ou expirée";
            }
          }

          throw new Error(errorMessage);
        } else {
          throw new Error(errorData.error || "Erreur lors de la génération d'images");
        }
      }

      const data = await response.json();

      if (!data.images || data.images.length === 0) {
        throw new Error("Aucune image générée");
      }

      // Transformer les données pour correspondre à notre format GeneratedImage
      const generatedImages = data.images.map((image: any, index: number) => ({
        id: image.id || `img-${Date.now()}-${index}`,
        url: image.url,
        prompt,
        timestamp: new Date(),
      }));

      // Enregistrer les images générées dans Supabase de manière asynchrone
      // Utiliser une approche non-bloquante pour améliorer la vitesse
      console.log("Enregistrement des images générées dans Supabase...");
      const imagesToSave = data.images.map((image: any) => ({
        url: image.url,
        prompt: cleanedPrompt
      }));

      // Enregistrer les images de manière asynchrone sans attendre la fin
      saveGeneratedImages(
        imagesToSave,
        selectedConfig,
        selectedConfigDetails?.provider || '',
        selectedConfigDetails?.model || ''
      )
        .then(imageIds => {
          if (imageIds.length > 0) {
            console.log(`${imageIds.length} images enregistrées avec succès dans Supabase`);
          } else {
            console.warn("Aucune image n'a été enregistrée dans Supabase");
          }
        })
        .catch(saveError => {
          console.error("Erreur lors de l'enregistrement des images dans Supabase:", saveError);
        });

      setGeneratedImages(generatedImages);
      setSelectedImage(generatedImages[0]);
      setHasGenerated(true); // Marquer qu'une génération a été effectuée
    } catch (err: any) {
      console.error("Erreur lors de la génération d'images:", err);

      // Vérifier si l'erreur est due à un quota dépassé
      if (err.message === "Quota mensuel dépassé") {
        setShowUpsellModal(true);
        // Mettre à jour le quota local pour refléter que la limite a été atteinte
        if (userQuota) {
          setUserQuota({
            ...userQuota,
            used: userQuota.limit
          });
        }
      } else if (err.name === 'AbortError') {
        // Erreur spécifique au timeout
        setError("La génération d'images a pris trop de temps. Veuillez réessayer plus tard ou utiliser un prompt plus court.");
        console.log("Conseil: Les prompts plus courts ont tendance à être traités plus rapidement par l'API xAI.");
      } else if (err.message && err.message.includes("API xAI")) {
        // Erreur spécifique à l'API xAI
        setError(`Erreur de l'API xAI: ${err.message.replace("Erreur de l'API xAI: ", "")}. Veuillez vérifier votre clé API.`);
        console.log("Conseil: Vérifiez que votre clé API xAI est valide et correctement configurée.");
      } else {
        setError(err.message || "Erreur lors de la génération. Veuillez réessayer.");
      }

      // Récupérer à nouveau le quota de l'utilisateur pour s'assurer qu'il est à jour
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: quotaData } = await supabase
            .from('user_quotas')
            .select('monthly_generations_used, monthly_generations_limit')
            .eq('user_id', user.id)
            .single();

          if (quotaData) {
            setUserQuota({
              used: quotaData.monthly_generations_used || 0,
              limit: quotaData.monthly_generations_limit || 50
            });
          }
        }
      } catch (quotaError) {
        console.error('Erreur lors de la mise à jour des quotas:', quotaError);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Fonction pour régénérer avec le même prompt
  const regenerateImages = async () => {
    if (configs.length === 0) {
      setError("Aucune configuration API disponible. Veuillez en ajouter une dans la page des clés API.");
      return;
    }

    if (!selectedConfig) {
      setError("Veuillez sélectionner une configuration API.");
      return;
    }

    if (!initialPrompt.trim()) {
      setError("Aucun prompt précédent disponible.");
      return;
    }

    // Vérification spéciale pour xAI: s'assurer que le prompt ne contient que des caractères ASCII
    if (selectedConfigDetails?.provider === 'xai') {
      // Vérifier si le prompt contient des caractères non-ASCII
      const nonAsciiRegex = /[^\x20-\x7E]/g;
      if (nonAsciiRegex.test(initialPrompt)) {
        setError("Pour xAI, veuillez utiliser uniquement des caractères ASCII standard (sans accents, émojis ou caractères spéciaux).");
        return;
      }
    }

    // La régénération ne compte pas dans le quota, donc pas besoin de vérifier

    setError(null);
    setIsGenerating(true);

    try {
      console.log("Régénération d'images avec la configuration:", selectedConfig);

      // Récupérer la configuration sélectionnée
      const config = configs.find(c => c.id === selectedConfig);
      if (!config) {
        throw new Error("Configuration non trouvée");
      }

      // Vérifier la compatibilité entre le fournisseur et le modèle
      if (!isModelCompatibleWithProvider(selectedConfigDetails?.provider || '', selectedConfigDetails?.model || '')) {
        throw new Error(`Le modèle "${selectedConfigDetails?.model}" n'est pas compatible avec le fournisseur "${selectedConfigDetails?.provider}". Veuillez mettre à jour votre configuration.`);
      }

      // Utiliser l'API spécifique pour xAI, sinon utiliser l'API standard
      const apiEndpoint = selectedConfigDetails?.provider === 'xai'
        ? '/api/xai-direct-db'  // Utiliser la même API que pour la génération initiale
        : '/api/generate-image';

      console.log(`Régénération - Utilisation de l'endpoint: ${apiEndpoint} pour le fournisseur: ${selectedConfigDetails?.provider}`);

      // Nettoyer le prompt initial pour xAI
      let cleanedInitialPrompt = initialPrompt;
      if (selectedConfigDetails?.provider === 'xai') {
        // Nettoyer le prompt en ne gardant que les caractères ASCII standard
        cleanedInitialPrompt = initialPrompt.replace(/[^\x20-\x7E]/g, ' ');
      }

      // Créer un contrôleur d'abandon pour pouvoir annuler la requête si elle prend trop de temps
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 30000); // 30 secondes de timeout

      // Appel à l'API de génération d'images avec le prompt initial nettoyé
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: cleanedInitialPrompt,
          configurationId: selectedConfig,
          count: generationOptions.count,
          size: generationOptions.size,
          aspectRatio: generationOptions.aspectRatio,
          quality: generationOptions.quality,
          style: generationOptions.style,
          provider: selectedConfigDetails?.provider,
          model: selectedConfigDetails?.model,
        }),
        signal: controller.signal
      });

      // Annuler le timeout si la requête se termine normalement
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();

        // Vérifier si nous avons une erreur détaillée
        if (errorData.details) {
          setDetailedError({
            message: errorData.error || "Erreur lors de la régénération d'images",
            type: errorData.details.type || "unknown",
            provider: selectedConfigDetails?.provider,
            model: selectedConfigDetails?.model,
            retryable: errorData.details.retryable || false,
            details: errorData.details
          });

          // Message d'erreur adapté au fournisseur
          let errorMessage = errorData.error || "Erreur lors de la régénération d'images";

          // Personnaliser le message en fonction du fournisseur
          if (selectedConfigDetails?.provider === "openai") {
            if (errorData.details.type === "authentication") {
              errorMessage = "Clé API OpenAI invalide ou expirée";
            } else if (errorData.details.type === "content_policy") {
              errorMessage = "Le contenu demandé viole les règles de modération d'OpenAI";
            } else if (errorData.details.type === "billing") {
              errorMessage = "Crédits OpenAI insuffisants ou quota dépassé";
            } else if (errorData.details.type === "invalid_prompt") {
              errorMessage = "Prompt invalide pour OpenAI: " + errorData.error;
            }
          } else if (selectedConfigDetails?.provider === "google") {
            if (errorData.details.type === "invalid_api_key") {
              errorMessage = "Clé API Google Gemini invalide ou expirée";
            } else if (errorData.details.type === "content_policy_violation") {
              errorMessage = "Le contenu demandé viole les règles de modération de Google";
            }
          } else if (selectedConfigDetails?.provider === "xai") {
            if (errorData.details.type === "invalid_api_key") {
              errorMessage = "Clé API xAI invalide ou expirée";
            }
          }

          throw new Error(errorMessage);
        } else {
          throw new Error(errorData.error || "Erreur lors de la régénération d'images");
        }
      }

      const data = await response.json();

      if (!data.images || data.images.length === 0) {
        throw new Error("Aucune image générée");
      }

      // Transformer les données pour correspondre à notre format GeneratedImage
      const generatedImages = data.images.map((image: any, index: number) => ({
        id: image.id || `img-${Date.now()}-${index}`,
        url: image.url,
        prompt: initialPrompt,
        timestamp: new Date(),
      }));

      // Enregistrer les images régénérées dans Supabase de manière asynchrone
      // Utiliser une approche non-bloquante pour améliorer la vitesse
      console.log("Enregistrement des images régénérées dans Supabase...");
      const imagesToSave = data.images.map((image: any) => ({
        url: image.url,
        prompt: cleanedInitialPrompt
      }));

      // Enregistrer les images de manière asynchrone sans attendre la fin
      saveGeneratedImages(
        imagesToSave,
        selectedConfig,
        selectedConfigDetails?.provider || '',
        selectedConfigDetails?.model || ''
      )
        .then(imageIds => {
          if (imageIds.length > 0) {
            console.log(`${imageIds.length} images régénérées enregistrées avec succès dans Supabase`);
          } else {
            console.warn("Aucune image régénérée n'a été enregistrée dans Supabase");
          }
        })
        .catch(saveError => {
          console.error("Erreur lors de l'enregistrement des images régénérées dans Supabase:", saveError);
        });

      setGeneratedImages(generatedImages);
      setSelectedImage(generatedImages[0]);
    } catch (err: any) {
      console.error("Erreur lors de la régénération d'images:", err);

      // Vérifier si l'erreur est due à un quota dépassé
      if (err.message === "Quota mensuel dépassé") {
        setShowUpsellModal(true);
        // Mettre à jour le quota local pour refléter que la limite a été atteinte
        if (userQuota) {
          setUserQuota({
            ...userQuota,
            used: userQuota.limit
          });
        }
      } else if (err.name === 'AbortError') {
        // Erreur spécifique au timeout
        setError("La régénération d'images a pris trop de temps. Veuillez réessayer.");
      } else {
        setError(err.message || "Erreur lors de la régénération. Veuillez réessayer.");
      }

      // Récupérer à nouveau le quota de l'utilisateur pour s'assurer qu'il est à jour
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: quotaData } = await supabase
            .from('user_quotas')
            .select('monthly_generations_used, monthly_generations_limit')
            .eq('user_id', user.id)
            .single();

          if (quotaData) {
            setUserQuota({
              used: quotaData.monthly_generations_used || 0,
              limit: quotaData.monthly_generations_limit || 50
            });
          }
        }
      } catch (quotaError) {
        console.error('Erreur lors de la mise à jour des quotas:', quotaError);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Fonction pour télécharger l'image
  const downloadImage = (image: GeneratedImage) => {
    // Logique de téléchargement (à implémenter)
    alert(`Téléchargement de l'image ${image.id}`);
  };

  // Fonction pour partager l'image
  const shareImage = (image: GeneratedImage) => {
    // Logique de partage (à implémenter)
    alert(`Partage de l'image ${image.id}`);
  };

  // Fonction pour afficher les informations de configuration
  const renderConfigInfo = (configId: string) => {
    const config = configs.find(c => c.id === configId);
    if (!config) return null;

    // Obtenir le label du fournisseur
    const providerLabel = config.provider === "openai" ? "OpenAI" :
                          config.provider === "google" ? "Google Gemini" :
                          config.provider === "xai" ? "xAI" :
                          config.provider;

    // Obtenir le label du modèle
    const modelLabel = config.model === "dall-e-2" ? "DALL·E 2" :
                       config.model === "dall-e-3" ? "DALL·E 3" :
                       config.model === "gpt-image" ? "GPT Image" :
                       config.model === "imagen-2" ? "Imagen 2 (via Gemini)" :
                       config.model === "imagen-3" ? "Imagen 3 (via Gemini)" :
                       config.model === "grok-2-image-1212" ? "Grok-2-image-1212" :
                       config.model;

    // Vérifier le statut de la clé API
    const isValid = config.status === 'valid';

    return (
      <div className="mt-1 text-xs text-bambi-subtext bg-[#222222]/50 p-2 rounded-md">
        <p><span className="font-medium">Fournisseur:</span> {providerLabel}</p>
        <p><span className="font-medium">Modèle:</span> {modelLabel}</p>
        <p><span className="font-medium">Nom:</span> {config.name}</p>
        <p className="mt-1">
          <span className="font-medium">Statut:</span>
          <span className={`ml-1 ${isValid ? 'text-green-500' : 'text-red-500'}`}>
            {isValid ? 'Clé API valide ✓' : 'Clé API invalide ou expirée ⚠️'}
          </span>
        </p>
        {!isValid && (
          <p className="mt-1 text-amber-400 text-[10px]">
            Veuillez vérifier votre clé API dans la section "Configurations API"
          </p>
        )}
      </div>
    );
  };

  // Fonction pour afficher les informations d'aide sur la configuration
  const toggleConfigInfo = () => {
    setShowConfigInfo(!showConfigInfo);
  };

  // Rendu du composant
  return (
    <div className="flex items-center justify-center bg-[#111111] p-2">
      {/* Conteneur principal avec taille fixe exacte de 1100px × 650px */}
      <div
        ref={containerRef}
        className="w-[1100px] h-[650px] bg-[#0F0F0F] rounded-xl border border-[#333333] shadow-2xl overflow-hidden grid grid-cols-[1fr_320px] grid-rows-[1fr_auto]"
      >
        {/* Version mobile: Interface avec défilement optimisé */}
        {isMobile && (
          <div className="col-span-2 row-span-2 flex flex-col w-full h-full overflow-y-auto overscroll-y-contain">
            {/* Menu de contrôle en haut */}
            <div className="bg-[#1A1A1A] p-2 flex flex-col gap-2 relative">
              {/* Prompt principal - Pleine largeur */}
              <div className="bg-[#151515] p-2 rounded-lg border border-[#2A2A2A] shadow-sm">
                <label className="block text-xs font-medium mb-1 text-bambi-text">Décrivez votre image</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => {
                    // Nettoyer le prompt pour xAI en temps réel si xAI est sélectionné
                    if (selectedConfigDetails?.provider === 'xai') {
                      // Nettoyer le prompt de manière très stricte - caractère par caractère
                      const asciiOnly = [];
                      for (let i = 0; i < e.target.value.length; i++) {
                        const charCode = e.target.value.charCodeAt(i);
                        // Ne garder que les caractères ASCII imprimables (32-126)
                        if (charCode >= 32 && charCode <= 126) {
                          asciiOnly.push(e.target.value.charAt(i));
                        } else {
                          asciiOnly.push(' '); // Remplacer par un espace
                        }
                      }
                      // Joindre les caractères en une chaîne
                      const cleanedValue = asciiOnly.join('');
                      setPrompt(cleanedValue);
                    } else {
                      setPrompt(e.target.value);
                    }
                  }}
                  placeholder="Soyez précis et détaillé..."
                  className="bg-[#222222] border-[#333333] text-white h-[60px] resize-none text-xs p-2 rounded-md focus:ring-1 focus:ring-bambi-accent/50 focus:border-bambi-accent transition-all duration-200"
                />
              </div>

              {/* Configuration API - Pleine largeur */}
              <div className="bg-[#151515] p-2 rounded-lg border border-[#2A2A2A] shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <label className="block text-xs font-medium text-bambi-text mr-1">Configuration API</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-bambi-accent hover:bg-bambi-accent/10 h-5 w-5 p-0"
                      onClick={toggleConfigInfo}
                      title="Informations sur la configuration"
                    >
                      <InfoIcon className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-bambi-accent hover:bg-bambi-accent/10 h-5 px-1 transition-all duration-200 border-bambi-accent/30 hover:border-bambi-accent"
                      onClick={navigateToApiKeys}
                      title="Ajouter une nouvelle configuration API"
                    >
                      <PlusIcon className="h-3 w-3" />
                    </Button>

                    <RefreshConfigsButton
                      variant="outline"
                      size="icon"
                      className="h-5 w-5 text-bambi-accent hover:bg-bambi-accent/10 transition-all duration-200 border-bambi-accent/30 hover:border-bambi-accent"
                      onRefreshComplete={() => {
                        // Afficher un message de succès temporaire
                        const prevError = error;
                        setError("Configurations synchronisées avec succès");
                        setTimeout(() => {
                          setError(prevError);
                        }, 3000);
                      }}
                    />
                  </div>
                </div>
                {configs.length > 0 ? (
                  <CustomSelect
                    value={selectedConfig || ""}
                    onValueChange={(value: string) => setSelectedConfig(value)}
                    className="bg-[#222222] border-[#333333] text-white w-full rounded-md focus:ring-1 focus:ring-bambi-accent/50 focus:border-bambi-accent transition-all duration-200"
                    placeholder="Sélectionner une configuration"
                    size="sm"
                    options={configs.map(config => {
                      // Obtenir le label du fournisseur
                      const providerLabel = config.provider === "openai" ? "OpenAI" :
                                            config.provider === "google" ? "Google Gemini" :
                                            config.provider === "xai" ? "xAI" :
                                            config.provider;

                      // Ajouter un indicateur de statut pour la clé API
                      const isValid = config.status === 'valid';
                      return {
                        value: config.id,
                        label: `${config.name} (${providerLabel}) ${isValid ? '✓' : '⚠️'}`
                      };
                    })}
                  />
                ) : (
                  <div className="bg-[#222222] border border-[#333333] text-bambi-subtext rounded-md p-2 text-xs">
                    Aucune configuration API disponible. Veuillez en ajouter une.
                  </div>
                )}
                {showConfigInfo && selectedConfig && renderConfigInfo(selectedConfig)}
              </div>

              {/* Nombre d'images - Pleine largeur */}
              <div className="bg-[#151515] p-2 rounded-lg border border-[#2A2A2A] shadow-sm">
                <label className="block text-xs font-medium mb-1 text-bambi-text">Nombre d'images</label>
                <CustomSelect
                  value={generationOptions.count.toString()}
                  onValueChange={(value: string) => setGenerationOptions(prev => ({ ...prev, count: parseInt(value) }))}
                  className="bg-[#222222] border-[#333333] text-white rounded-md focus:ring-1 focus:ring-bambi-accent/50 focus:border-bambi-accent transition-all duration-200"
                  size="sm"
                  options={imageCountOptions}
                />
              </div>

              {/* Bouton pour afficher/masquer les options avancées - Masqué pour xAI */}
              {selectedConfigDetails?.provider !== "xai" && (
                <div className="bg-[#151515] p-2 rounded-lg border border-[#2A2A2A] shadow-sm">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="w-full border-[#333333] hover:bg-[#222222] text-white h-8 text-xs font-medium rounded-md transition-all duration-200 flex items-center justify-center"
                  >
                    {showAdvancedOptions ? (
                      <>
                        <span className="mr-1">Masquer les options avancées</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                          <path d="m18 15-6-6-6 6"/>
                        </svg>
                      </>
                    ) : (
                      <>
                        <span className="mr-1">Afficher les options avancées</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Message d'information pour xAI */}
              {selectedConfigDetails?.provider === "xai" && (
                <div className="bg-[#151515] p-2 rounded-lg border border-[#2A2A2A] shadow-sm">
                  <div className="text-xs text-bambi-subtext p-2 bg-[#222222] rounded-md">
                    <p className="flex items-center">
                      <InfoIcon className="h-3 w-3 mr-1 text-bambi-accent" />
                      Le modèle xAI ne supporte pas d'options avancées
                    </p>
                    <p className="flex items-center mt-1">
                      <AlertCircleIcon className="h-3 w-3 mr-1 text-amber-400" />
                      Utilisez uniquement des caractères ASCII standard (sans accents, émojis ou caractères spéciaux)
                    </p>
                  </div>
                </div>
              )}

              {/* Options avancées - Visibles uniquement si showAdvancedOptions est true et le fournisseur n'est pas xAI */}
              {showAdvancedOptions && selectedConfigDetails?.provider !== "xai" && (
                <div className="bg-[#151515] p-2 rounded-lg border border-[#2A2A2A] shadow-sm space-y-3">
                  <div className="text-xs font-medium text-bambi-text mb-2">Options avancées</div>

                  {/* Ratio d'aspect - Affiché uniquement si le modèle supporte plusieurs ratios */}
                  {aspectRatioOptions.length > 1 && (
                    <div className="space-y-1">
                      <label className="block text-xs text-bambi-subtext">Ratio d'aspect</label>
                      <CustomSelect
                        value={generationOptions.aspectRatio}
                        onValueChange={(value: string) => setGenerationOptions(prev => ({ ...prev, aspectRatio: value }))}
                        className="bg-[#222222] border-[#333333] text-white rounded-md focus:ring-1 focus:ring-bambi-accent/50 focus:border-bambi-accent transition-all duration-200"
                        size="sm"
                        options={aspectRatioOptions}
                      />
                    </div>
                  )}

                  {/* Résolution */}
                  <div className="space-y-1">
                    <label className="block text-xs text-bambi-subtext">Résolution</label>
                    <CustomSelect
                      value={generationOptions.size}
                      onValueChange={(value: string) => setGenerationOptions(prev => ({ ...prev, size: value }))}
                      className="bg-[#222222] border-[#333333] text-white rounded-md focus:ring-1 focus:ring-bambi-accent/50 focus:border-bambi-accent transition-all duration-200"
                      size="sm"
                      options={resolutionOptions}
                    />
                  </div>

                  {/* Qualité - Uniquement pour OpenAI */}
                  {qualityOptions.length > 0 && (
                    <div className="space-y-1">
                      <label className="block text-xs text-bambi-subtext">Qualité</label>
                      <CustomSelect
                        value={generationOptions.quality}
                        onValueChange={(value: string) => setGenerationOptions(prev => ({ ...prev, quality: value }))}
                        className="bg-[#222222] border-[#333333] text-white rounded-md focus:ring-1 focus:ring-bambi-accent/50 focus:border-bambi-accent transition-all duration-200"
                        size="sm"
                        options={qualityOptions}
                      />
                    </div>
                  )}

                  {/* Style - Uniquement pour OpenAI DALL-E 3 */}
                  {styleOptions.length > 0 && (
                    <div className="space-y-1">
                      <label className="block text-xs text-bambi-subtext">Style</label>
                      <CustomSelect
                        value={generationOptions.style}
                        onValueChange={(value: string) => setGenerationOptions(prev => ({ ...prev, style: value }))}
                        className="bg-[#222222] border-[#333333] text-white rounded-md focus:ring-1 focus:ring-bambi-accent/50 focus:border-bambi-accent transition-all duration-200"
                        size="sm"
                        options={styleOptions}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Boutons d'action - Disposition horizontale */}
              <div className="flex gap-2">
                {/* Bouton Générer */}
                <Button
                  onClick={generateImages}
                  disabled={isGenerating || !prompt.trim() || !selectedConfig || (hasGenerated && !isPromptModified())}
                  className={`flex-1 bg-gradient-to-r from-bambi-accent to-bambi-accentDark text-white h-9 text-xs font-medium rounded-md shadow-md hover:shadow-lg transition-all duration-200 hover:brightness-110 relative overflow-hidden ${!hasGenerated ? 'w-full' : ''}`}
                >
                  {isGenerating ? (
                    <>
                      <div className="flex items-center justify-center">
                        <div className="relative mr-1.5">
                          <div className="h-4 w-4 rounded-full border-1.5 border-t-transparent border-white animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-white/50"></div>
                          </div>
                        </div>
                        <span>Création...</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-3.5 w-3.5 mr-1" />
                      Générer
                    </>
                  )}
                </Button>

                {/* Bouton Régénérer - Côte à côte avec Générer */}
                {hasGenerated && (
                  <Button
                    onClick={regenerateImages}
                    disabled={isGenerating}
                    className="flex-1 border-bambi-accent text-bambi-accent hover:bg-bambi-accent/10 h-9 text-xs font-medium rounded-md transition-all duration-200 hover:border-bambi-accent"
                    variant="outline"
                  >
                    <RefreshCwIcon className="h-3.5 w-3.5 mr-1" />
                    Régénérer
                  </Button>
                )}
              </div>

              {/* Boutons de téléchargement et partage - Déjà en disposition horizontale */}
              {selectedImage && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => selectedImage && downloadImage(selectedImage)}
                    className="flex-1 border-[#333333] hover:bg-[#222222] text-white h-9 text-xs font-medium rounded-md transition-all duration-200"
                    variant="outline"
                  >
                    <DownloadIcon className="h-3.5 w-3.5 mr-1" />
                    Télécharger
                  </Button>
                  <Button
                    onClick={() => selectedImage && shareImage(selectedImage)}
                    className="flex-1 border-[#333333] hover:bg-[#222222] text-white h-9 text-xs font-medium rounded-md transition-all duration-200"
                    variant="outline"
                  >
                    <ShareIcon className="h-3.5 w-3.5 mr-1" />
                    Partager
                  </Button>
                </div>
              )}
            </div>

            {/* Galerie de miniatures juste en dessous du menu */}
            {generatedImages.length > 0 && (
              <div className="bg-[#151515] p-1 border-t border-b border-[#333333]">
                <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1 justify-center">
                  {generatedImages.map((image) => (
                    <button
                      key={image.id}
                      className={`h-14 w-14 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all duration-300 relative ${
                        selectedImage?.id === image.id
                          ? "border-bambi-accent shadow-[0_0_10px_rgba(123,92,250,0.4)]"
                          : "border-transparent hover:border-bambi-accent/50"
                      }`}
                      onClick={() => setSelectedImage(image)}
                    >
                      {selectedImage?.id === image.id && (
                        <div className="absolute inset-0 bg-bambi-accent/20 z-10"></div>
                      )}
                      <img
                        src={image.url}
                        alt={image.prompt}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Zone d'image en bas - élargie verticalement */}
            <div className="min-h-[600px] flex flex-col bg-[#0A0A0A]">
              <div className="flex items-center justify-center p-4 pb-12 pt-8">
                {isGenerating ? (
                  <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-bambi-accent/5 to-bambi-accentDark/5 animate-pulse"></div>

                    {/* Particules animées en arrière-plan */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute h-3 w-3 rounded-full bg-bambi-accent/20 top-1/4 left-1/3 animate-float-slow"></div>
                      <div className="absolute h-4 w-4 rounded-full bg-bambi-accent/10 bottom-1/3 right-1/4 animate-float-medium"></div>
                      <div className="absolute h-2 w-2 rounded-full bg-bambi-accentDark/15 top-1/2 right-1/3 animate-float-fast"></div>
                      <div className="absolute h-3 w-3 rounded-full bg-bambi-accentDark/10 bottom-1/4 left-1/4 animate-float-medium"></div>
                    </div>

                    <div className="text-center p-5 bg-[#1A1A1A]/90 border border-[#333333] rounded-xl shadow-2xl backdrop-blur-md z-10 transition-all duration-500 animate-in fade-in zoom-in-95 max-w-xs">
                      <div className="relative mb-4">
                        {/* Cercle extérieur animé */}
                        <div className="absolute inset-0 rounded-full border-3 border-bambi-accent/20 animate-pulse"></div>

                        {/* Cercle rotatif avec dégradé */}
                        <div className="h-14 w-14 mx-auto rounded-full border-t-3 border-r-3 border-bambi-accent border-b-3 border-bambi-accentDark animate-spin-slow"></div>

                        {/* Élément central */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-bambi-accent/30 to-bambi-accentDark/30 animate-pulse"></div>
                        </div>
                      </div>

                      <h3 className="text-bambi-text text-base font-medium mb-1">Création en cours...</h3>
                      <p className="text-bambi-subtext text-xs mb-2">L'IA transforme votre description en image</p>

                      <div className="flex justify-center space-x-1 mt-2">
                        <span className="h-1.5 w-1.5 bg-bambi-accent/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="h-1.5 w-1.5 bg-bambi-accent/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="h-1.5 w-1.5 bg-bambi-accent/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                ) : selectedImage ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="relative group w-full h-full flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-r from-bambi-accent/20 to-bambi-accentDark/20 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                      <div className="relative p-4 z-10 w-full h-full flex items-center justify-center">
                        <img
                          src={selectedImage.url}
                          alt={selectedImage.prompt}
                          className="max-w-full w-auto h-auto object-contain rounded-md shadow-lg transition-all duration-500 group-hover:scale-105"
                          style={{ maxHeight: 'min(80vh, 700px)' }}
                        />
                      </div>
                    </div>
                  </div>
                ) : configs.length === 0 ? (
                  <div className="text-center p-3 bg-[#1A1A1A]/40 border border-dashed border-[#333333] rounded-lg max-w-xs mx-auto shadow-md">
                    <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 p-2 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <AlertCircleIcon className="h-6 w-6 text-red-500/60" />
                    </div>
                    <p className="text-bambi-text text-xs font-medium mb-1">
                      Configuration API manquante
                    </p>
                    <p className="text-bambi-subtext text-xs mb-3">
                      Vous devez ajouter une configuration API pour générer des images.
                    </p>
                    <Button
                      onClick={navigateToApiKeys}
                      className="bg-bambi-accent hover:bg-bambi-accentDark text-white text-xs py-1 px-3 rounded-md"
                    >
                      Configurer une API
                    </Button>
                  </div>
                ) : (
                  <div className="text-center p-3 bg-[#1A1A1A]/40 border border-dashed border-[#333333] rounded-lg max-w-xs mx-auto shadow-md">
                    <div className="bg-gradient-to-r from-bambi-accent/10 to-bambi-accentDark/10 p-2 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <SparklesIcon className="h-6 w-6 text-bambi-accent/60" />
                    </div>
                    <p className="text-bambi-text text-xs font-medium mb-1">
                      Créez des images avec Bambi AI
                    </p>
                    <p className="text-bambi-subtext text-xs">
                      Décrivez ce que vous voulez créer !
                    </p>
                  </div>
                )}
              </div>

              {/* Espace supplémentaire supprimé */}

              {/* Espace final pour s'assurer que tout le contenu est accessible */}
              <div className="p-8 bg-[#0A0A0A]">
                <div className="text-center opacity-70">
                  <p className="text-bambi-subtext text-xs">© Bambi AI - Tous droits réservés</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Structure principale pour desktop - Zone d'image principale */}
        {!isMobile && (
          <div className="col-span-1 row-span-1 bg-[#0A0A0A] p-4 flex items-center justify-center">
            {isGenerating ? (
              <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-bambi-accent/5 to-bambi-accentDark/5 animate-pulse"></div>

                {/* Particules animées en arrière-plan */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute h-4 w-4 rounded-full bg-bambi-accent/20 top-1/4 left-1/3 animate-float-slow"></div>
                  <div className="absolute h-6 w-6 rounded-full bg-bambi-accent/10 bottom-1/3 right-1/4 animate-float-medium"></div>
                  <div className="absolute h-3 w-3 rounded-full bg-bambi-accentDark/15 top-1/2 right-1/3 animate-float-fast"></div>
                  <div className="absolute h-5 w-5 rounded-full bg-bambi-accentDark/10 bottom-1/4 left-1/4 animate-float-medium"></div>
                </div>

                <div className="text-center p-8 bg-[#1A1A1A]/90 border border-[#333333] rounded-xl shadow-2xl backdrop-blur-md z-10 transition-all duration-500 animate-in fade-in zoom-in-95 max-w-md">
                  <div className="relative mb-6">
                    {/* Cercle extérieur animé */}
                    <div className="absolute inset-0 rounded-full border-4 border-bambi-accent/20 animate-pulse"></div>

                    {/* Cercle rotatif avec dégradé */}
                    <div className="h-20 w-20 mx-auto rounded-full border-t-4 border-r-4 border-bambi-accent border-b-4 border-bambi-accentDark animate-spin-slow"></div>

                    {/* Élément central */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-bambi-accent/30 to-bambi-accentDark/30 animate-pulse"></div>
                    </div>
                  </div>

                  <h3 className="text-bambi-text text-xl font-medium mb-2">Création en cours...</h3>
                  <p className="text-bambi-subtext text-sm mb-3">L'IA transforme votre description en image</p>

                  <div className="flex justify-center space-x-1 mt-4">
                    <span className="h-2 w-2 bg-bambi-accent/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-2 w-2 bg-bambi-accent/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-2 w-2 bg-bambi-accent/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            ) : selectedImage ? (
              <div className="relative group w-full h-full flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-bambi-accent/20 to-bambi-accentDark/20 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative p-4 z-10 w-full h-full flex items-center justify-center">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.prompt}
                    className="max-w-[550px] max-h-[550px] w-auto h-auto object-contain rounded-md shadow-lg transition-all duration-500 group-hover:scale-105"
                  />
                </div>
              </div>
            ) : configs.length === 0 ? (
              <div className="text-center p-8 bg-[#1A1A1A]/40 border border-dashed border-[#333333] rounded-lg max-w-lg mx-auto shadow-md transition-all duration-300">
                <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 p-4 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <AlertCircleIcon className="h-12 w-12 text-red-500/60" />
                </div>
                <h3 className="text-bambi-text text-lg font-medium mb-2">
                  Configuration API manquante
                </h3>
                <p className="text-bambi-subtext text-sm mb-4">
                  Vous devez ajouter une configuration API pour générer des images.
                </p>
                <Button
                  onClick={navigateToApiKeys}
                  className="bg-bambi-accent hover:bg-bambi-accentDark text-white py-2 px-4 rounded-md"
                >
                  Configurer une API
                </Button>
              </div>
            ) : (
              <div className="text-center p-8 bg-[#1A1A1A]/40 border border-dashed border-[#333333] rounded-lg max-w-lg mx-auto shadow-md transition-all duration-300">
                <div className="bg-gradient-to-r from-bambi-accent/10 to-bambi-accentDark/10 p-4 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <SparklesIcon className="h-12 w-12 text-bambi-accent/60" />
                </div>
                <p className="text-bambi-text text-lg font-medium mb-2">
                  Créez des images avec Bambi AI
                </p>
                <p className="text-bambi-subtext text-sm">
                  Décrivez ce que vous voulez créer et cliquez sur 'Générer' !
                </p>
              </div>
            )}
          </div>
        )}

        {/* Structure principale pour desktop - Galerie de miniatures */}
        {!isMobile && generatedImages.length > 0 && (
          <div className="col-span-1 row-span-1 row-start-2 bg-[#1A1A1A]/90 p-2 border-t border-[#333333]">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide py-1 justify-center">
              {generatedImages.map((image) => (
                <button
                  key={image.id}
                  className={`h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all duration-300 hover:shadow-lg group relative ${
                    selectedImage?.id === image.id
                      ? "border-bambi-accent shadow-[0_0_15px_rgba(123,92,250,0.4)]"
                      : "border-transparent hover:border-bambi-accent/50"
                  }`}
                  onClick={() => setSelectedImage(image)}
                >
                  {selectedImage?.id === image.id && (
                    <div className="absolute inset-0 bg-bambi-accent/20 z-10"></div>
                  )}
                  <div className="relative w-full h-full">
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Structure principale pour desktop - Panneau de contrôle */}
        {!isMobile && (
          <div className="col-span-1 col-start-2 row-span-2 border-l border-[#333333] bg-[#1A1A1A] flex flex-col h-full overflow-y-auto scrollbar-hide">
            <div className="p-3 space-y-2 grid grid-cols-1 gap-2">
              {/* Configuration API */}
              <div className="bg-[#151515] p-2 rounded-lg border border-[#2A2A2A] shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <label className="block text-xs font-medium text-bambi-text mr-1">Configuration API</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-bambi-accent hover:bg-bambi-accent/10 h-6 w-6 p-0 transition-colors duration-200"
                      onClick={toggleConfigInfo}
                      title="Informations sur la configuration"
                    >
                      <InfoIcon className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-bambi-accent hover:bg-bambi-accent/10 h-6 px-1 transition-all duration-200 border-bambi-accent/30 hover:border-bambi-accent"
                      onClick={navigateToApiKeys}
                      title="Ajouter une nouvelle configuration API"
                    >
                      <PlusIcon className="h-3 w-3 mr-1" />
                      <span className="text-xs">Nouvelle</span>
                    </Button>

                    <RefreshConfigsButton
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 text-bambi-accent hover:bg-bambi-accent/10 transition-all duration-200 border-bambi-accent/30 hover:border-bambi-accent"
                      onRefreshComplete={() => {
                        // Afficher un message de succès temporaire
                        const prevError = error;
                        setError("Configurations synchronisées avec succès");
                        setTimeout(() => {
                          setError(prevError);
                        }, 3000);
                      }}
                    />
                  </div>
                </div>
                {configs.length > 0 ? (
                  <CustomSelect
                    value={selectedConfig || ""}
                    onValueChange={(value: string) => setSelectedConfig(value)}
                    className="bg-[#222222] border-[#333333] text-white w-full rounded-md focus:ring-1 focus:ring-bambi-accent/50 focus:border-bambi-accent transition-all duration-200"
                    placeholder="Sélectionner une configuration"
                    size="sm"
                    options={configs.map(config => {
                      // Obtenir le label du fournisseur
                      const providerLabel = config.provider === "openai" ? "OpenAI" :
                                            config.provider === "google" ? "Google Gemini" :
                                            config.provider === "xai" ? "xAI" :
                                            config.provider;

                      // Ajouter un indicateur de statut pour la clé API
                      const isValid = config.status === 'valid';
                      return {
                        value: config.id,
                        label: `${config.name} (${providerLabel}) ${isValid ? '✓' : '⚠️'}`
                      };
                    })}
                  />
                ) : (
                  <div className="bg-[#222222] border border-[#333333] text-bambi-subtext rounded-md p-2 text-xs">
                    Aucune configuration API disponible. Veuillez en ajouter une.
                  </div>
                )}
                {showConfigInfo && selectedConfig && renderConfigInfo(selectedConfig)}
              </div>

              {/* Prompt principal */}
              <div className="bg-[#151515] p-2 rounded-lg border border-[#2A2A2A] shadow-sm">
                <label className="block text-xs font-medium mb-1 text-bambi-text">Décrivez votre image</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => {
                    // Nettoyer le prompt pour xAI en temps réel si xAI est sélectionné
                    if (selectedConfigDetails?.provider === 'xai') {
                      // Nettoyer le prompt de manière très stricte - caractère par caractère
                      const asciiOnly = [];
                      for (let i = 0; i < e.target.value.length; i++) {
                        const charCode = e.target.value.charCodeAt(i);
                        // Ne garder que les caractères ASCII imprimables (32-126)
                        if (charCode >= 32 && charCode <= 126) {
                          asciiOnly.push(e.target.value.charAt(i));
                        } else {
                          asciiOnly.push(' '); // Remplacer par un espace
                        }
                      }
                      // Joindre les caractères en une chaîne
                      const cleanedValue = asciiOnly.join('');
                      setPrompt(cleanedValue);
                    } else {
                      setPrompt(e.target.value);
                    }
                  }}
                  placeholder="Soyez précis et détaillé dans votre description..."
                  className="bg-[#222222] border-[#333333] text-white h-[90px] resize-none text-xs p-2 rounded-md focus:ring-1 focus:ring-bambi-accent/50 focus:border-bambi-accent transition-all duration-200"
                />
              </div>

              {/* Nombre d'images */}
              <div className="bg-[#151515] p-2 rounded-lg border border-[#2A2A2A] shadow-sm">
                <label className="block text-xs font-medium mb-1 text-bambi-text">Nombre d'images</label>
                <CustomSelect
                  value={generationOptions.count.toString()}
                  onValueChange={(value: string) => setGenerationOptions(prev => ({ ...prev, count: parseInt(value) }))}
                  className="bg-[#222222] border-[#333333] text-white rounded-md focus:ring-1 focus:ring-bambi-accent/50 focus:border-bambi-accent transition-all duration-200"
                  size="sm"
                  options={imageCountOptions}
                />
              </div>

              {/* Bouton pour afficher/masquer les options avancées - Masqué pour xAI */}
              {selectedConfigDetails?.provider !== "xai" && (
                <div className="bg-[#151515] p-2 rounded-lg border border-[#2A2A2A] shadow-sm">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="w-full border-[#333333] hover:bg-[#222222] text-white h-8 text-xs font-medium rounded-md transition-all duration-200 flex items-center justify-center"
                  >
                    {showAdvancedOptions ? (
                      <>
                        <span className="mr-1">Masquer les options avancées</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                          <path d="m18 15-6-6-6 6"/>
                        </svg>
                      </>
                    ) : (
                      <>
                        <span className="mr-1">Afficher les options avancées</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Message d'information pour xAI */}
              {selectedConfigDetails?.provider === "xai" && (
                <div className="bg-[#151515] p-2 rounded-lg border border-[#2A2A2A] shadow-sm">
                  <div className="text-xs text-bambi-subtext p-2 bg-[#222222] rounded-md">
                    <p className="flex items-center">
                      <InfoIcon className="h-3 w-3 mr-1 text-bambi-accent" />
                      Le modèle xAI ne supporte pas d'options avancées
                    </p>
                  </div>
                </div>
              )}

              {/* Options avancées - Visibles uniquement si showAdvancedOptions est true et le fournisseur n'est pas xAI */}
              {showAdvancedOptions && selectedConfigDetails?.provider !== "xai" && (
                <div className="bg-[#151515] p-2 rounded-lg border border-[#2A2A2A] shadow-sm space-y-3">
                  <div className="text-xs font-medium text-bambi-text mb-2">Options avancées</div>

                  {/* Ratio d'aspect - Affiché uniquement si le modèle supporte plusieurs ratios */}
                  {aspectRatioOptions.length > 1 && (
                    <div className="space-y-1">
                      <label className="block text-xs text-bambi-subtext">Ratio d'aspect</label>
                      <CustomSelect
                        value={generationOptions.aspectRatio}
                        onValueChange={(value: string) => setGenerationOptions(prev => ({ ...prev, aspectRatio: value }))}
                        className="bg-[#222222] border-[#333333] text-white rounded-md focus:ring-1 focus:ring-bambi-accent/50 focus:border-bambi-accent transition-all duration-200"
                        size="sm"
                        options={aspectRatioOptions}
                      />
                    </div>
                  )}

                  {/* Résolution */}
                  <div className="space-y-1">
                    <label className="block text-xs text-bambi-subtext">Résolution</label>
                    <CustomSelect
                      value={generationOptions.size}
                      onValueChange={(value: string) => setGenerationOptions(prev => ({ ...prev, size: value }))}
                      className="bg-[#222222] border-[#333333] text-white rounded-md focus:ring-1 focus:ring-bambi-accent/50 focus:border-bambi-accent transition-all duration-200"
                      size="sm"
                      options={resolutionOptions}
                    />
                  </div>

                  {/* Qualité - Uniquement pour OpenAI */}
                  {qualityOptions.length > 0 && (
                    <div className="space-y-1">
                      <label className="block text-xs text-bambi-subtext">Qualité</label>
                      <CustomSelect
                        value={generationOptions.quality}
                        onValueChange={(value: string) => setGenerationOptions(prev => ({ ...prev, quality: value }))}
                        className="bg-[#222222] border-[#333333] text-white rounded-md focus:ring-1 focus:ring-bambi-accent/50 focus:border-bambi-accent transition-all duration-200"
                        size="sm"
                        options={qualityOptions}
                      />
                    </div>
                  )}

                  {/* Style - Uniquement pour OpenAI DALL-E 3 */}
                  {styleOptions.length > 0 && (
                    <div className="space-y-1">
                      <label className="block text-xs text-bambi-subtext">Style</label>
                      <CustomSelect
                        value={generationOptions.style}
                        onValueChange={(value: string) => setGenerationOptions(prev => ({ ...prev, style: value }))}
                        className="bg-[#222222] border-[#333333] text-white rounded-md focus:ring-1 focus:ring-bambi-accent/50 focus:border-bambi-accent transition-all duration-200"
                        size="sm"
                        options={styleOptions}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Boutons d'action */}
              <div className="bg-[#151515] p-2 rounded-lg border border-[#2A2A2A] shadow-sm">
                <div className="flex flex-col gap-2">
                  {/* Bouton Générer */}
                  <Button
                    onClick={generateImages}
                    disabled={isGenerating || !prompt.trim() || !selectedConfig || (hasGenerated && !isPromptModified())}
                    className="w-full bg-gradient-to-r from-bambi-accent to-bambi-accentDark text-white h-11 text-sm font-medium rounded-md shadow-md hover:shadow-lg transition-all duration-200 hover:brightness-110 relative overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-200"></span>
                    {isGenerating ? (
                      <>
                        <div className="flex items-center justify-center">
                          <div className="relative mr-2">
                            <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-white/50"></div>
                            </div>
                          </div>
                          <span>Création en cours...</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-1" />
                        Générer l'image
                      </>
                    )}
                  </Button>

                  {/* Bouton Régénérer - Visible uniquement si une image a déjà été générée */}
                  {hasGenerated && (
                    <Button
                      onClick={regenerateImages}
                      disabled={isGenerating}
                      className="w-full border-bambi-accent text-bambi-accent hover:bg-bambi-accent/10 h-9 text-xs font-medium rounded-md transition-all duration-200 hover:border-bambi-accent"
                      variant="outline"
                    >
                      <RefreshCwIcon className="h-4 w-4 mr-1" />
                      Régénérer
                    </Button>
                  )}

                  {/* Séparateur pour les boutons de téléchargement et partage */}
                  {selectedImage && <div className="border-t border-[#2A2A2A] my-2"></div>}

                  {/* Boutons de téléchargement et partage - Visibles uniquement si une image est sélectionnée */}
                  {selectedImage && (
                    <>
                      <Button
                        onClick={() => selectedImage && downloadImage(selectedImage)}
                        className="w-full border-[#333333] hover:bg-[#222222] text-white h-9 text-xs font-medium rounded-md transition-all duration-200"
                        variant="outline"
                      >
                        <DownloadIcon className="h-4 w-4 mr-1" />
                        Télécharger l'image
                      </Button>
                      <Button
                        onClick={() => selectedImage && shareImage(selectedImage)}
                        className="w-full border-[#333333] hover:bg-[#222222] text-white h-9 text-xs font-medium rounded-md transition-all duration-200"
                        variant="outline"
                      >
                        <ShareIcon className="h-4 w-4 mr-1" />
                        Partager l'image
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Zone d'image pour mobile - Supprimée car intégrée dans la nouvelle structure mobile */}

        {/* Galerie de miniatures pour desktop - Supprimée car déplacée sous l'image principale */}

      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 p-4 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm shadow-xl backdrop-blur-md max-w-md z-50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center">
            <div className="mr-3 text-red-500 flex-shrink-0 bg-red-500/10 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 font-medium">{error}</div>
          </div>
        </div>
      )}

      {/* Modal d'upsell pour les utilisateurs qui ont dépassé leur quota */}
      {showUpsellModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-[#333333] flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                Limite de génération atteinte
              </h2>
              <button
                onClick={closeUpsellModal}
                className="text-bambi-subtext hover:text-bambi-text p-2 rounded-full hover:bg-bambi-border/20"
                aria-label="Fermer"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="bg-gradient-to-r from-bambi-accent/20 to-bambi-accentDark/20 p-4 rounded-full mb-4">
                  <RocketIcon className="h-10 w-10 text-bambi-accent" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">Vous avez atteint votre limite mensuelle</h3>
                <p className="text-bambi-subtext text-center">
                  Vous avez utilisé vos {userQuota?.limit || 50} générations gratuites ce mois-ci.
                  Passez au plan Premium pour des générations illimitées et bien plus encore !
                </p>
              </div>

              <div className="bg-[#222222] p-4 rounded-lg mb-6">
                <h4 className="font-medium mb-2 text-white">Le plan Premium inclut :</h4>
                <ul className="space-y-2">
                  <li className="flex items-center text-bambi-subtext">
                    <div className="mr-2 text-green-500">✓</div>
                    Générations d'images illimitées
                  </li>
                  <li className="flex items-center text-bambi-subtext">
                    <div className="mr-2 text-green-500">✓</div>
                    Configurations API illimitées
                  </li>
                  <li className="flex items-center text-bambi-subtext">
                    <div className="mr-2 text-green-500">✓</div>
                    Téléchargements en haute définition
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-[#333333] flex flex-col sm:flex-row sm:justify-end gap-3">
              <Button
                variant="outline"
                onClick={closeUpsellModal}
                className="border-[#333333] hover:bg-[#222222] text-white w-full sm:w-auto order-2 sm:order-1"
              >
                Plus tard
              </Button>
              <Button
                onClick={navigateToPlans}
                className="bg-gradient-to-r from-bambi-accent to-bambi-accentDark text-white w-full sm:w-auto order-1 sm:order-2 animate-pulse-subtle"
              >
                Passer au Premium
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
