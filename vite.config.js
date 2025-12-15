import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3005,
    strictPort: false, // Allow fallback when port is occupied
    host: 'localhost',
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    }
  },
  build: {
    // تحسينات البناء
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
    },
    // Code Splitting - تقسيم الكود إلى أجزاء أصغر
    rollupOptions: {
      output: {
        manualChunks: {
          // مكتبات React الأساسية
          'react-vendor': ['react', 'react-dom', 'react-i18next', 'i18next'],
          // مكتبات Ant Design
          'antd-vendor': ['antd'],
          // مكتبات معالجة البيانات
          'data-vendor': ['decimal.js', 'xlsx'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd', 'decimal.js'],
    exclude: [],
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})