'use client';

/**
 * Utilitaires de débogage pour identifier les problèmes de chargement et les boucles infinies
 */

// Fonction pour enregistrer les événements de chargement avec un timestamp
export function logLoadingEvent(component: string, event: string, data?: any) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${component} - ${event}`;
  
  if (data) {
    console.log(message, data);
  } else {
    console.log(message);
  }
  
  // Ajouter l'événement à l'historique de débogage dans localStorage
  try {
    const debugHistory = JSON.parse(localStorage.getItem('debug_history') || '[]');
    debugHistory.push({ timestamp, component, event, data });
    
    // Limiter l'historique à 100 entrées pour éviter de surcharger localStorage
    if (debugHistory.length > 100) {
      debugHistory.shift();
    }
    
    localStorage.setItem('debug_history', JSON.stringify(debugHistory));
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'historique de débogage:', error);
  }
}

// Fonction pour effacer l'historique de débogage
export function clearDebugHistory() {
  try {
    localStorage.removeItem('debug_history');
    console.log('Historique de débogage effacé');
  } catch (error) {
    console.error('Erreur lors de l\'effacement de l\'historique de débogage:', error);
  }
}

// Fonction pour récupérer l'historique de débogage
export function getDebugHistory() {
  try {
    return JSON.parse(localStorage.getItem('debug_history') || '[]');
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique de débogage:', error);
    return [];
  }
}

// Fonction pour détecter les boucles potentielles
export function detectLoadingLoop() {
  try {
    const history = getDebugHistory();
    const loadingEvents = history.filter(entry => entry.event.includes('loading') || entry.event.includes('Loading'));
    
    // Si plus de 10 événements de chargement en moins de 5 secondes, c'est probablement une boucle
    if (loadingEvents.length > 10) {
      const lastEvents = loadingEvents.slice(-10);
      const firstTimestamp = new Date(lastEvents[0].timestamp).getTime();
      const lastTimestamp = new Date(lastEvents[lastEvents.length - 1].timestamp).getTime();
      
      if (lastTimestamp - firstTimestamp < 5000) {
        console.error('ALERTE: Boucle de chargement potentielle détectée!');
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Erreur lors de la détection de boucle:', error);
    return false;
  }
}

// Hook pour surveiller les changements d'état et détecter les boucles potentielles
export function monitorStateChanges(componentName: string, stateObject: Record<string, any>) {
  // Enregistrer l'état actuel
  logLoadingEvent(componentName, 'State update', stateObject);
  
  // Vérifier s'il y a une boucle potentielle
  if (detectLoadingLoop()) {
    // Afficher un avertissement dans la console
    console.warn('Boucle potentielle détectée dans', componentName);
    console.table(getDebugHistory().slice(-20));
  }
}
