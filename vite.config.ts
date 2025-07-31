import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
  ],

  // Build configuration optimized for Vercel static hosting
  build: {
    // Output directory (Vercel expects 'dist' by default)
    outDir: 'dist',

    // Generate source maps for debugging (optional, can disable for smaller builds)
    sourcemap: false,

    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        // Split vendor libraries into separate chunks for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },

        // Optimize asset naming for caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },

    // Optimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },

    // Set chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },

  // Development server configuration
  server: {
    port: 3000,
    host: true, // Allow external connections
    open: true, // Auto-open browser
  },

  // Preview server configuration (for npm run preview)
  preview: {
    port: 4173,
    host: true,
  },

  // Base URL configuration for deployment
  base: '/',

  // Public directory configuration
  publicDir: 'public',

  // Asset handling
  assetsInclude: ['**/*.json'], // Ensure JSON files are treated as assets

  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
});
