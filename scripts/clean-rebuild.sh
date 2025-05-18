#!/bin/bash

# Script pour nettoyer le cache de build et redémarrer l'application

echo "🧹 Nettoyage du cache de build..."
rm -rf .next

echo "🔄 Nettoyage du cache de npm..."
npm cache clean --force

echo "🧼 Nettoyage des modules node_modules..."
rm -rf node_modules/.cache

echo "📦 Réinstallation des dépendances..."
npm install

echo "🔧 Vérification des dépendances Babel..."
npm ls @babel/core @babel/plugin-transform-modules-commonjs @babel/preset-env babel-loader

echo "🔧 Vérification des polyfills..."
npm ls crypto-browserify stream-browserify url browserify-zlib stream-http https-browserify assert os-browserify path-browserify util querystring-es3 buffer process

echo "🚀 Démarrage du serveur de développement..."
npm run dev
