import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) {
              return 'charts-recharts';
            }
            if (id.includes('d3-')) {
              return 'charts-d3';
            }
            if (id.includes('@xyflow')) {
              return 'flow';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('gsap')) {
              return 'gsap';
            }
            if (id.includes('framer-motion') || id.includes('motion')) {
              return 'motion';
            }
          }
          if (id.includes('src/components/MobileJKN/')) {
            return 'mobile-jkn';
          }
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
})

