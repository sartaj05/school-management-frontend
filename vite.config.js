import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Keep the authenticated shell and each feature module in separate
    // browser-cacheable chunks. DashboardPage owns many school modules, so a
    // single entry chunk would otherwise grow past Vite's warning threshold.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'
          const componentPath = id.split('/src/components/')[1]
          if (componentPath) {
            const componentName = componentPath.split('/')[0].replace(/\.jsx?$/, '').toLowerCase()
            return `feature-${componentName}`
          }
          return undefined
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
})
