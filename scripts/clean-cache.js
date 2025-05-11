#!/usr/bin/env node

/**
 * Script de nettoyage du cache pour résoudre les problèmes de chargement de chunks
 * 
 * Ce script supprime:
 * - Le dossier .next (cache de compilation Next.js)
 * - Le dossier node_modules/.cache (cache de webpack et autres outils)
 * - Les fichiers temporaires
 * 
 * Utilisation:
 * node scripts/clean-cache.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Couleurs pour les messages console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Fonction pour afficher un message avec une couleur
function colorLog(message, color) {
  console.log(`${color}${message}${colors.reset}`);
}

// Fonction pour supprimer un dossier récursivement
function removeDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  try {
    colorLog(`Suppression de ${dirPath}...`, colors.yellow);
    fs.rmSync(dirPath, { recursive: true, force: true });
    colorLog(`✓ ${dirPath} supprimé avec succès`, colors.green);
  } catch (error) {
    colorLog(`✗ Erreur lors de la suppression de ${dirPath}: ${error.message}`, colors.red);
  }
}

// Fonction principale
function cleanCache() {
  colorLog('🧹 Nettoyage du cache pour résoudre les problèmes de chargement de chunks...', colors.cyan);
  
  // Chemin du projet
  const projectRoot = path.resolve(__dirname, '..');
  
  // Supprimer le dossier .next
  removeDirectory(path.join(projectRoot, '.next'));
  
  // Supprimer le cache de node_modules
  removeDirectory(path.join(projectRoot, 'node_modules', '.cache'));
  
  // Supprimer les fichiers temporaires
  const tempFiles = [
    '.DS_Store',
    'npm-debug.log',
    'yarn-debug.log',
    'yarn-error.log',
  ];
  
  tempFiles.forEach(file => {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      try {
        colorLog(`Suppression de ${file}...`, colors.yellow);
        fs.unlinkSync(filePath);
        colorLog(`✓ ${file} supprimé avec succès`, colors.green);
      } catch (error) {
        colorLog(`✗ Erreur lors de la suppression de ${file}: ${error.message}`, colors.red);
      }
    }
  });
  
  // Exécuter npm cache clean
  try {
    colorLog('Nettoyage du cache npm...', colors.yellow);
    execSync('npm cache clean --force', { stdio: 'inherit' });
    colorLog('✓ Cache npm nettoyé avec succès', colors.green);
  } catch (error) {
    colorLog(`✗ Erreur lors du nettoyage du cache npm: ${error.message}`, colors.red);
  }
  
  colorLog('🎉 Nettoyage terminé!', colors.cyan);
  colorLog('Pour reconstruire l\'application, exécutez:', colors.magenta);
  colorLog('  npm install', colors.blue);
  colorLog('  npm run dev', colors.blue);
}

// Exécuter la fonction principale
cleanCache();
