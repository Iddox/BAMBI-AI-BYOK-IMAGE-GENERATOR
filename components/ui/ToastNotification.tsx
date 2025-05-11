"use client";

import { useState, useEffect } from "react";
import { XIcon, CheckCircleIcon, AlertCircleIcon, InfoIcon } from "lucide-react";

type ToastType = "success" | "error" | "info";

type ToastProps = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
};

export function Toast({ id, type, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Attendre la fin de l'animation
    }, duration);
    
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);
  
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircleIcon className="h-5 w-5 text-red-500" />;
      case "info":
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500/10 border-green-500/30";
      case "error":
        return "bg-red-500/10 border-red-500/30";
      case "info":
        return "bg-blue-500/10 border-blue-500/30";
    }
  };
  
  const getTextColor = () => {
    switch (type) {
      case "success":
        return "text-green-500";
      case "error":
        return "text-red-500";
      case "info":
        return "text-blue-500";
    }
  };
  
  return (
    <div 
      className={`flex items-center p-4 rounded-lg border ${getBgColor()} ${getTextColor()} mb-2 transform transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="mr-3 flex-shrink-0">
        {getIcon()}
      </div>
      <div className="mr-2 flex-1">{message}</div>
      <button 
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(id), 300);
        }}
        className="flex-shrink-0 ml-2 text-bambi-subtext hover:text-bambi-text"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

type ToastContainerProps = {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
};

export function ToastContainer({ position = "top-right" }: ToastContainerProps) {
  const [toasts, setToasts] = useState<Array<{ id: string; type: ToastType; message: string }>>([]);
  
  // Fonction pour ajouter un toast
  const addToast = (type: ToastType, message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
  };
  
  // Fonction pour supprimer un toast
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  // Exposer les fonctions au window pour les utiliser depuis n'importe où
  useEffect(() => {
    // @ts-ignore
    window.showToast = {
      success: (message: string) => addToast("success", message),
      error: (message: string) => addToast("error", message),
      info: (message: string) => addToast("info", message),
    };
    
    return () => {
      // @ts-ignore
      delete window.showToast;
    };
  }, []);
  
  const getPositionClasses = () => {
    switch (position) {
      case "top-right":
        return "top-4 right-4";
      case "top-left":
        return "top-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
    }
  };
  
  return (
    <div className={`fixed z-50 ${getPositionClasses()} w-80`}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}
