"use client";

import { useState, useEffect } from "react";
import { XIcon, EyeIcon, EyeOffIcon, LockIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-select";
import { ApiConfig } from "@/contexts/ApiConfigContext";
import {
  API_PROVIDERS,
  PROVIDER_MODELS,
  getProviderLabel,
  getModelLabel
} from "@/lib/constants/api-providers";

interface ApiKeyManagerModalProps {
  isModalOpen: boolean;
  isModalExiting: boolean;
  closeModal: () => void;
  isEditing: boolean;
  isDuplicating: boolean;
  formData: {
    name: string;
    provider: string;
    model: string;
    key: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    provider: string;
    model: string;
    key: string;
  }>>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  error: string | null;
  showKey: boolean;
  setShowKey: React.Dispatch<React.SetStateAction<boolean>>;
  isValidating: boolean;
  saveConfig: () => Promise<void>;
}

export function ApiKeyManagerModal({
  isModalOpen,
  isModalExiting,
  closeModal,
  isEditing,
  isDuplicating,
  formData,
  setFormData,
  handleChange,
  error,
  showKey,
  setShowKey,
  isValidating,
  saveConfig
}: ApiKeyManagerModalProps) {
  if (!isModalOpen) return null;

  return (
    <div className="modal-fullscreen flex items-center justify-center p-4">
      <div
        className={`bg-bambi-card border border-bambi-border rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto bambi-scrollbar shadow-xl ${isModalExiting ? 'animate-modal-exit' : 'animate-modal-entrance'}`}
      >
        <div className="sticky top-0 bg-bambi-card border-b border-bambi-border p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold truncate">
            {isEditing ? "Modifier le Profil API" : isDuplicating ? "Dupliquer le Profil API" : "Ajouter un Profil API"}
          </h2>
          <button
            onClick={closeModal}
            className="text-bambi-subtext hover:text-bambi-text p-2 rounded-full hover:bg-bambi-border/20"
            aria-label="Fermer"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Nom du profil
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Ma clé OpenAI pour DALL-E 3"
                className="bg-bambi-background border-bambi-border h-11"
                aria-required="true"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Fournisseur d'API
              </label>
              <CustomSelect
                name="provider"
                value={formData.provider}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, provider: value }))}
                placeholder="Sélectionner un fournisseur"
                options={API_PROVIDERS}
                className="bg-bambi-background border-bambi-border"
                aria-required="true"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Modèle
              </label>
              <CustomSelect
                name="model"
                value={formData.model}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, model: value }))}
                placeholder="Sélectionner un modèle"
                options={formData.provider ? PROVIDER_MODELS[formData.provider] || [] : []}
                disabled={!formData.provider}
                className="bg-bambi-background border-bambi-border"
                aria-required="true"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Clé API {isEditing && "(laisser vide pour conserver l'existante)"}
              </label>
              <div className="relative">
                <Input
                  name="key"
                  type={showKey ? "text" : "password"}
                  value={formData.key}
                  onChange={handleChange}
                  placeholder={isEditing ? "••••••••••••••••••••" : "sk-..."}
                  className="w-full bg-bambi-background border-bambi-border pr-10 h-11"
                  aria-required={!isEditing}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-bambi-subtext hover:text-bambi-text p-1 rounded-full hover:bg-bambi-border/20"
                  aria-label={showKey ? "Masquer la clé" : "Afficher la clé"}
                >
                  {showKey ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-bambi-subtext mt-1.5 flex items-center">
                <LockIcon className="h-3 w-3 mr-1 text-bambi-accent" />
                Votre clé API est stockée de manière sécurisée et n'est jamais partagée.
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-bambi-card border-t border-bambi-border p-4 flex justify-end gap-3 z-10">
          <Button
            variant="outline"
            onClick={closeModal}
            className="border-bambi-border text-bambi-text"
          >
            Annuler
          </Button>
          <Button
            onClick={saveConfig}
            disabled={isValidating}
            className="btn-primary"
          >
            {isValidating ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Validation...
              </>
            ) : (
              isEditing ? "Mettre à jour" : "Enregistrer"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
