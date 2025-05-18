'use client';

import { useState, useEffect } from 'react';
import { getDebugHistory, clearDebugHistory } from '@/utils/debug';

/**
 * Composant pour afficher l'historique de débogage
 * Utile pour identifier les problèmes de chargement et les boucles infinies
 */
export function DebugPanel() {
  const [history, setHistory] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Mettre à jour l'historique toutes les secondes
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setHistory(getDebugHistory());
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Charger l'historique initial
  useEffect(() => {
    setHistory(getDebugHistory());
  }, []);

  if (!isVisible) {
    return (
      <button
        className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded-full z-50 opacity-50 hover:opacity-100"
        onClick={() => setIsVisible(true)}
        suppressHydrationWarning
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 text-white p-4 z-50 overflow-auto" suppressHydrationWarning>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Historique de débogage</h2>
        <div className="flex gap-2">
          <button
            className="bg-red-500 text-white px-3 py-1 rounded"
            onClick={() => {
              clearDebugHistory();
              setHistory([]);
            }}
          >
            Effacer
          </button>
          <button
            className="bg-gray-500 text-white px-3 py-1 rounded"
            onClick={() => setIsVisible(false)}
          >
            Fermer
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-800">
              <th className="border border-gray-700 p-2 text-left">Timestamp</th>
              <th className="border border-gray-700 p-2 text-left">Composant</th>
              <th className="border border-gray-700 p-2 text-left">Événement</th>
              <th className="border border-gray-700 p-2 text-left">Données</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={4} className="border border-gray-700 p-2 text-center">
                  Aucun événement enregistré
                </td>
              </tr>
            ) : (
              history.map((entry, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'}>
                  <td className="border border-gray-700 p-2">{new Date(entry.timestamp).toLocaleTimeString()}</td>
                  <td className="border border-gray-700 p-2">{entry.component}</td>
                  <td className="border border-gray-700 p-2">{entry.event}</td>
                  <td className="border border-gray-700 p-2">
                    {entry.data ? JSON.stringify(entry.data) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
