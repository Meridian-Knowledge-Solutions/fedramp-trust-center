import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// [https://vitejs.dev/config/](https://vitejs.dev/config/)
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Set this to your repo name for GitHub Pages
  base: '/fedramp-20x-public/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})