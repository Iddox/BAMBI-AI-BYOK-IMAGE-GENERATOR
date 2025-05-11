"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DownloadIcon,
  ShareIcon,
  RefreshCwIcon,
  Loader2Icon,
  PlusIcon,
  SparklesIcon,
  InfoIcon,
  AlertCircleIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CustomSelect } from "@/components/ui/custom-select";
import { useApiConfig, ApiConfig as ApiConfigType } from "@/contexts/ApiConfigContext";

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
  const [imageCount, setImageCount] = useState<number>(4);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false); // Pour suivre si une première génération a été effectuée
  const [showConfigInfo, setShowConfigInfo] = useState(false); // Pour afficher les infos de configuration

  // Détection du mode mobile
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Référence pour le conteneur principal
  const containerRef = useRef<HTMLDivElement>(null);

  // Options pour le sélecteur du nombre d'images
  const imageCountOptions = [
    { value: "1", label: "1 image" },
    { value: "2", label: "2 images" },
    { value: "4", label: "4 images" },
    { value: "9", label: "9 images" }
  ];

  // Sélectionner automatiquement la première configuration disponible au chargement
  useEffect(() => {
    if (configs.length > 0 && !selectedConfig) {
      // Prendre la première configuration disponible
      setSelectedConfig(configs[0].id);
    }
  }, [configs, selectedConfig]);

  // Fonction pour naviguer vers la page des clés API
  const navigateToApiKeys = () => {
    router.push("/api-keys");
  };

  // Fonction pour vérifier si le prompt a été modifié depuis la dernière génération
  const isPromptModified = () => {
    return prompt !== initialPrompt;
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

    setError(null);
    setIsGenerating(true);
    setInitialPrompt(prompt); // Enregistrer le prompt utilisé pour cette génération

    try {
      // Simulation de génération d'images (à remplacer par l'appel API réel)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Exemple de résultats (à remplacer par les résultats réels)
      const newImage: GeneratedImage = {
        id: `img-${Date.now()}`,
        url: `https://picsum.photos/seed/${Date.now()}/1024/1024`,
        prompt,
        timestamp: new Date(),
      };

      // Générer des variations en fonction du nombre d'images sélectionné
      const variations: GeneratedImage[] = Array.from({ length: imageCount - 1 }, (_, i) => ({
        id: `img-var-${Date.now()}-${i}`,
        url: `https://picsum.photos/seed/${Date.now() + i + 100}/512/512`,
        prompt,
        timestamp: new Date(),
      }));

      const allImages = [newImage, ...variations];
      setGeneratedImages(allImages);
      setSelectedImage(newImage);
      setHasGenerated(true); // Marquer qu'une génération a été effectuée
    } catch (err) {
      setError("Erreur lors de la génération. Veuillez réessayer.");
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

    setError(null);
    setIsGenerating(true);

    try {
      // Simulation de génération d'images (à remplacer par l'appel API réel)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Exemple de résultats (à remplacer par les résultats réels)
      const newImage: GeneratedImage = {
        id: `img-${Date.now()}`,
        url: `https://picsum.photos/seed/${Date.now()}/1024/1024`,
        prompt: initialPrompt,
        timestamp: new Date(),
      };

      // Générer des variations en fonction du nombre d'images sélectionné
      const variations: GeneratedImage[] = Array.from({ length: imageCount - 1 }, (_, i) => ({
        id: `img-var-${Date.now()}-${i}`,
        url: `https://picsum.photos/seed/${Date.now() + i + 100}/512/512`,
        prompt: initialPrompt,
        timestamp: new Date(),
      }));

      const allImages = [newImage, ...variations];
      setGeneratedImages(allImages);
      setSelectedImage(newImage);
    } catch (err) {
      setError("Erreur lors de la régénération. Veuillez réessayer.");
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
                       config.model === "grok-2-image" ? "grok-2-image" :
                       config.model;

    return (
      <div className="mt-1 text-xs text-bambi-subtext bg-[#222222]/50 p-2 rounded-md">
        <p><span className="font-medium">Fournisseur:</span> {providerLabel}</p>
        <p><span className="font-medium">Modèle:</span> {modelLabel}</p>
        <p><span className="font-medium">Nom:</span> {config.name}</p>
        {/* Aucun indicateur de profil par défaut n'est nécessaire */}
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
                  onChange={(e) => setPrompt(e.target.value)}
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-bambi-accent hover:bg-bambi-accent/10 h-5 px-1 transition-all duration-200 border-bambi-accent/30 hover:border-bambi-accent"
                    onClick={navigateToApiKeys}
                    title="Ajouter une nouvelle configuration API"
                  >
                    <PlusIcon className="h-3 w-3" />
                  </Button>
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

                      return {
                        value: config.id,
                        label: `${config.name} (${providerLabel})`
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
                  value={imageCount.toString()}
                  onValueChange={(value: string) => setImageCount(parseInt(value))}
                  className="bg-[#222222] border-[#333333] text-white rounded-md focus:ring-1 focus:ring-bambi-accent/50 focus:border-bambi-accent transition-all duration-200"
                  size="sm"
                  options={imageCountOptions}
                />
              </div>

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
                      <Loader2Icon className="h-3.5 w-3.5 animate-spin mr-1" />
                      Génération...
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
                      className={`h-14 w-14 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all duration-300 ${
                        selectedImage?.id === image.id
                          ? "border-bambi-accent shadow-[0_0_10px_rgba(123,92,250,0.4)]"
                          : "border-transparent hover:border-bambi-accent/50"
                      }`}
                      onClick={() => setSelectedImage(image)}
                    >
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
                  <div className="text-center p-3 bg-[#1A1A1A]/70 border border-[#333333] rounded-lg shadow-lg backdrop-blur-sm z-10 transition-all duration-300">
                    <div className="animate-pulse-subtle mb-2">
                      <div className="h-8 w-8 mx-auto border-t-2 border-b-2 border-bambi-accent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-bambi-text text-xs font-medium">Génération en cours...</p>
                    <p className="text-bambi-subtext text-xs mt-1">Cela peut prendre quelques instants</p>
                  </div>
                ) : selectedImage ? (
                  <div className="w-full flex items-center justify-center">
                    <div className="relative">
                      <img
                        src={selectedImage.url}
                        alt={selectedImage.prompt}
                        className="max-w-full w-auto object-contain rounded-md shadow-md"
                        style={{ maxHeight: 'min(75vh, 700px)' }}
                      />
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
              <div className="text-center p-6 bg-[#1A1A1A]/70 border border-[#333333] rounded-lg shadow-lg backdrop-blur-sm z-10 transition-all duration-300">
                <div className="animate-pulse-subtle mb-3">
                  <div className="h-14 w-14 mx-auto border-t-2 border-b-2 border-bambi-accent rounded-full animate-spin"></div>
                </div>
                <p className="text-bambi-text text-base font-medium">Génération en cours...</p>
                <p className="text-bambi-subtext text-xs mt-2">Cela peut prendre quelques instants</p>
              </div>
            ) : selectedImage ? (
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-bambi-accent/20 to-bambi-accentDark/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                <div className="relative">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.prompt}
                    className="w-[500px] h-[500px] object-contain rounded-md shadow-md transition-all duration-300"
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
                  className={`h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all duration-300 hover:shadow-lg group ${
                    selectedImage?.id === image.id
                      ? "border-bambi-accent shadow-[0_0_15px_rgba(123,92,250,0.4)]"
                      : "border-transparent hover:border-bambi-accent/50"
                  }`}
                  onClick={() => setSelectedImage(image)}
                >
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

                      return {
                        value: config.id,
                        label: `${config.name} (${providerLabel})`
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
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Soyez précis et détaillé dans votre description..."
                  className="bg-[#222222] border-[#333333] text-white h-[90px] resize-none text-xs p-2 rounded-md focus:ring-1 focus:ring-bambi-accent/50 focus:border-bambi-accent transition-all duration-200"
                />
              </div>

              {/* Nombre d'images */}
              <div className="bg-[#151515] p-2 rounded-lg border border-[#2A2A2A] shadow-sm">
                <label className="block text-xs font-medium mb-1 text-bambi-text">Nombre d'images</label>
                <CustomSelect
                  value={imageCount.toString()}
                  onValueChange={(value: string) => setImageCount(parseInt(value))}
                  className="bg-[#222222] border-[#333333] text-white rounded-md focus:ring-1 focus:ring-bambi-accent/50 focus:border-bambi-accent transition-all duration-200"
                  size="sm"
                  options={imageCountOptions}
                />
              </div>

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
                        <Loader2Icon className="h-4 w-4 animate-spin mr-1" />
                        Génération en cours...
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
    </div>
  );
}
