// Script pour appliquer une migration spécifique
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Récupérer les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erreur: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env.local');
  process.exit(1);
}

// Créer un client Supabase avec la clé de service
const supabase = createClient(supabaseUrl, supabaseKey);

// Chemin vers le fichier de migration
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Erreur: Veuillez spécifier un fichier de migration');
  console.error('Usage: node scripts/apply-migration.js <nom_du_fichier_migration>');
  process.exit(1);
}

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);

// Vérifier si le fichier existe
if (!fs.existsSync(migrationPath)) {
  console.error(`Erreur: Le fichier de migration ${migrationPath} n'existe pas`);
  process.exit(1);
}

async function applyMigration() {
  try {
    console.log(`Application de la migration: ${migrationFile}`);
    
    // Lire le contenu du fichier SQL
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Exécuter le SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`Erreur lors de l'exécution de ${migrationFile}:`, error);
      process.exit(1);
    }
    
    console.log(`Migration ${migrationFile} appliquée avec succès.`);
  } catch (error) {
    console.error('Erreur lors de l\'application de la migration:', error);
    process.exit(1);
  }
}

applyMigration();
