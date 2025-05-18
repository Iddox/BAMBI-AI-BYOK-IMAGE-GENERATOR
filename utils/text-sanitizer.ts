/**
 * Utilitaire pour nettoyer et sanitiser les textes avant de les envoyer aux API
 * Permet d'éviter les problèmes d'encodage et de caractères spéciaux
 */

/**
 * Nettoie un texte pour le rendre compatible avec les API qui ont des restrictions d'encodage
 * Remplace les caractères spéciaux et non-ASCII par des équivalents ou les supprime
 *
 * @param text Texte à nettoyer
 * @returns Texte nettoyé
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  // Étape 1: Normaliser le texte (décomposer puis recomposer les caractères accentués)
  let sanitized = text.normalize('NFKD');

  // Étape 2: Remplacer les caractères problématiques connus
  // Utiliser des codes Unicode pour éviter les problèmes de syntaxe
  sanitized = sanitized
    // Caractère de remplacement Unicode (U+FFFD)
    .replace(/\uFFFD/g, '')
    // Tirets
    .replace(/\u2013/g, '-') // Tiret demi-cadratin
    .replace(/\u2014/g, '-') // Tiret cadratin
    // Guillemets
    .replace(/\u201C/g, '"') // Guillemet anglais ouvrant
    .replace(/\u201D/g, '"') // Guillemet anglais fermant
    .replace(/\u2018/g, "'") // Guillemet simple ouvrant
    .replace(/\u2019/g, "'") // Guillemet simple fermant
    // Autres caractères spéciaux
    .replace(/\u2026/g, '...') // Points de suspension
    .replace(/\u2022/g, '*') // Puce
    .replace(/\u00A9/g, '(c)') // Copyright
    .replace(/\u00AE/g, '(r)') // Marque déposée
    .replace(/\u2122/g, '(tm)') // Marque commerciale
    .replace(/\u20AC/g, 'EUR') // Euro
    .replace(/\u00A3/g, 'GBP') // Livre sterling
    .replace(/\u00A5/g, 'JPY') // Yen
    .replace(/\u00B0/g, ' degres ') // Degré
    .replace(/\u00B2/g, '2') // Exposant 2
    .replace(/\u00B3/g, '3') // Exposant 3
    .replace(/\u00BD/g, '1/2') // Fraction un demi
    .replace(/\u00BC/g, '1/4') // Fraction un quart
    .replace(/\u00BE/g, '3/4'); // Fraction trois quarts

  // Étape 3: Supprimer les caractères non-ASCII et non-imprimables
  sanitized = sanitized.replace(/[^\x20-\x7E]/g, '');

  // Étape 4: Supprimer les espaces multiples
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

/**
 * Nettoie un prompt pour le rendre compatible avec les API d'IA
 * Applique des règles spécifiques pour les prompts de génération d'images
 *
 * @param prompt Prompt à nettoyer
 * @param provider Fournisseur d'API (optionnel)
 * @returns Prompt nettoyé
 */
export function sanitizePrompt(prompt: string, provider?: string): string {
  if (!prompt) return '';

  // Sanitisation de base
  let sanitized = sanitizeText(prompt);

  // Règles spécifiques selon le fournisseur
  if (provider === 'xai') {
    // xAI est particulièrement sensible aux caractères spéciaux
    // Limiter la longueur du prompt pour xAI
    sanitized = sanitized.substring(0, 1000);
  } else if (provider === 'openai') {
    // OpenAI accepte des prompts plus longs
    sanitized = sanitized.substring(0, 4000);
  } else if (provider === 'gemini' || provider === 'google') {
    // Google Gemini a ses propres limites
    sanitized = sanitized.substring(0, 2000);
  } else {
    // Limite par défaut
    sanitized = sanitized.substring(0, 1000);
  }

  return sanitized;
}
