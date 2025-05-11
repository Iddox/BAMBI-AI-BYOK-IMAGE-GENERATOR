"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadIcon, ShareIcon, TrashIcon, Maximize2Icon, XIcon } from "lucide-react";

// Types pour les images générées
type GeneratedImage = {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
  isPublic: boolean;
};

export default function GalleryPage() {
  // États et router
  const router = useRouter();
  const [images, setImages] = useState<GeneratedImage[]>([
    // Exemples d'images pour la démo
    {
      id: "img-1",
      url: "https://picsum.photos/seed/1001/512/512",
      prompt: "Un paysage futuriste avec des bâtiments flottants et des cascades",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 heures avant
      isPublic: true,
    },
    {
      id: "img-2",
      url: "https://picsum.photos/seed/1002/512/512",
      prompt: "Portrait d'une femme avec des fleurs dans les cheveux, style art nouveau",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 heures avant
      isPublic: false,
    },
    {
      id: "img-3",
      url: "https://picsum.photos/seed/1003/512/512",
      prompt: "Un chat cyberpunk avec des implants néon dans une ruelle sombre",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 jour avant
      isPublic: true,
    },
    {
      id: "img-4",
      url: "https://picsum.photos/seed/1004/512/512",
      prompt: "Une forêt enchantée avec des créatures magiques et des champignons lumineux",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 jours avant
      isPublic: true,
    },
    {
      id: "img-5",
      url: "https://picsum.photos/seed/1005/512/512",
      prompt: "Un robot dessinant un tableau dans un atelier d'artiste",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 jours avant
      isPublic: false,
    },
    {
      id: "img-6",
      url: "https://picsum.photos/seed/1006/512/512",
      prompt: "Une ville sous-marine avec des bâtiments en forme de coquillages",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 jours avant
      isPublic: true,
    },
  ]);

  // Fonction pour formater la date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) {
      return `${diffDay} jour${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} heure${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return "Just now";
    }
  };

  // État pour le modal d'image agrandie
  const [selectedImageForModal, setSelectedImageForModal] = useState<GeneratedImage | null>(null);

  // Fonction pour ouvrir le modal d'image
  const openImageModal = (image: GeneratedImage) => {
    setSelectedImageForModal(image);
    // Ajouter la classe modal-open au body pour empêcher le défilement
    document.body.classList.add('modal-open');
  };

  // Fonction pour fermer le modal d'image
  const closeImageModal = () => {
    setSelectedImageForModal(null);
    // Retirer la classe modal-open du body pour permettre le défilement
    document.body.classList.remove('modal-open');
  };

  // Nettoyer la classe modal-open lorsque le composant est démonté
  useEffect(() => {
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  // Fonction pour supprimer une image
  const deleteImage = (id: string) => {
    setImages(images.filter(img => img.id !== id));
  };

  return (
    <div className="space-y-8 mt-6">
      {/* Titre élégant et stylisé */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-bambi-accent to-bambi-accentDark bg-clip-text text-transparent inline-block mb-2">
          Galerie d'Images
        </h1>
        <div className="h-1 w-32 bg-gradient-to-r from-bambi-accent to-bambi-accentDark rounded-full mx-auto"></div>
      </div>

      {/* Grille d'images */}
      {images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map(image => (
            <Card key={image.id} className="overflow-hidden border border-[#333333] bg-[#1A1A1A] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:border-bambi-accent/50">
              <div className="relative aspect-square">
                <img
                  src={image.url}
                  alt={image.prompt}
                  className="w-full h-full object-cover rounded-t-xl"
                />
              </div>
              <div className="p-4">
                <div className="text-sm text-bambi-text font-medium mb-1 line-clamp-2 h-10">
                  {image.prompt}
                </div>
                <div className="text-xs text-bambi-subtext mb-3">
                  {formatDate(image.timestamp)}
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#333333] hover:bg-[#222222] rounded-lg">
                      <DownloadIcon className="h-4 w-4 text-bambi-subtext" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#333333] hover:bg-[#222222] rounded-lg">
                      <ShareIcon className="h-4 w-4 text-bambi-subtext" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 border-[#333333] hover:bg-[#222222] rounded-lg"
                      onClick={() => openImageModal(image)}
                    >
                      <Maximize2Icon className="h-4 w-4 text-bambi-subtext" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-[#333333] hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 rounded-lg"
                    onClick={() => deleteImage(image.id)}
                  >
                    <TrashIcon className="h-4 w-4 text-bambi-subtext" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 border border-dashed border-[#333333] rounded-lg">
          <p className="text-bambi-subtext mb-4">
            Vous n'avez pas encore de créations. Générez votre première image !
          </p>
          <Button
            className="bg-bambi-accent hover:bg-bambi-accentDark text-white"
            onClick={() => router.push("/generate")}
          >
            Générer une image
          </Button>
        </div>
      )}

      {/* Modal pour l'affichage de l'image agrandie */}
      {selectedImageForModal && (
        <div
          className="modal-fullscreen"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={closeImageModal}>
          <div
            className="relative bg-[#1A1A1A] rounded-xl border border-[#333333] w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête du modal */}
            <div className="flex justify-between items-center p-3 border-b border-[#333333]">
              <h3 className="text-lg font-medium text-bambi-text">Image détaillée</h3>
              <button
                onClick={closeImageModal}
                className="text-bambi-subtext hover:text-bambi-text rounded-full p-1 hover:bg-[#333333]/30"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Contenu du modal */}
            <div className="flex flex-col md:flex-row p-4 gap-6 overflow-auto">
              {/* Image - agrandie et optimisée */}
              <div className="flex-[2] flex items-center justify-center">
                <img
                  src={selectedImageForModal.url}
                  alt={selectedImageForModal.prompt}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
                />
              </div>

              {/* Informations - section date supprimée */}
              <div className="flex-1 flex flex-col">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-bambi-subtext mb-2">Prompt utilisé</h4>
                  <p className="text-bambi-text text-base bg-[#222222] p-3 rounded-lg border border-[#333333]">
                    {selectedImageForModal.prompt}
                  </p>
                </div>

                <div className="flex space-x-2 mt-auto">
                  <Button variant="outline" size="sm" className="flex-1 border-[#333333] hover:bg-[#222222]">
                    <DownloadIcon className="h-4 w-4 mr-2 text-bambi-subtext" />
                    <span>Télécharger</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 border-[#333333] hover:bg-[#222222]">
                    <ShareIcon className="h-4 w-4 mr-2 text-bambi-subtext" />
                    <span>Partager</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
