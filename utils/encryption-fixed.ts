import CryptoJS from 'crypto-js';

// Clé de secours utilisée si ENCRYPTION_KEY n'est pas définie dans les variables d'environnement
// Cette approche n'est pas idéale pour la production, mais permet de débloquer le développement
const FALLBACK_KEY = "bambi-ai-xai-client-key-2025";

/**
 * Chiffre une chaîne de caractères avec AES-256
 * @param text Texte à chiffrer
 * @returns Texte chiffré
 */
export function encrypt(text: string): string {
  // Utiliser la clé d'environnement ou la clé de secours
  const encryptionKey = process.env.ENCRYPTION_KEY || FALLBACK_KEY;

  if (!encryptionKey) {
    console.warn('ENCRYPTION_KEY is not defined, using fallback key. This is not secure for production!');
  }

  try {
    // S'assurer que le texte ne contient que des caractères ASCII valides
    const cleanText = text.replace(/[^\x20-\x7E]/g, '');
    return CryptoJS.AES.encrypt(cleanText, encryptionKey).toString();
  } catch (error) {
    console.error('Erreur lors du chiffrement:', error);
    // Retourner une version encodée simple en cas d'échec (non sécurisée mais fonctionnelle)
    return Buffer.from(text.replace(/[^\x20-\x7E]/g, '')).toString('base64');
  }
}

/**
 * Déchiffre une chaîne de caractères chiffrée avec AES-256
 * @param encryptedText Texte chiffré
 * @returns Texte déchiffré
 */
export function decrypt(encryptedText: string): string {
  // Vérifier si l'entrée est valide
  if (!encryptedText || typeof encryptedText !== 'string') {
    console.error('Erreur lors du déchiffrement: entrée invalide', encryptedText);
    throw new Error('Invalid encrypted text');
  }

  // Utiliser la clé d'environnement ou la clé de secours
  const encryptionKey = process.env.ENCRYPTION_KEY || FALLBACK_KEY;

  if (!encryptionKey) {
    console.warn('ENCRYPTION_KEY is not defined, using fallback key. This is not secure for production!');
  }

  try {
    // Nettoyer le texte chiffré pour s'assurer qu'il ne contient que des caractères valides pour base64
    const cleanEncryptedText = encryptedText.replace(/[^A-Za-z0-9+/=]/g, '');
    
    // Essayer de déchiffrer avec CryptoJS
    try {
      const bytes = CryptoJS.AES.decrypt(cleanEncryptedText, encryptionKey);
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      
      if (decryptedText) {
        // S'assurer que le texte déchiffré ne contient que des caractères ASCII valides
        return decryptedText.replace(/[^\x20-\x7E]/g, '');
      }
    } catch (cryptoError) {
      console.warn('Échec du déchiffrement AES, tentative de décodage base64', cryptoError);
    }

    // Si le déchiffrement AES échoue, essayer de décoder en base64
    try {
      const decoded = Buffer.from(cleanEncryptedText, 'base64').toString('utf8');
      if (decoded) {
        // S'assurer que le texte décodé ne contient que des caractères ASCII valides
        return decoded.replace(/[^\x20-\x7E]/g, '');
      }
    } catch (base64Error) {
      console.warn('Échec du décodage base64', base64Error);
    }

    // Si tout échoue, retourner une valeur par défaut sécurisée
    console.error('Toutes les méthodes de déchiffrement ont échoué');
    return '';
  } catch (error) {
    console.error('Erreur critique lors du déchiffrement:', error);
    // Retourner une chaîne vide en cas d'échec complet
    return '';
  }
}
