#!/usr/bin/env node

/**
 * Script pour appliquer les migrations SQL à une base de données Supabase
 * 
 * Utilisation:
 * node scripts/apply-migrations.js
 * 
 * Assurez-vous que les variables d'environnement suivantes sont définies:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Récupérer les variables d'environnement
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erreur: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env.local');
  process.exit(1);
}

// Créer un client Supabase avec la clé de service
const supabase = createClient(supabaseUrl, supabaseKey);

// Chemin vers le dossier des migrations
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

async function applyMigrations() {
  try {
    // Vérifier si le dossier des migrations existe
    if (!fs.existsSync(migrationsDir)) {
      console.error(`Erreur: Le dossier des migrations n'existe pas: ${migrationsDir}`);
      process.exit(1);
    }

    // Lire tous les fichiers de migration
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Trier par ordre alphabétique

    if (migrationFiles.length === 0) {
      console.log('Aucun fichier de migration trouvé.');
      process.exit(0);
    }

    console.log(`Trouvé ${migrationFiles.length} fichier(s) de migration.`);

    // Appliquer chaque migration
    for (const file of migrationFiles) {
      console.log(`Exécution de la migration: ${file}`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Exécuter le SQL
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`Erreur lors de l'exécution de ${file}:`, error);
        process.exit(1);
      }
      
      console.log(`Migration ${file} appliquée avec succès.`);
    }

    console.log('Toutes les migrations ont été appliquées avec succès!');
  } catch (error) {
    console.error('Erreur lors de l\'application des migrations:', error);
    process.exit(1);
  }
}

applyMigrations();
