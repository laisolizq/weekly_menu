import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/weekly_menu/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'Menú semanal',
        short_name: 'Menú semanal',
        description: 'Organiza tus comidas y genera tu lista de la compra.',
        start_url: '/weekly_menu/',
        scope: '/weekly_menu/',
        display: 'standalone',
        background_color: '#071116',
        theme_color: '#071116',
        lang: 'es',
        icons: [
          {
            src: '/weekly_menu/icon-1024.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any maskable',
          }
        ],
      },
    }),
  ],
}))
