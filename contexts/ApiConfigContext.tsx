"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Type pour les configurations API
export type ApiConfig = {
  id: string;
  name: string;
  provider: string;
  model: string;
  key: string;
  isValidated?: boolean;
};

// Interface pour le contexte
interface ApiConfigContextType {
  configs: ApiConfig[];
  addConfig: (config: Omit<ApiConfig, "id">) => string;
  updateConfig: (id: string, config: Partial<Omit<ApiConfig, "id">>) => void;
  deleteConfig: (id: string) => void;
  getConfigById: (id: string) => ApiConfig | undefined;
  getAllConfigs: () => ApiConfig[];
}

// Création du contexte
const ApiConfigContext = createContext<ApiConfigContextType | undefined>(undefined);

// Clé pour le stockage local
const STORAGE_KEY = "bambi-api-configs";

// Provider du contexte
export function ApiConfigProvider({ children }: { children: ReactNode }) {
  const [configs, setConfigs] = useState<ApiConfig[]>([]);

  // Charger les configurations depuis le localStorage au montage
  useEffect(() => {
    const storedConfigs = localStorage.getItem(STORAGE_KEY);
    if (storedConfigs) {
      try {
        const parsedConfigs = JSON.parse(storedConfigs);
        setConfigs(parsedConfigs);
      } catch (error) {
        console.error("Erreur lors du chargement des configurations API:", error);
        // En cas d'erreur, réinitialiser le stockage
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Sauvegarder les configurations dans le localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  }, [configs]);

  // Ajouter une nouvelle configuration
  const addConfig = (config: Omit<ApiConfig, "id">) => {
    const id = `config-${Date.now()}`;
    const newConfig = { ...config, id };
    setConfigs(prev => [...prev, newConfig]);
    return id;
  };

  // Mettre à jour une configuration existante
  const updateConfig = (id: string, config: Partial<Omit<ApiConfig, "id">>) => {
    setConfigs(prev =>
      prev.map(item =>
        item.id === id ? { ...item, ...config } : item
      )
    );
  };

  // Supprimer une configuration
  const deleteConfig = (id: string) => {
    setConfigs(prev => prev.filter(item => item.id !== id));
  };

  // Obtenir une configuration par son ID
  const getConfigById = (id: string) => {
    return configs.find(config => config.id === id);
  };

  // Obtenir toutes les configurations
  const getAllConfigs = () => {
    return configs;
  };

  return (
    <ApiConfigContext.Provider
      value={{
        configs,
        addConfig,
        updateConfig,
        deleteConfig,
        getConfigById,
        getAllConfigs
      }}
    >
      {children}
    </ApiConfigContext.Provider>
  );
}

// Hook personnalisé pour utiliser le contexte
export function useApiConfig() {
  const context = useContext(ApiConfigContext);
  if (context === undefined) {
    throw new Error("useApiConfig doit être utilisé à l'intérieur d'un ApiConfigProvider");
  }
  return context;
}
