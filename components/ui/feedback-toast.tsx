"use client";

import * as React from "react";
import { CheckIcon, AlertCircleIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FeedbackToastProps {
  type: "success" | "error" | "info";
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  className?: string;
}

export const FeedbackToast = React.forwardRef<
  HTMLDivElement,
  FeedbackToastProps
>(({
  type = "info",
  message,
  onClose,
  autoClose = true,
  autoCloseDelay = 3000,
  className,
  ...props
}, ref) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsExiting(true);
    
    // Attendre la fin de l'animation avant de fermer complètement
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300); // Durée de l'animation de sortie
  };

  if (!isVisible) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center",
        "animate-fade-in",
        isExiting && "animate-fade-out",
        type === "success" && "bg-green-500/90 text-white",
        type === "error" && "bg-red-500/90 text-white",
        type === "info" && "bg-bambi-accent/90 text-white",
        className
      )}
      {...props}
    >
      {type === "success" && (
        <CheckIcon className="h-5 w-5 mr-2" />
      )}
      {type === "error" && (
        <AlertCircleIcon className="h-5 w-5 mr-2" />
      )}
      {type === "info" && (
        <div className="h-5 w-5 mr-2 flex items-center justify-center">
          <span className="text-lg font-bold">i</span>
        </div>
      )}
      <span className="text-sm sm:text-base">{message}</span>
      <button
        onClick={handleClose}
        className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Fermer"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
});

FeedbackToast.displayName = "FeedbackToast";

// Contexte pour gérer les toasts à travers l'application
type Toast = {
  id: string;
  type: "success" | "error" | "info";
  message: string;
};

type ToastContextType = {
  toasts: Toast[];
  addToast: (type: "success" | "error" | "info", message: string) => void;
  removeToast: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center p-4 space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <FeedbackToast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
            className="pointer-events-auto"
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
