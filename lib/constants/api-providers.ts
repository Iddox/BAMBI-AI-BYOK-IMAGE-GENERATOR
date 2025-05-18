/**
 * Constantes partagées pour les fournisseurs d'API et leurs modèles
 * Utilisées dans les composants de gestion des clés API
 */

// Types pour les options de sélection
export type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

// Type pour les informations détaillées sur un modèle
export type ModelInfo = {
  value: string;
  label: string;
  description: string;
  capabilities: {
    maxResolution: string;
    formats: string[];
    supportsHD?: boolean;
    supportedAspectRatios?: string[];
    defaultAspectRatio?: string;
  };
};

// Providers disponibles
export const API_PROVIDERS: SelectOption[] = [
  {
    value: "openai",
    label: "OpenAI",
    description: "Modèles DALL-E 3 et GPT Image 1 d'OpenAI"
  },
  {
    value: "google",
    label: "Google Gemini",
    description: "Modèle Imagen 3 via l'API Gemini de Google"
  },
  {
    value: "xai",
    label: "xAI",
    description: "Modèle Grok-2-image-1212 de xAI"
  },
];

// Modèles disponibles par provider avec informations détaillées
export const PROVIDER_MODELS_INFO: Record<string, ModelInfo[]> = {
  openai: [
    {
      value: "dall-e-3",
      label: "DALL·E 3",
      description: "Modèle de génération d'images le plus avancé d'OpenAI",
      capabilities: {
        maxResolution: "1024x1024",
        formats: ["png", "jpg"],
        supportsHD: true,
        supportedAspectRatios: ["1:1", "16:9", "9:16"],
        defaultAspectRatio: "1:1"
      }
    },
    {
      value: "gpt-image-1",
      label: "GPT Image 1",
      description: "Nouveau modèle de génération d'images basé sur GPT",
      capabilities: {
        maxResolution: "1024x1024",
        formats: ["png"],
        supportsHD: true,
        supportedAspectRatios: ["1:1", "16:9", "9:16"],
        defaultAspectRatio: "1:1"
      }
    }
  ],
  google: [
    {
      value: "imagen-3",
      label: "Imagen 3 (via Gemini)",
      description: "Modèle de génération d'images de Google via l'API Gemini",
      capabilities: {
        maxResolution: "1024x1024",
        formats: ["png"],
        supportsHD: false,
        supportedAspectRatios: ["1:1", "16:9", "9:16", "3:4", "4:3"],
        defaultAspectRatio: "1:1"
      }
    }
  ],
  xai: [
    {
      value: "grok-2-image-1212",
      label: "Grok-2-image-1212",
      description: "Modèle de génération d'images de xAI",
      capabilities: {
        maxResolution: "1024x1024",
        formats: ["png"],
        supportsHD: false,
        supportedAspectRatios: ["1:1"],
        defaultAspectRatio: "1:1"
      }
    }
  ]
};

// Version simplifiée pour les sélecteurs
export const PROVIDER_MODELS: Record<string, SelectOption[]> = {
  openai: [
    { value: "dall-e-3", label: "DALL·E 3" },
    { value: "gpt-image-1", label: "GPT Image 1" },
  ],
  google: [
    { value: "imagen-3", label: "Imagen 3 (via Gemini)" },
  ],
  xai: [
    { value: "grok-2-image-1212", label: "Grok-2-image-1212" },
  ],
};

// Fonction utilitaire pour obtenir le label d'un provider
export function getProviderLabel(providerValue: string): string {
  const provider = API_PROVIDERS.find(p => p.value === providerValue);
  return provider?.label || providerValue;
}

// Fonction utilitaire pour obtenir le label d'un modèle
export function getModelLabel(providerValue: string, modelValue: string): string {
  const models = PROVIDER_MODELS[providerValue] || [];
  const model = models.find(m => m.value === modelValue);
  return model?.label || modelValue;
}

// Fonction utilitaire pour obtenir les informations détaillées d'un modèle
export function getModelInfo(providerValue: string, modelValue: string): ModelInfo | undefined {
  const models = PROVIDER_MODELS_INFO[providerValue] || [];
  return models.find(m => m.value === modelValue);
}

// Fonction utilitaire pour obtenir les capacités d'un modèle
export function getModelCapabilities(providerValue: string, modelValue: string): ModelInfo['capabilities'] | undefined {
  const modelInfo = getModelInfo(providerValue, modelValue);
  return modelInfo?.capabilities;
}

// Fonction utilitaire pour obtenir les résolutions supportées par un modèle
export function getSupportedResolutions(providerValue: string, modelValue: string): string[] {
  const capabilities = getModelCapabilities(providerValue, modelValue);
  if (!capabilities) return ["1024x1024"];

  const { maxResolution, supportedAspectRatios = ["1:1"] } = capabilities;

  // Extraire les dimensions maximales
  const [maxWidth, maxHeight] = maxResolution.split('x').map(Number);

  // Générer les résolutions supportées en fonction des ratios
  return supportedAspectRatios.map(ratio => {
    const [width, height] = ratio.split(':').map(Number);
    const aspectRatio = width / height;

    if (aspectRatio > 1) {
      // Paysage
      return `${maxWidth}x${Math.floor(maxWidth / aspectRatio)}`;
    } else if (aspectRatio < 1) {
      // Portrait
      return `${Math.floor(maxHeight * aspectRatio)}x${maxHeight}`;
    } else {
      // Carré
      return maxResolution;
    }
  });
}
