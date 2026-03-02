import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Polyfill only the modules rss-parser/xml2js need in the browser
      include: ['events', 'stream', 'timers', 'url', 'http', 'https'],
      globals: { process: true },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.allorigins.win',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
