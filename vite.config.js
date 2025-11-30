import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3001, // Starting port, Vite will use next available if taken
    strictPort: false // Allow Vite to use another port if 3001 is taken
  }
})