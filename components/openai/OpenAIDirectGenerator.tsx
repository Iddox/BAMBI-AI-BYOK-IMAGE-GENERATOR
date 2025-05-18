"use client";

import { useState, useRef } from "react";
import { Loader2, ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { encrypt } from "@/utils/encryption";

/**
 * Composant pour générer des images directement avec l'API OpenAI via notre API proxy
 * Ce composant ne dépend pas de la base de données ou d'autres services
 */
export function OpenAIDirectGenerator() {
  // États
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  const [returnBase64, setReturnBase64] = useState(false);
  const [encryptedApiKey, setEncryptedApiKey] = useState<string | null>(null);
  const [model, setModel] = useState("dall-e-3");
  const [size, setSize] = useState("1024x1024");
  const [quality, setQuality] = useState("standard");
  const [style, setStyle] = useState("vivid");

  // Référence pour faire défiler jusqu'aux images générées
  const imagesContainerRef = useRef<HTMLDivElement>(null);

  // Fonction pour valider la clé API
  const validateApiKey = async () => {
    if (!apiKey.trim()) return;

    setIsValidating(true);
    setError(null);
    setValidationMessage("");
    setIsKeyValid(null);

    try {
      // Appel à notre API proxy pour valider la clé API
      const response = await fetch("/api/openai-validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();

      if (response.ok && data.isValid) {
        setIsKeyValid(true);
        setValidationMessage(data.message || "Clé API OpenAI validée avec succès");

        // Chiffrer la clé API pour une utilisation ultérieure
        const encrypted = encrypt(apiKey);
        setEncryptedApiKey(encrypted);
      } else {
        setIsKeyValid(false);
        setValidationMessage(data.error || "Clé API OpenAI invalide");
      }
    } catch (err: any) {
      setIsKeyValid(false);
      setError("Erreur lors de la validation de la clé API: " + err.message);
    } finally {
      setIsValidating(false);
    }
  };

  // Fonction pour générer des images
  const generateImages = async () => {
    if (!apiKey.trim() || !prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      // Appel à notre API proxy réelle pour générer des images (consomme des crédits OpenAI)
      const response = await fetch("/api/openai-direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey,
          prompt,
          count,
          returnBase64,
          model,
          size,
          quality,
          style
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la génération d'images");
      }

      const data = await response.json();

      if (!data.images || data.images.length === 0) {
        throw new Error("Aucune image générée");
      }

      setGeneratedImages(data.images);

      // Faire défiler jusqu'aux images générées
      if (imagesContainerRef.current) {
        imagesContainerRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Générateur d'images OpenAI Direct</CardTitle>
          <CardDescription>
            Générez des images directement avec l'API OpenAI sans passer par la base de données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Section de configuration de l'API */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Configuration de l'API</h3>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Entrez votre clé API OpenAI"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={validateApiKey}
                disabled={isValidating || !apiKey.trim()}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validation...
                  </>
                ) : (
                  "Valider la clé"
                )}
              </Button>
            </div>

            {/* Message de validation */}
            {isKeyValid !== null && (
              <div
                className={`p-3 rounded-md ${
                  isKeyValid
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {isKeyValid ? (
                  <CheckCircle className="inline-block mr-2 h-4 w-4" />
                ) : (
                  <AlertCircle className="inline-block mr-2 h-4 w-4" />
                )}
                {validationMessage}
              </div>
            )}
          </div>

          {/* Section de génération d'image */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Génération d'image</h3>
            <Textarea
              placeholder="Décrivez l'image que vous souhaitez générer..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full"
            />

            {/* Options de génération */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Modèle</label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un modèle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dall-e-3">DALL-E 3</SelectItem>
                    <SelectItem value="gpt-image-1">GPT Image 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Taille</label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une taille" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024x1024">1024x1024</SelectItem>
                    <SelectItem value="1792x1024">1792x1024</SelectItem>
                    <SelectItem value="1024x1792">1024x1792</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Qualité</label>
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une qualité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="hd">HD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Style</label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vivid">Vivid</SelectItem>
                    <SelectItem value="natural">Natural</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Nombre d'images</label>
                <Select
                  value={count.toString()}
                  onValueChange={(value) => setCount(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nombre d'images" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 image</SelectItem>
                    <SelectItem value="2">2 images</SelectItem>
                    <SelectItem value="3">3 images</SelectItem>
                    <SelectItem value="4">4 images</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Format de réponse</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="returnBase64"
                    checked={returnBase64}
                    onChange={(e) => setReturnBase64(e.target.checked)}
                  />
                  <label htmlFor="returnBase64">Base64 (au lieu d'URL)</label>
                </div>
              </div>
            </div>

            <Button
              onClick={generateImages}
              disabled={isGenerating || !isKeyValid || !prompt.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Générer {count > 1 ? `${count} images` : "une image"}
                </>
              )}
            </Button>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded-md">
              <AlertCircle className="inline-block mr-2 h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section des images générées */}
      {generatedImages.length > 0 && (
        <div ref={imagesContainerRef} className="space-y-4">
          <h2 className="text-2xl font-bold">Images générées</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedImages.map((imageUrl, index) => (
              <div
                key={index}
                className="border rounded-lg overflow-hidden shadow-md"
              >
                <img
                  src={imageUrl}
                  alt={`Image générée ${index + 1}`}
                  className="w-full h-auto"
                />
                <div className="p-3 bg-gray-50">
                  <p className="text-sm text-gray-600">
                    Image {index + 1} générée avec {model}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
