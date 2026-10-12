import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// `base` must match the GitHub Pages path: https://vladimirradev.github.io/<Repo>/
export default defineConfig({
  base: '/Stellar-Faucet/',
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      // Two pages: the faucet (index.html) and the CV (cv/index.html, served at /Stellar-Faucet/cv/).
      input: { main: 'index.html', cv: 'cv/index.html' },
      output: {
        // Long-lived vendor chunks: React and the web3 stack change less often than app code.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'web3', test: /node_modules[\\/]/ },
          ],
        },
      },
    },
  },
})
