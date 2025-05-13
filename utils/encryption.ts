import CryptoJS from 'crypto-js';

/**
 * Chiffre une chaîne de caractères avec AES-256
 * @param text Texte à chiffrer
 * @returns Texte chiffré
 */
export function encrypt(text: string): string {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  }
  
  return CryptoJS.AES.encrypt(text, process.env.ENCRYPTION_KEY).toString();
}

/**
 * Déchiffre une chaîne de caractères chiffrée avec AES-256
 * @param encryptedText Texte chiffré
 * @returns Texte déchiffré
 */
export function decrypt(encryptedText: string): string {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  }
  
  const bytes = CryptoJS.AES.decrypt(encryptedText, process.env.ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
