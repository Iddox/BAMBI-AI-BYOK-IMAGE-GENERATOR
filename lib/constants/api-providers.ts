/**
 * Constantes partagées pour les fournisseurs d'API et leurs modèles
 * Utilisées dans les composants de gestion des clés API
 */

// Types pour les options de sélection
export type SelectOption = {
  value: string;
  label: string;
};

// Providers disponibles
export const API_PROVIDERS: SelectOption[] = [
  { value: "openai", label: "OpenAI" },
  { value: "google", label: "Google Gemini" },
  { value: "xai", label: "xAI" },
];

// Modèles disponibles par provider
export const PROVIDER_MODELS: Record<string, SelectOption[]> = {
  openai: [
    { value: "dall-e-2", label: "DALL·E 2" },
    { value: "dall-e-3", label: "DALL·E 3" },
    { value: "gpt-image", label: "GPT Image" },
  ],
  google: [
    { value: "imagen-2", label: "Imagen 2 (via Gemini)" },
    { value: "imagen-3", label: "Imagen 3 (via Gemini)" },
  ],
  xai: [
    { value: "grok-2-image", label: "grok-2-image" },
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
