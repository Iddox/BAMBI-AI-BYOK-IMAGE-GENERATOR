#!/bin/bash

# Script pour démarrer le serveur de développement Bambi AI
# Ce script permet de lancer l'application depuis la racine du projet

echo "🚀 Démarrage du serveur de développement Bambi AI..."
cd "$(dirname "$0")" || { echo "❌ Erreur: Impossible d'accéder au répertoire bambi-ai"; exit 1; }

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
  echo "📦 Installation des dépendances..."
  npm install || { echo "❌ Erreur: L'installation des dépendances a échoué"; exit 1; }
fi

# Démarrer le serveur de développement
echo "🌐 Lancement du serveur Next.js..."
npm run dev

# Ce script ne devrait jamais atteindre cette ligne sauf en cas d'erreur
echo "⚠️ Le serveur s'est arrêté de manière inattendue"
