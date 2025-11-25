import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Use root path for dev, subdirectory for production
  base: command === 'serve' ? '/' : '/fedramp-trust-center/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
}))