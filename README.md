<div align="center">
  <h1>🎨 Bambi AI</h1>
  <p><strong>Générez des images IA avec vos propres clés API</strong></p>

  <p>
    <a href="https://github.com/ido2222/hiiiiiiiii/stargazers"><img src="https://img.shields.io/github/stars/ido2222/hiiiiiiiii?style=flat-square&color=7B5CFA" alt="Stars Badge"/></a>
    <a href="https://github.com/ido2222/hiiiiiiiii/network/members"><img src="https://img.shields.io/github/forks/ido2222/hiiiiiiiii?style=flat-square&color=7B5CFA" alt="Forks Badge"/></a>
    <a href="https://github.com/ido2222/hiiiiiiiii/issues"><img src="https://img.shields.io/github/issues/ido2222/hiiiiiiiii?style=flat-square&color=7B5CFA" alt="Issues Badge"/></a>
    <a href="https://github.com/ido2222/hiiiiiiiii/blob/main/LICENSE"><img src="https://img.shields.io/github/license/ido2222/hiiiiiiiii?style=flat-square&color=7B5CFA" alt="License Badge"/></a>
    <img src="https://img.shields.io/badge/version-0.1.0-blue?style=flat-square" alt="Version Badge"/>
  </p>

  <p>
    <a href="#✨-fonctionnalités">Fonctionnalités</a> •
    <a href="#🚀-démarrage-rapide">Démarrage rapide</a> •
    <a href="#🛠️-technologies">Technologies</a> •
    <a href="#📊-captures-décran">Captures d'écran</a> •
    <a href="#🔮-roadmap">Roadmap</a> •
    <a href="#🤝-contribuer">Contribuer</a> •
    <a href="#📝-licence">Licence</a>
  </p>
</div>

## 📋 Présentation

**Bambi AI** est une plateforme web moderne qui vous permet de générer des images IA en utilisant vos propres clés API (BYOK - Bring Your Own Key). Notre approche unique vous offre :

- **Sécurité maximale** : Vos clés API sont chiffrées et jamais stockées en clair
- **Flexibilité totale** : Utilisez les fournisseurs d'IA que vous préférez
- **Économies substantielles** : Pas d'abonnements coûteux, utilisez vos propres crédits API
- **Interface intuitive** : Générez des images en quelques clics

Bambi AI est conçu pour les créateurs, designers, développeurs et tous ceux qui souhaitent exploiter la puissance des modèles d'IA génératives sans compromis.

## ✨ Fonctionnalités

<div align="center">
  <table>
    <tr>
      <td align="center" width="33%">
        <h3>🔑</h3>
        <strong>BYOK</strong>
        <br />
        Utilisez vos propres clés API
      </td>
      <td align="center" width="33%">
        <h3>🌐</h3>
        <strong>Multi-Providers</strong>
        <br />
        OpenAI, Stability AI, Google...
      </td>
      <td align="center" width="33%">
        <h3>🛡️</h3>
        <strong>Sécurité</strong>
        <br />
        Chiffrement AES-256
      </td>
    </tr>
    <tr>
      <td align="center">
        <h3>📊</h3>
        <strong>Galerie</strong>
        <br />
        Historique de générations
      </td>
      <td align="center">
        <h3>💰</h3>
        <strong>Freemium</strong>
        <br />
        50 générations gratuites/mois
      </td>
      <td align="center">
        <h3>🚀</h3>
        <strong>UX Intuitive</strong>
        <br />
        Interface moderne et fluide
      </td>
    </tr>
  </table>
</div>

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18.x ou supérieur
- npm 9.x ou supérieur

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/ido2222/hiiiiiiiii.git
cd hiiiiiiiii

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditez .env.local avec vos propres clés API

# Lancer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur pour voir l'application.

### Configuration de Supabase

