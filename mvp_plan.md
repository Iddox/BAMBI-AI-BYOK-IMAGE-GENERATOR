# 🧠 MVP Plan - Bambi AI  

Bambi AI est une webapp de génération d'images **BYOK (Bring Your Own Key)** permettant aux utilisateurs de générer des images via des prompts en utilisant leurs propres clés API (OpenAI, Stability AI, Google, etc.). L’objectif est de proposer une interface **ultra-simple, sécurisée et rapide**, compatible avec les providers offrant des modèles de génération d'images, avec un modèle **freemium** (50 messages gratuits/mois + premium à **5€/mois** pour illimité).  

---

## ✅ **Finalized MVP Features (Phase 1)**  

### 🖼️ Image Generation  
- Champ de texte pour le prompt (ex : "Un chat sur une soucoupe volante").  
- Bouton "Générer" + loader d’attente.  
- Affichage de 2 images générées par prompt (PNG/JPG, résultats différents).  
- Téléchargement de l’image (bouton "Télécharger" pour chaque image).  
- Options basiques : résolution (1080p), qualité (HD).  

### 🔑 BYOK Management  
- Interface dans l’onglet "Clé API" (accessible en 1 clic) pour :  
  - Ajouter une nouvelle configuration : choisir un provider (OpenAI, Stability AI, Google, etc.), entrer une clé API, sélectionner un modèle spécifique (liste dynamique selon provider, ex. DALL·E 2 ou DALL·E 3 pour OpenAI), nommer la configuration (ex. "Ma clé OpenAI Pro") et sauvegarder.  
  - Modifier une configuration existante : changer la clé API, le modèle ou le nom.  
  - Limite selon plan : 1 configuration pour le plan gratuit, illimité pour le premium.  
- Liste déroulante à côté du chat dans l’interface de génération pour basculer entre les configurations sauvegardées. Bouton "Configurer une clé API" si aucune configuration n’est sauvegardée.  
- Test automatique de validité des clés (ex : "Clé valide ✅").  
- Chiffrement AES-256 des clés avant stockage.  
- Proxy API côté serveur (les clés ne transitent jamais côté frontend).  

### 📜 Generation History  
- Historique linéaire simple des prompts et images générées dans un panneau latéral ou en bas de la page principale (scrollable).  
- Bouton "Regénérer" pour réutiliser un prompt.  
- Bouton "Reset Chat" pour vider l’historique linéaire et repartir de zéro (sans affecter les configurations).  

### 🔐 User Auth  
- Connexion rapide par email/mot de passe (sans vérification email) ou connexion sociale (Google/GitHub).  
- Choix du plan après authentification : Gratuit (50 messages/mois, 1 configuration) ou Premium (5€/mois, illimité messages et configurations + HD).  

### 💳 Monétisation (Stripe)  
- **Version gratuite** :  
  - 50 messages (prompts envoyés)/mois avec des clés API gratuites (ex : Hugging Face).  
  - 1 configuration API sauvegardée.  
  - Compteur visible dans l'interface (ex. "Messages envoyés : 20/50").  
- **Version premium** :  
  - Messages illimités (5€/mois ou 50€/an).  
  - Configurations API illimitées.  
  - Téléchargement en HD (4K, SVG).  

### 🌐 Social Sharing  
- Bouton "Partager" pour chaque image générée.  
- Redirige vers X avec un message pré-rempli ("Découvrez cette image générée par Bambi AI ! #BambiAI") incluant l’image.  

---

## 👣 **Detailed User Journey**  

### **User arrive sur la Landing Page**  
- Voit une page simple avec un message clair ("Générez des images avec vos clés API !") et un bouton "Commencer".  

### **Authentification et choix du plan**  
- Clique sur "Commencer", s’authentifie (email/mot de passe ou Google/GitHub) ou s’inscrit rapidement.  
- Choisit un plan : Gratuit (limité à 50 messages/mois, 1 configuration) ou Premium (illimité messages et configurations + HD).  
- Voit une info-bulle rapide ("Configurez votre clé API pour commencer !") affichée une fois.  

### **Configuration d’une clé API**  
- Va dans l’onglet "Clé API" (accessible en 1 clic depuis l’interface principale).  
- Ajoute une nouvelle configuration : choisit un provider (ex : OpenAI), colle une clé API, sélectionne un modèle (ex : DALL·E 3), nomme la configuration (ex : "Ma clé OpenAI Pro").  
- Teste la clé (ex : "Clé valide ✅").  
- Sauvegarde la configuration (limite : 1 pour gratuit, illimité pour premium).  
- Peut modifier une configuration existante (clé API, modèle, nom).  

### **Génération d’une image**  
- Dans l’interface principale, sélectionne une configuration sauvegardée via la liste déroulante à côté du chat (ex : "Ma clé OpenAI Pro").  
- Entre un prompt (ex : "Chat sur une soucoupe volante").  
- Clique sur "Générer" → requête vers le proxy API avec le modèle et la clé choisis.  
- 2 images s’affichent avec pour chacune un bouton "Télécharger" et "Partager".  
- Les images sont ajoutées à l’historique linéaire (panneau latéral ou bas de page).  
- Compteur de messages envoyés mis à jour (ex. "Messages envoyés : 21/50").  

