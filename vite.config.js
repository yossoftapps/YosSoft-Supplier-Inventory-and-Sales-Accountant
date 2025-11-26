import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3001, // Starting port, Vite will use next available if taken
    strictPort: true // هذا السطر يجبر Vite على استخدام المنفذ 3001 فقط
  }
})