1. Créez un compte sur [Supabase](https://supabase.com/) si vous n'en avez pas déjà un
2. Créez un nouveau projet
3. Récupérez les clés API dans les paramètres du projet (URL et clé anon)
4. Mettez à jour votre fichier `.env.local` avec ces clés
5. Exécutez les migrations SQL pour configurer la base de données :

```bash
npm run apply-migrations
```

### Configuration de Stripe (pour les paiements)

1. Créez un compte sur [Stripe](https://stripe.com/) si vous n'en avez pas déjà un
2. Récupérez les clés API dans les paramètres du compte
3. Créez un produit et un prix pour l'abonnement premium
4. Mettez à jour votre fichier `.env.local` avec ces informations
5. Configurez un webhook Stripe pour recevoir les événements (utilisez [Stripe CLI](https://stripe.com/docs/stripe-cli) pour les tests locaux)

## 🛠️ Technologies

Bambi AI est construit avec des technologies modernes et performantes :

### Frontend
- **Next.js 13.5.6** avec App Router
- **React 18.2.0**
- **TypeScript 5.0.4**
- **Tailwind CSS 3.3.3**
- **ShadCN UI** (basé sur Radix UI)

### Backend
- **Supabase** (Auth, Database, Edge Functions)
- **PostgreSQL** (via Supabase)
- **Node.js 18.x**

### Sécurité
- Proxy API via Supabase Edge Functions
- Chiffrement AES-256 (crypto-js)

### Paiement
- Stripe API

## 📊 Captures d'écran

<div align="center">
  <table>
    <tr>
      <td width="50%">
        <strong>Dashboard de génération</strong>
        <br />
        <img src="https://placehold.co/600x400/7B5CFA/FFFFFF/png?text=Dashboard+Bambi+AI" alt="Dashboard" width="100%"/>
      </td>
      <td width="50%">
        <strong>Galerie d'images</strong>
        <br />
        <img src="https://placehold.co/600x400/7B5CFA/FFFFFF/png?text=Galerie+Bambi+AI" alt="Gallery" width="100%"/>
      </td>
    </tr>
    <tr>
      <td width="50%">
        <strong>Gestion des clés API</strong>
        <br />
        <img src="https://placehold.co/600x400/7B5CFA/FFFFFF/png?text=Gestion+API+Bambi+AI" alt="API Keys" width="100%"/>
      </td>
      <td width="50%">
        <strong>Paramètres avancés</strong>
        <br />
        <img src="https://placehold.co/600x400/7B5CFA/FFFFFF/png?text=Paramètres+Bambi+AI" alt="Settings" width="100%"/>
      </td>
    </tr>
  </table>
</div>

## 🔮 Roadmap

Nous avons de grands projets pour l'avenir de Bambi AI :

### Phase 2 (Q3 2023)
- **Prompt Optimizer** : Amélioration des prompts via un LLM
- **Templates prédéfinis** : Logo, illustrations, UI design
- **Export HD** : SVG, 4K, PNG
- **Suivi des coûts API** : Affichage du coût estimé par génération

### Phase 3 (Q4 2023)
- **Marketplace de clés API** : Vente de crédits via des partenariats
- **Extensions** : VS Code, desktop app
- **Intégrations** : Canva, Figma, Adobe
- **API Publique** : Pour les développeurs

## 🤝 Contribuer

Les contributions sont les bienvenues ! Voici comment vous pouvez nous aider :

1. **Fork** le dépôt
2. **Créez** une branche pour votre fonctionnalité (`git checkout -b feature/amazing-feature`)
3. **Committez** vos changements (`git commit -m 'Add some amazing feature'`)
4. **Poussez** vers la branche (`git push origin feature/amazing-feature`)
5. **Ouvrez** une Pull Request

Consultez notre [guide de contribution](docs/CONTRIBUTING.md) pour plus de détails.

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus d'informations.

---

<div align="center">
  <p>Développé avec ❤️ par l'équipe Bambi AI</p>
  <p>
    <a href="mailto:contact@bambi-ai.com">Contact</a> •
    <a href="https://github.com/ido2222">GitHub</a>
  </p>
</div>
