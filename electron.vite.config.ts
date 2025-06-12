// electron.vite.config.ts
import tailwindcss from './node_modules/@tailwindcss/vite/dist/index.mjs'
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwindcss()],
    // Configure CSP for Vite dev server
    server: {
      headers: {
        'Content-Security-Policy': [
          "default-src 'self'",
          "connect-src 'self' https://generativelanguage.googleapis.com",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "media-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'"
        ].join('; ')
      }
    },
    // Configure CSP for production build
    build: {
      rollupOptions: {
        output: {
          // Add CSP meta tag to built HTML
          manualChunks: undefined
        }
      }
    }
  }
})
