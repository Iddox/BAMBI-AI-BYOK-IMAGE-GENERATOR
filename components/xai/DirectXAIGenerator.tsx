"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ImageIcon, CheckCircle, AlertCircle, Copy, Download } from "lucide-react";
import CryptoJS from 'crypto-js';

/**
 * Composant pour générer des images directement avec l'API xAI
 * Ce composant ne dépend pas de la base de données ou d'autres services
 */

// Clé de chiffrement côté client (pour la démonstration uniquement)
// Dans un environnement de production, utilisez une clé sécurisée stockée dans les variables d'environnement
const CLIENT_ENCRYPTION_KEY = "bambi-ai-xai-client-key-2025";

// Fonction pour chiffrer une chaîne
const encrypt = (text: string): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(text, CLIENT_ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error("Erreur lors du chiffrement:", error);
    return "";
  }
};

// Fonction pour déchiffrer une chaîne
const decrypt = (encryptedText: string): string => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, CLIENT_ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error("Erreur lors du déchiffrement:", error);
    return "";
  }
};
export function DirectXAIGenerator() {
  // États
  const [apiKey, setApiKey] = useState("");
  const [encryptedApiKey, setEncryptedApiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  const [returnBase64, setReturnBase64] = useState(false);

  // Référence pour le conteneur d'images
  const imagesContainerRef = useRef<HTMLDivElement>(null);

  // Fonction pour valider la clé API
  const validateApiKey = async () => {
    if (!apiKey.trim()) {
      setError("Veuillez saisir une clé API");
      return;
    }

    setIsValidating(true);
    setError(null);
    setValidationMessage("");
    setIsKeyValid(null);

    try {
      // Chiffrer la clé API pour la stocker en mémoire
      const encrypted = encrypt(apiKey);
      setEncryptedApiKey(encrypted);

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

        setIsKeyValid(true);
        setValidationMessage(`Clé API valide. Modèles disponibles: ${models.join(", ")}`);

        if (!hasImageModel) {
          setValidationMessage(prev => `${prev}\nAttention: Le modèle grok-2-image-1212 n'est pas disponible.`);
        }
      } else {
        const errorData = await response.json();
        setIsKeyValid(false);
        setValidationMessage(`Clé API invalide: ${errorData.error?.message || "Erreur inconnue"}`);
      }
    } catch (err: any) {
      setIsKeyValid(false);
      setValidationMessage(`Erreur lors de la validation: ${err.message}`);
      setError(err.message);
    } finally {
      setIsValidating(false);
    }
  };

  // Fonction pour générer des images
  const generateImages = async () => {
    if (!encryptedApiKey) {
      setError("Veuillez d'abord valider votre clé API");
      return;
    }

    if (!prompt.trim()) {
      setError("Veuillez saisir un prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      // Déchiffrer la clé API
      const decryptedKey = decrypt(encryptedApiKey);

      // Préparer les paramètres de la requête
      const requestBody = {
        model: "grok-2-image-1212",
        prompt,
        n: Math.min(count, 10), // Maximum 10 images par requête
        response_format: returnBase64 ? "b64_json" : "url"
      };

      // Utiliser TextEncoder pour encoder le corps de la requête en UTF-8
      const encoder = new TextEncoder();
      const encodedBody = encoder.encode(JSON.stringify(requestBody));

      // Appel direct à l'API xAI pour générer des images
      const response = await fetch("https://api.x.ai/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${decryptedKey}`,
          "X-API-Key": decryptedKey
        },
        body: encodedBody
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erreur lors de la génération d'images");
      }

      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        throw new Error("Aucune image générée");
      }

      // Extraire les URLs des images
      const imageUrls = data.data.map((image: any) =>
        returnBase64
          ? `data:image/jpeg;base64,${image.b64_json}`
          : image.url
      );

      setGeneratedImages(imageUrls);

      // Faire défiler jusqu'aux images générées
      if (imagesContainerRef.current) {
        imagesContainerRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err: any) {
      console.error("Erreur lors de la génération d'images:", err);
      setError(err.message || "Erreur lors de la génération d'images");
    } finally {
      setIsGenerating(false);
    }
  };

  // Fonction pour copier l'URL d'une image
  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        alert("URL copiée dans le presse-papiers");
      })
      .catch(err => {
        console.error("Erreur lors de la copie de l'URL:", err);
      });
  };

  // Fonction pour télécharger une image
  const downloadImage = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `xai-image-${Date.now()}-${index}.jpeg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Erreur lors du téléchargement de l'image:", err);
      alert("Erreur lors du téléchargement de l'image");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Générateur d'images xAI Direct</CardTitle>
          <CardDescription>
            Générez des images directement avec l'API xAI sans passer par la base de données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Section de configuration de l'API */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Configuration de l'API</h3>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Entrez votre clé API xAI"
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

            {isKeyValid !== null && (
              <div className={`p-3 rounded-md ${isKeyValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {isKeyValid ? (
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5" />
                    <div className="whitespace-pre-line">{validationMessage}</div>
                  </div>
                ) : (
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
                    <div>{validationMessage}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section de génération d'images */}
          <div className="space-y-2 pt-4">
            <h3 className="text-lg font-medium">Génération d'images</h3>
            <Textarea
              placeholder="Décrivez l'image que vous souhaitez générer..."
              value={prompt}
              onChange={(e) => {
                // Nettoyer le prompt pour xAI en temps réel
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
              }}
              rows={4}
              className="w-full"
            />

            <div className="flex flex-wrap gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Nombre d'images</label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value={1}>1 image</option>
                  <option value={2}>2 images</option>
                  <option value={4}>4 images</option>
                </select>
              </div>

              <div className="space-y-1 w-full">
                <div className="p-2 bg-amber-50 text-amber-800 rounded-md text-xs">
                  <p className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    Utilisez uniquement des caractères ASCII standard (sans accents, émojis ou caractères spéciaux)
                  </p>
                </div>
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
              disabled={isGenerating || !encryptedApiKey || !prompt.trim()}
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

            {error && (
              <div className="p-3 bg-red-100 text-red-800 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
                  <div>{error}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Affichage des images générées */}
      {generatedImages.length > 0 && (
        <div ref={imagesContainerRef} className="space-y-4">
          <h2 className="text-xl font-bold">Images générées</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedImages.map((imageUrl, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="relative aspect-square">
                  <img
                    src={imageUrl}
                    alt={`Image générée ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardFooter className="flex justify-between p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyImageUrl(imageUrl)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copier l'URL
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadImage(imageUrl, index)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
