import { XAIDirectGenerator } from "@/components/xai/XAIDirectGenerator";

export const metadata = {
  title: "Test xAI - Bambi AI",
  description: "Page de test pour l'intégration xAI dans Bambi AI",
};

export default function XAITestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Test de l'intégration xAI</h1>
      <p className="text-center mb-8 text-gray-600">
        Cette page vous permet de tester l'intégration xAI directement, sans passer par la base de données ou d'autres services.
      </p>

      <XAIDirectGenerator />

      <div className="mt-12 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Informations sur l'API xAI</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Modèle utilisé : <code>grok-2-image-1212</code></li>
          <li>Format d'image : JPEG</li>
          <li>Limitations :
            <ul className="list-disc pl-6 mt-2">
              <li>Ne supporte pas le paramètre 'size' (taille fixe)</li>
              <li>Ne supporte pas les paramètres de qualité ou de style</li>
              <li>Maximum 10 images par requête</li>
              <li>Maximum 5 requêtes par seconde</li>
              <li>Prix: $0.07 par image</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
}
