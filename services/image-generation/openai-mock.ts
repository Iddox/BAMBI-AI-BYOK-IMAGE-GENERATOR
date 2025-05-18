import {
  ImageGenerationService,
  ImageGenerationOptions,
  ImageGenerationResult,
  ApiKeyValidationResult
} from './base';

/**
 * Service de génération d'images simulé pour OpenAI
 * Utilisé pour tester l'intégration sans consommer de crédits
 */
export class OpenAIMockService implements ImageGenerationService {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.model = 'dall-e-3'; // Modèle par défaut
  }

  /**
   * Génère des images à partir d'un prompt
   * @param prompt Description de l'image à générer
   * @param options Options de génération
   * @returns Images générées
   */
  async generateImages(
    prompt: string,
    options: ImageGenerationOptions = {}
  ): Promise<ImageGenerationResult> {
    try {
      // Simuler un délai pour rendre l'expérience plus réaliste
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Paramètres par défaut
      const {
        count = 1,
        size = '1024x1024',
        quality = 'standard',
        style = 'vivid',
        additionalParams = {}
      } = options;

      // Vérifier que le prompt est valide
      if (!prompt || typeof prompt !== 'string') {
        throw new Error('Prompt manquant ou invalide');
      }

      // Récupérer le modèle des paramètres additionnels s'il existe
      const model = additionalParams.model || this.model;

      // Limiter le nombre d'images en fonction du modèle
      const numImages = model === 'dall-e-3' ? 1 : Math.min(Number(count), 4);

      // Images de démonstration (URLs d'images réelles pour une meilleure expérience)
      // Utiliser des images statiques hébergées sur des CDN fiables pour éviter les problèmes de CORS
      // Utiliser des URLs d'images fixes pour éviter les problèmes de cache et de redirection
      const mockImages = [
        'https://i.imgur.com/jNNT4ew.jpg', // Image fixe 1
        'https://i.imgur.com/L7Lv8Nd.jpg', // Image fixe 2
        'https://i.imgur.com/vxAXP9J.jpg', // Image fixe 3
        'https://i.imgur.com/D4ZV27q.jpg'  // Image fixe 4
      ];

      // Utiliser les images telles quelles sans ajouter de texte
      const images = mockImages.slice(0, numImages);

      console.log(`OpenAIMockService - Génération de ${numImages} images simulées`);
      console.log(`OpenAIMockService - URLs des images: ${JSON.stringify(images)}`);

      // Créer le résultat de génération d'images
      return {
        imageUrls: images,
        metadata: {
          prompt,
          model,
          size,
          quality,
          style,
          isMock: true
        },
        rawResponse: {
          created: Date.now(),
          data: images.map(url => ({ url }))
        }
      };
    } catch (error) {
      console.error('OpenAIMockService - Erreur lors de la génération d\'images:', error);
      throw error;
    }
  }

  /**
   * Valide la clé API
   * @param apiKey Clé API à valider
   * @returns Résultat de la validation
   */
  async validateApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
    try {
      console.log('OpenAIMockService - Validation de la clé API (mode simulation)');

      // Simuler un délai pour rendre l'expérience plus réaliste
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Vérification basique du format
      const isValid = apiKey.startsWith('sk-');

      console.log(`OpenAIMockService - Résultat de la validation: ${isValid ? 'valide' : 'invalide'}`);

      return {
        isValid,
        message: isValid
          ? 'Clé API OpenAI valide (mode simulation)'
          : 'Clé API OpenAI invalide (doit commencer par sk-)',
        details: {
          isMock: true,
          models: ['dall-e-3', 'gpt-image-1']
        }
      };
    } catch (error) {
      console.error('OpenAIMockService - Erreur lors de la validation de la clé API:', error);
      throw error;
    }
  }
}
