import { createServerSupabaseClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/utils/encryption';
import { createImageGenerationService } from '@/services/image-generation/factory';
import { ImageGenerationError, ImageGenerationErrorType } from '@/services/image-generation/base';
import { sanitizePrompt } from '@/utils/text-sanitizer';

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();

  // Vérifier l'authentification
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { prompt, configurationId, model = 'dall-e-3', size = '1024x1024' } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt requis' }, { status: 400 });
    }

    if (!configurationId) {
      return NextResponse.json({ error: 'Configuration API requise' }, { status: 400 });
    }

    // Vérifier les quotas de l'utilisateur
    const { data: quota, error: quotaError } = await supabase
      .from('user_quotas')
      .select('monthly_generations_used, monthly_generations_limit')
      .eq('user_id', session.user.id)
      .single();

    if (quotaError && quotaError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Erreur lors de la vérification des quotas' }, { status: 500 });
    }

    // Si l'utilisateur n'a pas encore de quota, en créer un
    if (!quota) {
      const { error: createQuotaError } = await supabase
        .from('user_quotas')
        .insert({
          user_id: session.user.id,
          monthly_generations_used: 0,
          monthly_generations_limit: 50, // Limite par défaut pour les utilisateurs gratuits
        });

      if (createQuotaError) {
        return NextResponse.json({ error: 'Erreur lors de la création des quotas' }, { status: 500 });
      }
    }

    // Vérifier si l'utilisateur a un abonnement premium
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('status')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single();

    const isPremium = !!subscription;

    // Vérifier si l'utilisateur a dépassé son quota
    if (!isPremium && quota && quota.monthly_generations_used >= quota.monthly_generations_limit) {
      return NextResponse.json({ error: 'Quota mensuel dépassé' }, { status: 403 });
    }

    // Récupérer la configuration API avec jointure pour obtenir les informations du fournisseur en une seule requête
    console.log("generate-image - Récupération de la configuration API:", configurationId);

    const { data: config, error: configError } = await supabase
      .from('api_configurations')
      .select(`
        id,
        api_key,
        user_id,
        provider_id,
        model,
        is_valid,
        status,
        api_providers (
          id,
          name,
          slug,
          api_base_url
        )
      `)
      .eq('id', configurationId)
      .single();

    console.log("generate-image - Résultat de la requête:", configError ? "Erreur" : "Succès");

    if (configError || !config) {
      console.error('Erreur lors de la récupération de la configuration API:', configError);
      return NextResponse.json({
        error: 'Configuration non trouvée',
        details: {
          configId: configurationId,
          errorCode: configError?.code,
          errorMessage: configError?.message
        }
      }, { status: 404 });
    }

    // Vérifier que la configuration appartient à l'utilisateur actuel
    if (config.user_id !== session.user.id) {
      console.error('Tentative d\'accès à une configuration appartenant à un autre utilisateur:', {
        configUserId: config.user_id,
        sessionUserId: session.user.id
      });
      return NextResponse.json({
        error: 'Vous n\'êtes pas autorisé à utiliser cette configuration',
        details: {
          configId: configurationId
        }
      }, { status: 403 });
    }

    // Vérifier que la configuration est valide
    if (config.status === 'invalid' || config.is_valid === false) {
      console.warn('Tentative d\'utilisation d\'une configuration invalide:', {
        configId: configurationId,
        status: config.status,
        isValid: config.is_valid
      });
      // On permet quand même l'utilisation, mais on log un avertissement
    }

    // Vérifier que le fournisseur est correctement récupéré
    if (!config.api_providers) {
      console.error('Fournisseur API non trouvé dans la configuration:', config);

      // Tentative de récupération du fournisseur dans une requête séparée
      const { data: provider, error: providerError } = await supabase
        .from('api_providers')
        .select(`
          id,
          name,
          slug
        `)
        .eq('id', config.provider_id)
        .single();

      if (providerError || !provider) {
        console.error('Erreur lors de la récupération du fournisseur API:', providerError);
        return NextResponse.json({
          error: 'Fournisseur API non trouvé. Veuillez vérifier votre configuration et réessayer.',
          details: {
            configId: configurationId,
            providerId: config.provider_id,
            errorCode: providerError?.code,
            errorMessage: providerError?.message
          }
        }, { status: 404 });
      }

      console.log("generate-image - Fournisseur récupéré séparément:", provider);

      // Ajouter le fournisseur à la configuration
      config.api_providers = provider;
    } else {
      console.log("generate-image - Fournisseur récupéré avec la configuration:", config.api_providers);
    }

    // Extraire le fournisseur pour faciliter l'accès et ajouter les URL d'API manquantes
    const provider = config.api_providers;

    // Ajouter les URL d'API par défaut si elles sont manquantes
    // Ces URL sont normalement stockées dans la base de données, mais nous les ajoutons ici en cas d'absence
    if (!provider.api_base_url) {
      console.log("generate-image - URL d'API manquante, utilisation d'une valeur par défaut pour", provider.slug);

      switch (provider.slug) {
        case 'openai':
          provider.api_base_url = 'https://api.openai.com/v1';
          break;
        case 'google':
        case 'gemini':
          provider.api_base_url = 'https://generativelanguage.googleapis.com/v1';
          break;
        case 'xai':
          provider.api_base_url = 'https://api.x.ai/v1';
          break;
        default:
          console.warn("generate-image - Aucune URL d'API par défaut disponible pour", provider.slug);
      }
    }

    // Vérifier que la configuration appartient à l'utilisateur actuel
    if (config.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Vous n\'êtes pas autorisé à utiliser cette configuration' }, { status: 403 });
    }

    // Déchiffrer la clé API avec gestion des erreurs
    let apiKey;
    try {
      apiKey = decrypt(config.api_key);

      // Vérifier si la clé API est vide après déchiffrement
      if (!apiKey) {
        console.error('Clé API vide après déchiffrement pour la configuration:', configurationId);

        // Tentative de récupération - utiliser la clé API chiffrée directement
        console.log('Tentative de récupération - utilisation de la clé API chiffrée directement');
        apiKey = config.api_key;

        // Si c'est toujours vide, renvoyer une erreur
        if (!apiKey) {
          return NextResponse.json({
            error: 'Erreur de déchiffrement de la clé API. Veuillez reconfigurer votre clé.',
            details: {
              configId: configurationId,
              provider: provider.slug
            }
          }, { status: 400 });
        }
      }

      // Nettoyage spécifique pour chaque fournisseur
      if (provider.slug === 'openai') {
        // Pour OpenAI, s'assurer que la clé commence par sk-
        if (!apiKey.startsWith('sk-')) {
          console.warn('La clé API OpenAI ne commence pas par sk-');
        }

        // Nettoyer la clé API pour OpenAI - conserver uniquement les caractères valides
        apiKey = apiKey.replace(/[^\w\-]/g, '');

        // Afficher les premiers et derniers caractères de la clé pour le débogage
        console.log(`generate-image - Clé API OpenAI: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`);
      } else if (provider.slug === 'xai') {
        // Pour xAI, nettoyer la clé API comme dans les autres implémentations
        apiKey = apiKey.replace(/[^\x20-\x7E]/g, '');

        // Afficher les premiers et derniers caractères de la clé pour le débogage
        console.log(`generate-image - Clé API xAI: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`);
      }

      // Vérifier la longueur de la clé API après nettoyage
      if (apiKey.length < 10) {
        console.error(`generate-image - Clé API trop courte après nettoyage: ${apiKey.length} caractères`);
        return NextResponse.json({
          error: 'Clé API invalide après nettoyage. Veuillez reconfigurer votre clé.',
          details: {
            configId: configurationId,
            provider: provider.slug,
            keyLength: apiKey.length
          }
        }, { status: 400 });
      }
    } catch (decryptError) {
      console.error('Erreur lors du déchiffrement de la clé API:', decryptError);
      return NextResponse.json({
        error: 'Erreur de déchiffrement de la clé API. Veuillez reconfigurer votre clé.',
        details: {
          configId: configurationId,
          provider: provider.slug,
          message: decryptError instanceof Error ? decryptError.message : 'Erreur inconnue'
        }
      }, { status: 400 });
    }

    let imageUrls: string[] = [];

    try {
      // Créer le service en fonction du fournisseur
      if (!provider.slug) {
        console.error('Slug du fournisseur manquant:', provider);
        return NextResponse.json({
          error: 'Configuration du fournisseur API incomplète. Veuillez vérifier votre configuration.',
          details: {
            provider: provider
          }
        }, { status: 400 });
      }

      console.log(`generate-image - Création du service pour le fournisseur: ${provider.slug}`);

      // Vérifier que la clé API est présente
      if (!apiKey) {
        console.error('Clé API manquante pour la configuration:', configurationId);
        return NextResponse.json({
          error: 'Clé API manquante. Veuillez vérifier votre configuration.',
          details: {
            configId: configurationId,
            provider: provider.slug
          }
        }, { status: 400 });
      }

      // Utiliser le service réel pour OpenAI pour détecter les erreurs de crédit
      // Le mode simulation est complètement désactivé pour avoir un setup aussi réaliste que xAI
      const useMock = false;
      const imageService = createImageGenerationService(provider.slug, apiKey, provider.api_base_url, useMock);
      console.log(`generate-image - Service créé pour ${provider.slug} avec URL de base: ${provider.api_base_url}, mode simulation: ${useMock}`);

      // Préparer les options de génération
      let generationOptions = {
        count: 2, // Générer 2 images par défaut
        size,
        additionalParams: {}
      };

      // Ajuster les options en fonction du fournisseur
      if (provider.slug === 'xai') {
        console.log("generate-image - Ajustement des options pour xAI");
        // Pour xAI, on force le modèle à grok-2-image-1212 et on ignore les autres options
        generationOptions = {
          ...generationOptions,
          model: 'grok-2-image-1212', // Modèle fixe pour xAI
          // Les paramètres size, quality et style sont ignorés par l'API xAI
        };
      } else if (provider.slug === 'openai') {
        console.log("generate-image - Ajustement des options pour OpenAI");
        // Pour OpenAI, utiliser le modèle de la configuration ou celui fourni
        const openaiModel = config.model || model || 'dall-e-3';

        // Vérifier que le modèle est valide pour OpenAI
        const validOpenAIModels = ['dall-e-2', 'dall-e-3', 'gpt-image-1'];
        if (!validOpenAIModels.includes(openaiModel)) {
          console.warn(`Modèle OpenAI non reconnu: ${openaiModel}, utilisation de dall-e-3 par défaut`);
          generationOptions.model = 'dall-e-3';
        } else {
          generationOptions.model = openaiModel;
        }

        // Ajouter les options spécifiques à OpenAI
        if (openaiModel === 'dall-e-3') {
          generationOptions.quality = 'standard';
          generationOptions.style = 'vivid';
        }
      } else if (provider.slug === 'google' || provider.slug === 'gemini') {
        console.log("generate-image - Ajustement des options pour Google/Gemini");
        // Pour Google/Gemini, utiliser le modèle de la configuration ou celui fourni
        generationOptions.model = config.model || model || 'imagen-3';
      } else {
        // Pour les autres fournisseurs, utiliser le modèle de la configuration ou celui fourni
        generationOptions.model = config.model || model;
      }

      console.log(`generate-image - Options de génération: ${JSON.stringify(generationOptions)}`);

      // Sanitiser le prompt pour éviter les problèmes d'encodage
      // Pour xAI, on applique une sanitisation plus stricte pour éviter les problèmes d'encodage
      let sanitizedPrompt;
      if (provider.slug === 'xai') {
        // Pour xAI, on s'assure que le prompt ne contient que des caractères ASCII
        // Convertir d'abord en chaîne pour éviter les problèmes avec les types non-string
        const promptString = String(prompt);

        // Nettoyer le prompt de manière très stricte - caractère par caractère
        const asciiOnly = [];
        for (let i = 0; i < promptString.length; i++) {
          const charCode = promptString.charCodeAt(i);
          // Ne garder que les caractères ASCII imprimables (32-126)
          if (charCode >= 32 && charCode <= 126) {
            asciiOnly.push(promptString.charAt(i));
          } else {
            asciiOnly.push(' '); // Remplacer par un espace
          }
        }

        // Joindre les caractères en une chaîne
        sanitizedPrompt = asciiOnly.join('');

        // Vérifier si le prompt est vide après nettoyage
        if (!sanitizedPrompt.trim()) {
          console.error(`generate-image - Le prompt est vide après sanitisation`);
          return NextResponse.json({
            error: 'Prompt invalide pour xAI: Le prompt est vide après sanitisation. Veuillez utiliser uniquement des caractères ASCII standard.',
            details: {
              type: ImageGenerationErrorType.INVALID_PROMPT,
              provider: provider.slug,
              retryable: true
            }
          }, { status: 400 });
        }

        console.log(`generate-image - Prompt original pour xAI: "${promptString}"`);
        console.log(`generate-image - Prompt sanitisé pour xAI: "${sanitizedPrompt}"`);
      } else {
        // Pour les autres fournisseurs, on utilise la sanitisation standard
        sanitizedPrompt = sanitizePrompt(prompt, provider.slug);
      }

      console.log(`generate-image - Prompt original: "${prompt.substring(0, 50)}..."`);
      console.log(`generate-image - Prompt sanitisé: "${sanitizedPrompt.substring(0, 50)}..."`);

      // Générer les images
      console.log(`generate-image - Génération d'images avec le prompt: "${sanitizedPrompt}"`);
      const result = await imageService.generateImages(sanitizedPrompt, generationOptions);
      console.log(`generate-image - Images générées: ${result.imageUrls.length}`);

      // Extraire les URLs des images
      imageUrls = result.imageUrls;
    } catch (error: any) {
      console.error(`Erreur lors de la génération d'images avec ${provider.slug}:`, error);

      // Gérer les erreurs spécifiques
      if (error instanceof ImageGenerationError) {
        let statusCode = 500;
        let errorMessage = error.message;

        switch (error.type) {
          case ImageGenerationErrorType.AUTHENTICATION:
            statusCode = 401;
            errorMessage = `Erreur d'authentification avec ${provider.name}: clé API invalide ou expirée`;
            break;
          case ImageGenerationErrorType.BILLING:
            statusCode = 402; // Payment Required
            errorMessage = `Crédits ${provider.name} insuffisants ou quota dépassé: ${error.message}`;
            console.log(`generate-image - ERREUR DE CRÉDIT DÉTECTÉE: ${error.message}`);
            break;
          case ImageGenerationErrorType.RATE_LIMIT:
            statusCode = 429;
            errorMessage = `Limite de requêtes atteinte pour ${provider.name}`;
            break;
          case ImageGenerationErrorType.CONTENT_POLICY:
            statusCode = 400;
            errorMessage = `Le prompt ne respecte pas la politique de contenu de ${provider.name}`;
            break;
          case ImageGenerationErrorType.INVALID_PROMPT:
            statusCode = 400;
            errorMessage = `Prompt invalide pour ${provider.name}: ${error.message}`;
            break;
        }

        return NextResponse.json({
          error: errorMessage,
          details: {
            type: error.type,
            provider: provider.slug,
            retryable: error.retryable
          }
        }, { status: statusCode });
      }

      return NextResponse.json({
        error: `Erreur lors de la génération d'images avec ${provider.name}: ${error.message || 'Erreur inconnue'}`
      }, { status: 500 });
    }

    // Enregistrer les images générées dans la base de données
    const generatedImages = [];

    try {
      for (const imageUrl of imageUrls) {
        console.log(`generate-image - Enregistrement de l'image dans la base de données: ${imageUrl.substring(0, 50)}...`);

        const { data: image, error: imageError } = await supabase
          .from('generated_images')
          .insert({
            user_id: session.user.id,
            prompt: sanitizedPrompt, // Utiliser le prompt sanitisé pour la cohérence
            original_prompt: prompt, // Conserver également le prompt original
            image_url: imageUrl,
            configuration_id: configurationId,
            provider_id: provider.id,
            model,
            resolution: size,
            is_public: false
          })
          .select()
          .single();

        if (imageError) {
          console.error('Erreur lors de l\'enregistrement de l\'image:', imageError);
          console.error('Détails de l\'erreur d\'enregistrement:', {
            code: imageError.code,
            message: imageError.message,
            details: imageError.details,
            hint: imageError.hint
          });

          // Créer un objet image temporaire si l'enregistrement échoue
          // Cela permet de continuer même si la base de données a un problème
          generatedImages.push({
            id: `temp-${Date.now()}-${generatedImages.length}`,
            image_url: imageUrl,
            prompt: sanitizedPrompt,
            original_prompt: prompt,
            created_at: new Date().toISOString(),
            user_id: session.user.id
          });
          continue;
        }

        console.log(`generate-image - Image enregistrée avec succès, ID: ${image.id}`);
        generatedImages.push(image);
      }
    } catch (dbError) {
      console.error('Erreur critique lors de l\'enregistrement des images:', dbError);

      // Si l'enregistrement échoue complètement, créer des objets temporaires
      // pour toutes les images afin de pouvoir les renvoyer au client
      if (generatedImages.length === 0) {
        imageUrls.forEach((url, index) => {
          generatedImages.push({
            id: `temp-${Date.now()}-${index}`,
            image_url: url,
            prompt: sanitizedPrompt,
            original_prompt: prompt,
            created_at: new Date().toISOString(),
            user_id: session.user.id
          });
        });
      }
    }

    // Incrémenter le compteur de générations utilisées
    try {
      console.log(`generate-image - Mise à jour des quotas pour l'utilisateur: ${session.user.id}`);

      // Récupérer à nouveau les quotas pour s'assurer d'avoir les données les plus récentes
      const { data: updatedQuota, error: updatedQuotaError } = await supabase
        .from('user_quotas')
        .select('monthly_generations_used, monthly_generations_limit')
        .eq('user_id', session.user.id)
        .single();

      if (updatedQuotaError && updatedQuotaError.code !== 'PGRST116') {
        console.error('Erreur lors de la récupération des quotas mis à jour:', updatedQuotaError);
        console.error('Détails de l\'erreur de quota:', {
          code: updatedQuotaError.code,
          message: updatedQuotaError.message,
          details: updatedQuotaError.details
        });
      }

      // Utiliser les quotas mis à jour ou les quotas originaux si la mise à jour a échoué
      const currentQuota = updatedQuota || quota;

      if (currentQuota) {
        console.log(`generate-image - Quota actuel: ${currentQuota.monthly_generations_used}/${currentQuota.monthly_generations_limit}`);

        const { error: updateError } = await supabase
          .from('user_quotas')
          .update({
            monthly_generations_used: (currentQuota.monthly_generations_used || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', session.user.id);

        if (updateError) {
          console.error('Erreur lors de la mise à jour des quotas:', updateError);
          console.error('Détails de l\'erreur de mise à jour:', {
            code: updateError.code,
            message: updateError.message
          });
        } else {
          console.log(`generate-image - Quota mis à jour avec succès: ${(currentQuota.monthly_generations_used || 0) + 1}/${currentQuota.monthly_generations_limit}`);
        }
      } else {
        // Si le quota a été créé mais n'est pas encore disponible dans cette requête
        console.log(`generate-image - Aucun quota trouvé, création d'un nouveau quota`);

        const { error: updateError } = await supabase
          .from('user_quotas')
          .update({
            monthly_generations_used: 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', session.user.id);

        if (updateError) {
          console.error('Erreur lors de la mise à jour des quotas (nouveau):', updateError);
          console.error('Détails de l\'erreur de création:', {
            code: updateError.code,
            message: updateError.message
          });
        } else {
          console.log(`generate-image - Nouveau quota créé avec succès: 1/50`);
        }
      }
    } catch (quotaError) {
      console.error('Erreur critique lors de la mise à jour des quotas:', quotaError);
      // Continuer malgré l'erreur de quota pour ne pas bloquer la génération d'images
    }

    // Retourner les images générées dans un format adapté au frontend
    console.log(`generate-image - Retour de ${generatedImages.length} images générées au client`);

    const formattedImages = generatedImages.map(image => ({
      id: image.id,
      url: image.image_url,
      prompt: image.prompt,
      timestamp: image.created_at
    }));

    console.log(`generate-image - Images formatées: ${JSON.stringify(formattedImages.map(img => ({ id: img.id, url: img.url.substring(0, 30) + '...' })))}`);

    return NextResponse.json({
      images: formattedImages,
      provider: provider.slug,
      isMock: false // Désactivation complète du mode simulation
    });
  } catch (error: any) {
    console.error('Erreur lors de la génération d\'image:', error);
    // Afficher plus de détails sur l'erreur pour faciliter le débogage
    console.error('Détails de l\'erreur:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });

    // Retourner un message d'erreur plus informatif
    return NextResponse.json({
      error: 'Erreur serveur lors de la génération d\'image',
      details: error.message || 'Erreur inconnue'
    }, { status: 500 });
  }
}
