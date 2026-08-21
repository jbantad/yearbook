import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Scrapbook',
        short_name: 'Scrapbook',
        description: 'A journal that looks and feels like a paper scrapbook.',
        start_url: '/',
        display: 'standalone',
        background_color: '#e3d6c2',
        theme_color: '#c16e2d',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App-shell caching only — Supabase calls stay network-only so
        // signed-in data is never served stale or to the wrong account.
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,ttf,woff,woff2}'],
      },
    }),
  ],
})
