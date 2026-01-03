import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Atualiza o app automaticamente quando houver nova versão
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'MedLogs - Gestão de Saúde',
        short_name: 'MedLogs',
        description: 'Sistema de gestão de dispensação de medicamentos e prontuários.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // Faz parecer um app nativo (sem barra de URL)
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png', // Você precisará adicionar esta imagem
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // Você precisará adicionar esta imagem
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Configuração de cache
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'], // Cacheia arquivos estáticos
        runtimeCaching: [
          {
            // Exemplo: Cacheia fontes do Google Fonts se estiver usando
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 dias
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
          // NOTA: Não cacheamos API de dados médicos por segurança/integridade nesta etapa.
        ]
      }
    })
  ],
});