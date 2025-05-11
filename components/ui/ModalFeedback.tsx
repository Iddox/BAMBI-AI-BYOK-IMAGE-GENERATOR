"use client";

import { useState, useEffect } from "react";
import { XIcon, AlertTriangleIcon, AlertCircleIcon, InfoIcon, WifiOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ModalType = "error" | "warning" | "info" | "offline";

type ModalFeedbackProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: ModalType;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
};

export function ModalFeedback({
  isOpen,
  onClose,
  title,
  message,
  type,
  primaryAction,
  secondaryAction,
}: ModalFeedbackProps) {
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Attendre la fin de l'animation
  };

  const getIcon = () => {
    switch (type) {
      case "error":
        return <AlertCircleIcon className="h-6 w-6 text-red-500" />;
      case "warning":
        return <AlertTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case "info":
        return <InfoIcon className="h-6 w-6 text-blue-500" />;
      case "offline":
        return <WifiOffIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={`modal-fullscreen flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >

      <div
        className={`relative bg-bambi-card border border-bambi-border rounded-lg p-6 w-full max-w-md transform transition-all duration-300 ${
          isVisible ? "translate-y-0" : "translate-y-4"
        }`}
      >
        <div className="flex items-start mb-4">
          <div className="mr-3 flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-2 text-bambi-subtext hover:text-bambi-text"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 text-bambi-subtext">
          {message}
        </div>

        <div className="flex justify-end space-x-2">
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={() => {
                secondaryAction.onClick();
                handleClose();
              }}
              className="border-bambi-border"
            >
              {secondaryAction.label}
            </Button>
          )}

          <Button
            onClick={() => {
              if (primaryAction) {
                primaryAction.onClick();
              }
              handleClose();
            }}
            className={type === "error" ? "bg-red-500 hover:bg-red-600 text-white" : "btn-primary"}
          >
            {primaryAction ? primaryAction.label : "Fermer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Fonction pour créer et afficher un modal depuis n'importe où
export function showModal(props: Omit<ModalFeedbackProps, "isOpen" | "onClose">) {
  // Créer un élément div pour le modal
  const modalContainer = document.createElement("div");
  modalContainer.id = `modal-${Date.now()}`;
  document.body.appendChild(modalContainer);

  // Fonction pour fermer et nettoyer le modal
  const closeModal = () => {
    // Supprimer l'élément après la fermeture
    setTimeout(() => {
      if (document.body.contains(modalContainer)) {
        document.body.removeChild(modalContainer);
      }
    }, 300);
  };

  // Rendre le modal dans le conteneur
  const modal = document.createElement("div");
  modalContainer.appendChild(modal);

  // Créer le modal (à implémenter avec ReactDOM.render dans un vrai projet)
  // Pour cette démo, on simule juste l'affichage
  console.log("Modal shown:", props);

  return closeModal;
}
