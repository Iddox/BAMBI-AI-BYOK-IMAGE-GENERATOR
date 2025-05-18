import { OpenAIDirectGenerator } from "@/components/openai/OpenAIDirectGenerator";

export const metadata = {
  title: "Test OpenAI - Bambi AI",
  description: "Page de test pour l'intégration OpenAI dans Bambi AI",
};

export default function OpenAITestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Test de l'intégration OpenAI</h1>
      <p className="text-center mb-8 text-gray-600">
        Cette page vous permet de tester l'intégration OpenAI directement, sans passer par la base de données ou d'autres services.
      </p>

      <OpenAIDirectGenerator />

      <div className="mt-12 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Informations sur l'API OpenAI</h2>
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">
            <strong>ATTENTION :</strong> Cette page utilise l'API OpenAI réelle et consomme des crédits.
            Chaque génération d'image sera facturée sur votre compte OpenAI.
          </p>
        </div>
        <ul className="list-disc pl-6 space-y-2">
          <li>Modèles disponibles :
            <ul className="list-disc pl-6 mt-2">
              <li><code>dall-e-3</code> - Dernière version de DALL-E</li>
              <li><code>gpt-image-1</code> - Nouveau modèle de génération d'images basé sur GPT</li>
            </ul>
          </li>
          <li>Tailles d'images :
            <ul className="list-disc pl-6 mt-2">
              <li>1024x1024 (carré)</li>
              <li>1792x1024 (paysage)</li>
              <li>1024x1792 (portrait)</li>
            </ul>
          </li>
          <li>Qualités disponibles :
            <ul className="list-disc pl-6 mt-2">
              <li>standard - Qualité standard</li>
              <li>hd - Haute définition (uniquement pour DALL-E 3)</li>
            </ul>
          </li>
          <li>Styles disponibles (uniquement pour DALL-E 3) :
            <ul className="list-disc pl-6 mt-2">
              <li>vivid - Style vif et coloré</li>
              <li>natural - Style plus naturel et réaliste</li>
            </ul>
          </li>
          <li>Limitations :
            <ul className="list-disc pl-6 mt-2">
              <li>DALL-E 3 : Maximum 1 image par requête</li>
              <li>GPT Image 1 : Maximum 4 images par requête</li>
              <li>Prix DALL-E 3 : $0.04 par image (standard), $0.08 par image (HD)</li>
              <li>Prix GPT Image 1 : $0.01 par image</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
}
