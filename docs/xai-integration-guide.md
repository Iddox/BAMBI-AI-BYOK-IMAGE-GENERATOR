# Guide d'intégration xAI pour Bambi AI

Ce guide vous aidera à configurer et utiliser l'intégration xAI dans votre application Bambi AI.

## Prérequis

- Une clé API xAI valide (obtenue sur [https://x.ai/api](https://x.ai/api))
- Node.js et npm installés
- Bambi AI installé et configuré

## Configuration

### 1. Exécuter le script de configuration

Pour configurer l'intégration xAI dans votre environnement localhost, exécutez le script suivant :

```bash
bash scripts/setup-xai-integration.sh
```

Ce script va :
- Vérifier et créer le fichier `.env` si nécessaire
- Installer les dépendances
- Exécuter les migrations de base de données
- Synchroniser les fournisseurs d'API
- Créer le logo xAI si nécessaire

### 2. Démarrer l'application

Après avoir exécuté le script de configuration, démarrez l'application :

```bash
npm run dev
```

### 3. Configurer votre clé API xAI

1. Connectez-vous à votre compte Bambi AI
2. Accédez à la page "Clés API" dans le tableau de bord
3. Cliquez sur "Ajouter une nouvelle clé API"
4. Sélectionnez "xAI" comme fournisseur
5. Donnez un nom à votre configuration (ex: "Ma clé xAI")
6. Entrez votre clé API xAI
7. Cliquez sur "Valider et enregistrer"

## Utilisation

### Générer des images avec xAI

1. Accédez à la page "Générateur d'images" dans le tableau de bord
2. Sélectionnez votre configuration xAI dans le menu déroulant
3. Entrez un prompt décrivant l'image que vous souhaitez générer
4. Cliquez sur "Générer"

### Limitations de l'API xAI

L'API xAI a les limitations suivantes :
- Ne supporte pas le paramètre 'size' (taille fixe)
- Ne supporte pas les paramètres de qualité ou de style
- Maximum 10 images par requête
- Maximum 5 requêtes par seconde
- Format JPG uniquement
- Prix: $0.07 par image

### Modèle utilisé

L'intégration xAI utilise le modèle `grok-2-image-1212` pour la génération d'images.

## Dépannage

### Problèmes courants

#### La clé API n'est pas validée

Si votre clé API n'est pas validée, vérifiez que :
- La clé API est correcte et active
- Vous avez un accès valide à l'API xAI
- Le format de la clé est correct (commence généralement par "xai-")

#### Aucune image n'est générée

Si aucune image n'est générée, vérifiez que :
- Votre clé API est valide
- Votre prompt ne viole pas les politiques de contenu de xAI
- Vous n'avez pas dépassé votre quota de requêtes

#### Erreur "Argument not supported: size"

Cette erreur indique que vous essayez d'utiliser le paramètre `size` qui n'est pas supporté par l'API xAI. L'application devrait automatiquement ignorer ce paramètre.

### Tester l'intégration xAI

Pour tester l'intégration xAI indépendamment de l'application, utilisez le script de test :

```bash
node test-xai-simple.js VOTRE_CLE_API_XAI
```

Ce script va :
- Valider votre clé API xAI
- Générer des images avec différents paramètres
- Afficher les résultats et les erreurs éventuelles

## Ressources

- [Documentation officielle de l'API xAI](https://docs.x.ai/docs/guides/image-generations)
- [Site officiel de xAI](https://x.ai/api)

## Support

Si vous rencontrez des problèmes avec l'intégration xAI, veuillez contacter le support de Bambi AI ou ouvrir une issue sur le dépôt GitHub.
