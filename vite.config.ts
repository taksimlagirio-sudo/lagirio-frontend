import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// ❌ BU SATIRI SİLİN: import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // ❌ TÜM PWA PLUGIN KODUNU SİLİN
  ],
  
  build: {
    outDir: 'dist',
    copyPublicDir: true,
    
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
        }
      }
    },
    
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      }
    },
    
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    sourcemap: false,
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
  },
  
  server: {
    port: 5173,
    host: true,
  },
  
  preview: {
    port: 4173,
    host: true
  }
});