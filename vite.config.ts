import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: [
          '.ts.net'
        ],
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'prompt', // Стратегия обновления
          includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
          manifest: {
            name: 'Story Helper',
            short_name: 'StoryHelper',
            description: 'An Italian storytelling practice app.',
            theme_color: '#ffffff',
            background_color: '#F8FAFC',
            display: 'standalone', // Скрываем адресную строку
            icons: [
              {
                src: 'android-chrome-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'android-chrome-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'] // Кэширование статики (App Shell)
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
