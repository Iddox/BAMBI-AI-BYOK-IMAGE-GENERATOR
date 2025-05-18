#!/bin/bash

# Script de démarrage rapide pour tester l'intégration xAI dans Bambi AI
# Exécuter avec: bash start-xai-test.sh

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Démarrage rapide pour tester l'intégration xAI dans Bambi AI ===${NC}"

# Vérifier si le fichier .env existe et contient ENCRYPTION_KEY
if [ ! -f .env ]; then
  echo -e "${RED}Erreur: Le fichier .env n'existe pas.${NC}"
  echo -e "${YELLOW}Création d'un fichier .env minimal...${NC}"
  
  # Générer une clé de chiffrement
  ENCRYPTION_KEY=$(openssl rand -hex 16)
  
  cat > .env << EOL
# Fichier .env créé par le script start-xai-test.sh
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
ENCRYPTION_KEY=${ENCRYPTION_KEY}
SIMULATE_API_VALIDATION=false
XAI_API_BASE_URL=https://api.x.ai/v1
XAI_DEFAULT_MODEL=grok-2-image-1212
EOL
  
  echo -e "${GREEN}Fichier .env créé avec succès.${NC}"
else
  # Vérifier si ENCRYPTION_KEY est définie
  if ! grep -q "ENCRYPTION_KEY" .env; then
    echo -e "${YELLOW}ENCRYPTION_KEY n'est pas définie dans le fichier .env.${NC}"
    echo -e "${YELLOW}Ajout de ENCRYPTION_KEY au fichier .env...${NC}"
    
    # Générer une clé de chiffrement
    ENCRYPTION_KEY=$(openssl rand -hex 16)
    
    # Ajouter ENCRYPTION_KEY au fichier .env
    echo "ENCRYPTION_KEY=${ENCRYPTION_KEY}" >> .env
    
    echo -e "${GREEN}ENCRYPTION_KEY ajoutée au fichier .env.${NC}"
  else
    echo -e "${GREEN}Le fichier .env existe et contient ENCRYPTION_KEY.${NC}"
  fi
  
  # Vérifier si XAI_API_BASE_URL est définie
  if ! grep -q "XAI_API_BASE_URL" .env; then
    echo -e "${YELLOW}XAI_API_BASE_URL n'est pas définie dans le fichier .env.${NC}"
    echo -e "${YELLOW}Ajout de XAI_API_BASE_URL au fichier .env...${NC}"
    
    # Ajouter XAI_API_BASE_URL au fichier .env
    echo "XAI_API_BASE_URL=https://api.x.ai/v1" >> .env
    echo "XAI_DEFAULT_MODEL=grok-2-image-1212" >> .env
    
    echo -e "${GREEN}Configuration xAI ajoutée au fichier .env.${NC}"
  fi
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

# Installer les dépendances si node_modules n'existe pas
if [ ! -d "node_modules" ]; then
  echo -e "${BLUE}Installation des dépendances...${NC}"
  npm install
  echo -e "${GREEN}Dépendances installées avec succès.${NC}"
else
  echo -e "${GREEN}Les dépendances sont déjà installées.${NC}"
fi

# Démarrer l'application
echo -e "${BLUE}Démarrage de l'application...${NC}"
echo -e "${GREEN}Vous pouvez maintenant accéder à la page de test xAI à l'adresse:${NC}"
echo -e "${BLUE}http://localhost:3000/xai-test${NC}"
echo ""
echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter l'application.${NC}"
echo ""

npm run dev
