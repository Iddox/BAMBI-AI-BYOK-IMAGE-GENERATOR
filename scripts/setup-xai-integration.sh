#!/bin/bash

# Script pour configurer l'intégration xAI dans l'environnement localhost
# Exécuter avec: bash scripts/setup-xai-integration.sh

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Configuration de l'intégration xAI pour Bambi AI ===${NC}"
echo -e "${BLUE}Ce script va configurer l'intégration xAI dans votre environnement localhost.${NC}"
echo ""

# Vérifier si le fichier .env existe
if [ ! -f .env ]; then
  echo -e "${YELLOW}Le fichier .env n'existe pas. Création à partir de .env.example...${NC}"
  
  if [ -f .env.example ]; then
    cp .env.example .env
    echo -e "${GREEN}Fichier .env créé avec succès.${NC}"
  else
    echo -e "${RED}Erreur: Le fichier .env.example n'existe pas.${NC}"
    echo -e "${YELLOW}Création d'un fichier .env minimal...${NC}"
    
    cat > .env << EOL
# Fichier .env créé par le script setup-xai-integration.sh
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
ENCRYPTION_KEY=votre_clé_de_chiffrement_32_caractères
SIMULATE_API_VALIDATION=true
EOL
    
    echo -e "${GREEN}Fichier .env minimal créé avec succès.${NC}"
    echo -e "${YELLOW}Veuillez mettre à jour les valeurs dans le fichier .env avec vos propres clés.${NC}"
  fi
else
  echo -e "${GREEN}Le fichier .env existe déjà.${NC}"
fi

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
  echo -e "${RED}Erreur: Node.js n'est pas installé.${NC}"
  echo -e "${YELLOW}Veuillez installer Node.js avant de continuer.${NC}"
  exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
  echo -e "${RED}Erreur: npm n'est pas installé.${NC}"
  echo -e "${YELLOW}Veuillez installer npm avant de continuer.${NC}"
  exit 1
fi

# Installer les dépendances
echo -e "${BLUE}Installation des dépendances...${NC}"
npm install
echo -e "${GREEN}Dépendances installées avec succès.${NC}"

# Exécuter les migrations de base de données
echo -e "${BLUE}Exécution des migrations de base de données...${NC}"

# Vérifier si Supabase CLI est installé
if command -v supabase &> /dev/null; then
  echo -e "${GREEN}Supabase CLI est installé.${NC}"
  
  # Démarrer Supabase en local si ce n'est pas déjà fait
  echo -e "${BLUE}Démarrage de Supabase en local...${NC}"
  supabase start || echo -e "${YELLOW}Supabase est peut-être déjà en cours d'exécution.${NC}"
  
  # Exécuter les migrations
  echo -e "${BLUE}Application des migrations...${NC}"
  supabase db reset || echo -e "${RED}Erreur lors de l'application des migrations.${NC}"
else
  echo -e "${YELLOW}Supabase CLI n'est pas installé. Exécution des migrations manuelles...${NC}"
  
  # Exécuter les migrations manuelles
  echo -e "${BLUE}Exécution des migrations manuelles...${NC}"
  
  # Vérifier si le dossier migrations existe
  if [ -d "supabase/migrations" ]; then
    echo -e "${GREEN}Dossier migrations trouvé.${NC}"
    
    # Exécuter le script de synchronisation des fournisseurs d'API
    echo -e "${BLUE}Synchronisation des fournisseurs d'API...${NC}"
    node scripts/sync-providers.js
  else
    echo -e "${RED}Erreur: Le dossier supabase/migrations n'existe pas.${NC}"
  fi
fi

# Créer le logo xAI s'il n'existe pas
echo -e "${BLUE}Vérification du logo xAI...${NC}"
mkdir -p public/providers

if [ ! -f public/providers/xai.svg ]; then
  echo -e "${YELLOW}Le logo xAI n'existe pas. Création...${NC}"
  
  cat > public/providers/xai.svg << EOL
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 4l16 16" />
  <path d="M20 4L4 20" />
</svg>
EOL
  
  echo -e "${GREEN}Logo xAI créé avec succès.${NC}"
else
  echo -e "${GREEN}Le logo xAI existe déjà.${NC}"
fi

# Démarrer l'application en mode développement
echo -e "${BLUE}Configuration terminée. Démarrage de l'application...${NC}"
echo -e "${GREEN}Vous pouvez maintenant utiliser xAI dans votre application Bambi AI.${NC}"
echo -e "${YELLOW}Pour démarrer l'application, exécutez:${NC}"
echo -e "${BLUE}npm run dev${NC}"
echo ""
echo -e "${YELLOW}Pour tester l'intégration xAI, exécutez:${NC}"
echo -e "${BLUE}node test-xai-simple.js VOTRE_CLE_API_XAI${NC}"
echo ""
echo -e "${GREEN}Bonne génération d'images avec xAI!${NC}"
