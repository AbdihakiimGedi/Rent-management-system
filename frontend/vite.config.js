import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({

  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/owner': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/renter': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  optimizeDeps: {
    include: ['react-csv', 'jspdf', 'jspdf-autotable']
  },
  build: {
    rollupOptions: {
      external: ['prop-types'],
      output: {
        globals: {
          'prop-types': 'PropTypes'
        }
      }
    }
  }
})
