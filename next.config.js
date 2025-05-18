/** @type {import('next').NextConfig} */
const webpack = require('webpack');
const nextConfig = {
  // Transpiler les packages Supabase pour résoudre les problèmes de compatibilité ESM/CommonJS
  transpilePackages: ['@supabase/supabase-js', '@supabase/ssr'],

  // Configuration des images pour résoudre les problèmes d'optimisation
  images: {
    domains: ['picsum.photos'], // Ajouter les domaines externes d'images
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Configuration webpack pour résoudre les problèmes de compatibilité ESM/CommonJS
  webpack: (config, { isServer }) => {
    // Résoudre le problème "exports is not defined" pour les modules Supabase
    if (!isServer) {
      // Configurer les polyfills pour les modules Node.js
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        url: require.resolve('url'),
        zlib: require.resolve('browserify-zlib'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        assert: require.resolve('assert'),
        os: require.resolve('os-browserify'),
        path: require.resolve('path-browserify'),
        util: require.resolve('util'),
        querystring: require.resolve('querystring-es3'),
        buffer: require.resolve('buffer'),
        process: require.resolve('process/browser'),
      };

      // Ajouter les plugins nécessaires pour les polyfills
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        })
      );
    }

    return config;
  },
  // Augmenter la taille limite des pages et forcer SWC pour next/font
  experimental: {
    largePageDataBytes: 1024 * 1000, // 1MB (valeur par défaut: 128KB)
    forceSwcTransforms: true, // Forcer l'utilisation de SWC même avec une config Babel personnalisée
  },

  // Activer la compression en production, désactiver en développement
  compress: process.env.NODE_ENV === 'production',
  // Augmenter le délai d'attente pour les requêtes
  httpAgentOptions: {
    keepAlive: true,
  },
  // Désactiver le mode strict en développement pour éviter les problèmes potentiels
  reactStrictMode: process.env.NODE_ENV === 'production',
}

module.exports = nextConfig
