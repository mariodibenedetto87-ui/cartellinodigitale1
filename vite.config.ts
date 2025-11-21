import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false, // Disabilitato in produzione per sicurezza
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js']
          // vendor-google rimosso - non usato nell'app
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true, // Rimuove TUTTI i console.* in produzione
        drop_debugger: true
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js']
  },
  server: {
    port: 5173,
    open: true
  }
})