### **Historique et regénération**  
- L’utilisateur consulte l’historique linéaire pour revoir les images et prompts.  
- Clique sur un prompt ou une image → le prompt original s’affiche dans le champ de génération.  
- Modifie le prompt ou génère de nouvelles images.  
- Peut cliquer sur "Reset Chat" pour vider l’historique linéaire et repartir de zéro.  

### **Partage social**  
- L’utilisateur clique sur "Partager" pour une image.  
- Est redirigé vers X avec un message pré-rempli ("Découvrez cette image générée par Bambi AI ! #BambiAI").  

### **Passage en premium**  
- L’utilisateur atteint la limite de 50 messages gratuits/mois ou veut ajouter une deuxième configuration.  
- Pop-up bloquant : "Limite atteinte. Passez au premium pour continuer."  
- Redirection vers Stripe Checkout (5€/mois ou 50€/an).  
- Après paiement, accès immédiat à la génération illimitée, configurations illimitées et téléchargement HD.  

---

## ⚠️ **Edge Case Notes (Critiques uniquement)**  
- ❗ **Clé API invalide** → Message clair (ex : "Clé expirée ❌") + redirection vers l’onglet Clé API.  
- ❗ **Erreur API** → Message générique (ex : "Erreur serveur – Réessayez plus tard").  
- ❗ **Quota API dépassé** → Message (ex : "Votre clé Google Imagen a atteint son quota mensuel").  

---

## 🛠️ **Tech Stack + Monétisation**  

### **Tech Stack**  
| **Couche**      | **Outil**                           | **Justification**                                       |
| --------------- | ----------------------------------- | ------------------------------------------------------- |
| **Frontend**    | Next.js + Tailwind CSS              | Performance, SEO, design moderne, développement rapide. |
| **Backend**     | Supabase (Auth + DB + Functions)    | Gestion des utilisateurs, stockage sécurisé, proxy API. |
| **Sécurité**    | Proxy API + AES-256 + Rate-limiting | Protection des clés API et prévention des abus.         |
| **Déploiement** | Vercel                              | Déploiement rapide avec support SSR.                    |
| **Paiement**    | Stripe                              | Abonnements récurrents simples.                         |

### **Monétisation**  
#### **Version gratuite** :  
- 50 messages (prompts envoyés)/mois avec des clés API gratuites (ex : Hugging Face).  
- 1 configuration API sauvegardée.  
- Résolution standard (1024x1024).  
- Compteur visible dans l'interface (ex. "Messages envoyés : 20/50").  

#### **Version premium (5€/mois ou 50€/an)** :  
- Messages illimités avec tous les providers.  
- Configurations API illimitées.  
- Téléchargement en HD (4K, SVG).  

#### **Flux de paiement** :  
1. L’utilisateur atteint la limite de 50 messages gratuits/mois ou veut ajouter une deuxième configuration.  
2. Pop-up : "Limite atteinte. Passez au premium pour continuer."  
3. Redirection vers Stripe Checkout (abonnement mensuel/anuel).  
4. Après paiement, accès immédiat aux fonctionnalités premium.  

🚀 **Objectif** : Un MVP ultra-léger, intuitif et rapide à développer, prêt à évoluer



graph TD
    A[Utilisateur arrive sur Landing Page] --> B[Clique sur 'Commencer']
    B --> C[S'authentifie ou s'inscrit]
    C --> D[Choisit un plan : Gratuit ou Premium]
    D --> E[Gratuit : limité à 50 messages/mois, 1 config]
    D --> F[Premium : illimité messages/configs + HD]
    E --> G[Voit info-bulle rapide : 'Configurez votre clé API !']
    F --> G
    G --> H[Va dans onglet 'Clé API' en 1 clic]
    H --> I[Ajoute nouvelle configuration]
    I --> J[Choisit Provider ex. OpenAI]
    J --> K[Entre clé API]
    K --> L[Sélectionne Modèle ex. DALL·E 3]
    L --> M[Nomme configuration ex. 'Ma clé OpenAI Pro']
    M --> N[Sauvegarde configuration]
    N --> O[Retourne à l'espace de génération principal]
    O --> P[Sélectionne configuration via dropdown à côté du chat ex. 'Ma clé OpenAI Pro']
    P --> Q[Écrit un prompt ex. 'Futuristic city at night']
    Q --> R[Clique sur 'Générer']
    R --> S[Appel API avec clé et modèle choisis]
    S --> T[Affichage de 2 images générées]
    T --> U[Télécharger image 1 ou 2]
    T --> V[Partager image 1 ou 2 sur X]
    T --> W[Stocké dans historique linéaire]
    T --> X[Compteur mis à jour : Messages envoyés X/50]
    W --> Y[Re-éditer prompt depuis historique]
    Y --> Q
    W --> Z[Reset Chat : vide historique linéaire]
    Z --> O
    H --> AA[Modifie configuration existante]
    AA --> AB[Change clé API, modèle ou nom]
    AB --> N
    H --> AC[Ajoute autre configuration si Premium]
    AC --> J
    E --> AD[Limite 1 config atteinte : Pop-up Premium]
    AD --> AE[Redirection Stripe Checkout]
    AE --> F

