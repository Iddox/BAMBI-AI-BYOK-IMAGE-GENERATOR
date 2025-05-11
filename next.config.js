/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimisation pour résoudre les problèmes de chargement de chunks
  webpack: (config, { dev, isServer }) => {
    // Augmenter la taille maximale des chunks
    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      maxSize: 250000, // Taille maximale des chunks réduite pour éviter les problèmes
      cacheGroups: {
        default: false,
        vendors: false,
        framework: {
          name: 'framework',
          test: /[\\/]node_modules[\\/](@react|react|react-dom|next|framer-motion)[\\/]/,
          priority: 40,
          enforce: true,
        },
        lib: {
          test: /[\\/]node_modules[\\/](?!(@react|react|react-dom|next|framer-motion)[\\/])/,
          name(module) {
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            return `npm.${packageName.replace('@', '')}`;
          },
          priority: 30,
          minChunks: 1,
          reuseExistingChunk: true,
        },
        // Groupe spécifique pour les composants de dashboard
        dashboard: {
          test: /[\\/]components[\\/]dashboard[\\/]/,
          name: 'dashboard-components',
          priority: 25,
          minChunks: 1,
          reuseExistingChunk: true,
        },
        commons: {
          name: 'commons',
          minChunks: 2,
          priority: 20,
        },
        shared: {
          name: 'shared',
          priority: 10,
          minChunks: 2,
          reuseExistingChunk: true,
        },
      },
    };

    // Désactiver la compression uniquement en développement
    if (dev) {
      config.optimization.minimize = false;
    } else {
      // En production, activer la compression
      config.optimization.minimize = true;
    }

    // Ajouter une configuration pour gérer les erreurs de chargement de chunks
    if (!isServer) {
      // Ajouter un plugin pour gérer les erreurs de chargement de chunks
      config.output.chunkLoadingGlobal = 'bambiJsonp';

      // Augmenter le timeout pour le chargement des chunks
      config.output.chunkLoadTimeout = 120000; // 2 minutes
    }

    return config;
  },
  // Augmenter la taille limite des pages
  experimental: {
    largePageDataBytes: 512 * 1000, // 512KB (valeur par défaut: 128KB)
  },
  // Activer la compression en production, désactiver en développement
  compress: process.env.NODE_ENV === 'production',
  // Augmenter le délai d'attente pour les requêtes
  httpAgentOptions: {
    keepAlive: true,
    timeout: 60000, // 60 secondes
  },
  // Activer le mode strict uniquement en production
  reactStrictMode: process.env.NODE_ENV === 'production',
  // Optimiser la gestion des erreurs
  onDemandEntries: {
    // Période pendant laquelle les pages compilées sont conservées en mémoire
    maxInactiveAge: 60 * 60 * 1000, // 1 heure
    // Nombre de pages conservées en mémoire
    pagesBufferLength: 5,
  },
}

module.exports = nextConfig
