import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Seule la clé Gemini est conservée pour les fonctions IA.
    // Toute référence à reCAPTCHA est supprimée pour laisser Firebase gérer l'auth téléphone automatiquement.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
  }
});