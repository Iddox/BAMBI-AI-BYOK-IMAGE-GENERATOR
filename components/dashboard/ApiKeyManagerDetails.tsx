"use client";

import { useState } from "react";
import { PencilIcon, TrashIcon, CopyIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { ApiConfig } from "@/contexts/ApiConfigContext";

interface ApiKeyManagerDetailsProps {
  selectedConfig: ApiConfig | undefined;
  activeTab: 'list' | 'details';
  openAddModal: () => void;
  openEditModal: (config: ApiConfig) => void;
  duplicateConfig: (config: ApiConfig) => void;
  deleteConfig: (id: string) => void;
  copyToClipboard: (text: string) => void;
  maskApiKey: (key: string) => string;
  configs: ApiConfig[];
}

export function ApiKeyManagerDetails({
  selectedConfig,
  activeTab,
  openAddModal,
  openEditModal,
  duplicateConfig,
  deleteConfig,
  copyToClipboard,
  maskApiKey,
  configs
}: ApiKeyManagerDetailsProps) {
  return (
    <div className={`w-full lg:flex-1 ${activeTab === 'details' ? 'block' : 'hidden lg:block'}`}>
      {selectedConfig ? (
        <Card className="border border-bambi-border shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-3 border-b border-bambi-border">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl">{selectedConfig.name}</CardTitle>
                <CardDescription className="text-bambi-subtext mt-1">
                  Profil de configuration pour la génération d'images
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => duplicateConfig(selectedConfig)}
                  className="border-bambi-border text-bambi-subtext hover:text-bambi-text p-2.5 h-auto min-w-[40px] flex items-center justify-center"
                  aria-label="Dupliquer ce profil"
                >
                  <CopyIcon className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openEditModal(selectedConfig)}
                  className="border-bambi-border text-bambi-subtext hover:text-bambi-text p-2.5 h-auto min-w-[40px] flex items-center justify-center"
                  aria-label="Modifier ce profil"
                >
                  <PencilIcon className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => deleteConfig(selectedConfig.id)}
                  className="border-bambi-border text-bambi-subtext hover:text-red-500 p-2.5 h-auto min-w-[40px] flex items-center justify-center"
                  aria-label="Supprimer ce profil"
                >
                  <TrashIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <h3 className="text-xs uppercase text-bambi-subtext mb-1 font-medium">Fournisseur</h3>
              <div className="bg-bambi-background border border-bambi-border rounded-md p-3">
                {selectedConfig.provider === 'openai' ? 'OpenAI' : 
                 selectedConfig.provider === 'google' ? 'Google Gemini' : 
                 selectedConfig.provider === 'xai' ? 'xAI' : 
                 selectedConfig.provider}
              </div>
            </div>

            <div>
              <h3 className="text-xs uppercase text-bambi-subtext mb-1 font-medium">Modèle</h3>
              <div className="bg-bambi-background border border-bambi-border rounded-md p-3">
                {selectedConfig.provider === 'openai' && selectedConfig.model === 'dall-e-3' ? 'DALL·E 3' :
                 selectedConfig.provider === 'openai' && selectedConfig.model === 'dall-e-2' ? 'DALL·E 2' :
                 selectedConfig.provider === 'openai' && selectedConfig.model === 'gpt-image' ? 'GPT Image' :
                 selectedConfig.provider === 'google' && selectedConfig.model === 'imagen-2' ? 'Imagen 2 (via Gemini)' :
                 selectedConfig.provider === 'google' && selectedConfig.model === 'imagen-3' ? 'Imagen 3 (via Gemini)' :
                 selectedConfig.provider === 'xai' && selectedConfig.model === 'grok-2-image' ? 'grok-2-image' :
                 selectedConfig.model}
              </div>
            </div>

            <div>
              <h3 className="text-xs uppercase text-bambi-subtext mb-1 font-medium">Clé API</h3>
              <div className="bg-bambi-background border border-bambi-border rounded-md overflow-hidden">
                <div className="flex items-center">
                  <div className="flex-1 p-3 font-mono text-sm overflow-x-auto whitespace-nowrap bambi-scrollbar">
                    {maskApiKey(selectedConfig.key)}
                  </div>
                  <div className="flex items-center border-l border-bambi-border">
                    <button
                      onClick={() => copyToClipboard(selectedConfig.key)}
                      className="p-3 text-bambi-subtext hover:text-bambi-text hover:bg-bambi-border/20"
                      title="Copier la clé"
                      aria-label="Copier la clé API"
                    >
                      <CopyIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {selectedConfig.isValidated && (
                  <div className="border-t border-bambi-border bg-green-500/10 text-green-500 p-2 text-xs flex items-center justify-center">
                    <CheckIcon className="h-3 w-3 mr-1" />
                    Clé validée
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-dashed border-bambi-border p-8 text-center">
          <p className="text-bambi-subtext">
            {configs.length > 0
              ? "Sélectionnez un profil pour voir ses détails"
              : "Vous n'avez aucun profil. Ajoutez-en un pour commencer !"}
          </p>
          {configs.length === 0 && (
            <Button
              onClick={openAddModal}
              className="btn-primary mt-4"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Ajouter un Profil API
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
