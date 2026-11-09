/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    // The MUI X DataGrid vendor chunk is ~750 kB (~225 kB gzipped) on its own; it's lazy-loaded with the page.
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        // Long-lived vendor chunks: they rarely change, so browsers keep them cached across deploys.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/ },
            { name: 'redux', test: /node_modules[\\/](@reduxjs|react-redux|redux|immer|reselect)[\\/]/ },
            { name: 'mui-grid', test: /node_modules[\\/]@mui[\\/]x-/ },
            { name: 'mui', test: /node_modules[\\/](@mui|@emotion|notistack)[\\/]/ },
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.API_URL ?? 'http://localhost:5080', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
