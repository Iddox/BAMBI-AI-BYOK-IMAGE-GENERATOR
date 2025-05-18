#!/usr/bin/env node

/**
 * Script pour synchroniser les fournisseurs d'API entre le frontend et la base de données
 * Ce script exécute la migration SQL pour s'assurer que tous les fournisseurs définis dans le frontend
 * existent dans la table api_providers de Supabase.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Chemin vers le fichier de migration
const migrationPath = path.join(__dirname, '../supabase/migrations/20240801000000_sync_api_providers.sql');

// Vérifier si le fichier de migration existe
if (!fs.existsSync(migrationPath)) {
  console.error('Erreur: Le fichier de migration n\'existe pas:', migrationPath);
  process.exit(1);
}

console.log('Synchronisation des fournisseurs d\'API...');

try {
  // Exécuter la migration SQL avec Supabase CLI
  console.log('Exécution de la migration SQL...');
  execSync(`supabase db push --db-url ${process.env.DATABASE_URL}`, { stdio: 'inherit' });
  
  console.log('Migration exécutée avec succès!');
  console.log('Les fournisseurs d\'API ont été synchronisés entre le frontend et la base de données.');
} catch (error) {
  console.error('Erreur lors de l\'exécution de la migration:', error.message);
  process.exit(1);
}
