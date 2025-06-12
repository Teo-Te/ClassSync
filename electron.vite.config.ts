// electron.vite.config.ts
import tailwindcss from './node_modules/@tailwindcss/vite/dist/index.mjs'
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

// Custom plugin to handle CSP
function cspPlugin() {
  return {
    name: 'csp-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Remove or modify CSP header
        res.removeHeader('Content-Security-Policy')
        next()
      })
    }
  }
}

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
    plugins: [react(), tailwindcss(), cspPlugin()]
  }
})
