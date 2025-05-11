"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiConfig } from "@/contexts/ApiConfigContext";
import {
  API_PROVIDERS,
  PROVIDER_MODELS,
  getProviderLabel,
  getModelLabel
} from "@/lib/constants/api-providers";

interface ApiKeyManagerListProps {
  configs: ApiConfig[];
  selectedConfigId: string | null;
  setSelectedConfigId: (id: string | null) => void;
  openAddModal: () => void;
  setActiveTab: (tab: 'list' | 'details') => void;
  activeTab: 'list' | 'details';
}

export function ApiKeyManagerList({
  configs,
  selectedConfigId,
  setSelectedConfigId,
  openAddModal,
  setActiveTab,
  activeTab
}: ApiKeyManagerListProps) {
  return (
    <div className={`w-full lg:w-1/3 lg:max-w-xs ${activeTab === 'list' ? 'block' : 'hidden lg:block'}`}>
      <div className="bg-bambi-card border border-bambi-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="p-4 border-b border-bambi-border flex justify-between items-center">
          <h2 className="font-semibold">Vos Profils API</h2>
          <span className="text-xs text-bambi-subtext bg-bambi-background px-2 py-1 rounded-full">
            {configs.length} profil{configs.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="divide-y divide-bambi-border max-h-[60vh] overflow-y-auto bambi-scrollbar">
          {configs.map(config => (
            <div
              key={config.id}
              className={`p-4 cursor-pointer transition-all duration-200 hover:bg-bambi-accent/5 ${
                selectedConfigId === config.id ? 'bg-bambi-accent/10 border-l-2 border-bambi-accent' : 'border-l-2 border-transparent'
              }`}
              onClick={() => {
                setSelectedConfigId(config.id);
                setActiveTab('details');
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="font-medium">{config.name}</div>
                </div>
              </div>
              <div className="text-xs text-bambi-subtext mt-1 flex items-center">
                {API_PROVIDERS.find(p => p.value === config.provider)?.label || config.provider}
                <span className="mx-1">•</span>
                {PROVIDER_MODELS[config.provider]?.find(m => m.value === config.model)?.label || config.model}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
