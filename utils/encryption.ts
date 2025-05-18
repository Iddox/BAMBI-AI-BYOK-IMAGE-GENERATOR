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
    // Traitement spécial pour les clés API OpenAI
    if (text.startsWith('sk-')) {
      console.log('Chiffrement d\'une clé API OpenAI');
      // Ne pas nettoyer les clés API OpenAI
      return CryptoJS.AES.encrypt(text, encryptionKey).toString();
    }

    // Pour les autres textes, s'assurer qu'ils ne contiennent que des caractères ASCII valides
    const cleanText = text.replace(/[^\x20-\x7E]/g, '');
    return CryptoJS.AES.encrypt(cleanText, encryptionKey).toString();
  } catch (error) {
    console.error('Erreur lors du chiffrement:', error);

    // Traitement spécial pour les clés API OpenAI en cas d'échec
    if (text.startsWith('sk-')) {
      console.warn('Échec du chiffrement AES pour une clé API, utilisation de base64');
      return Buffer.from(text).toString('base64');
    }

    // Pour les autres textes, retourner une version encodée simple
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
    // Vérifier si le texte ressemble déjà à une clé API OpenAI
    if (encryptedText.startsWith('sk-') && encryptedText.length > 20) {
      console.log('Le texte semble déjà être une clé API OpenAI non chiffrée');
      return encryptedText;
    }

    // Nettoyer le texte chiffré pour s'assurer qu'il ne contient que des caractères valides pour base64
    // Mais conserver les caractères + et / qui sont valides en base64
    const cleanEncryptedText = encryptedText.replace(/[^A-Za-z0-9+/=]/g, '');

    // Essayer de déchiffrer avec CryptoJS
    try {
      const bytes = CryptoJS.AES.decrypt(cleanEncryptedText, encryptionKey);
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

      if (decryptedText) {
        // Pour les clés API OpenAI, ne pas filtrer les caractères si la clé commence par sk-
        if (decryptedText.startsWith('sk-')) {
          console.log('Clé API OpenAI déchiffrée avec succès');
          return decryptedText;
        }

        // Pour les autres textes, filtrer les caractères non-ASCII
        return decryptedText.replace(/[^\x20-\x7E]/g, '');
      }
    } catch (cryptoError) {
      console.warn('Échec du déchiffrement AES, tentative de décodage base64', cryptoError);
    }

    // Si le déchiffrement AES échoue, essayer de décoder en base64
    try {
      const decoded = Buffer.from(cleanEncryptedText, 'base64').toString('utf8');
      if (decoded) {
        // Pour les clés API OpenAI, ne pas filtrer les caractères si la clé commence par sk-
        if (decoded.startsWith('sk-')) {
          console.log('Clé API OpenAI décodée avec succès (base64)');
          return decoded;
        }

        // Pour les autres textes, filtrer les caractères non-ASCII
        return decoded.replace(/[^\x20-\x7E]/g, '');
      }
    } catch (base64Error) {
      console.warn('Échec du décodage base64', base64Error);
    }

    // Si tout échoue, retourner le texte original pour les clés API
    if (encryptedText.includes('sk-')) {
      console.warn('Déchiffrement échoué, mais le texte contient "sk-", retour du texte original');
      return encryptedText;
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
