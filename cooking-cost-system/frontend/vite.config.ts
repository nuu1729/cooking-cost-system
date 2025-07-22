import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
            name: '料理原価計算システム',
            short_name: 'CookingCost',
            description: 'モダンな料理原価計算システム',
            theme_color: '#1976d2',
            background_color: '#ffffff',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            icons: [
            {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
            },
            {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png'
            }
            ]
        },
        workbox: {
            runtimeCaching: [
            {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
                },
                cacheKeyWillBeUsed: async ({ request }) => {
                    return `${request.url}?${Date.now()}`;
                }
                }
            },
            {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
                }
                }
            }
            ]
        }
        })
    ],
    
    resolve: {
        alias: {
        '@': path.resolve(__dirname, './src'),
        },
    },
    
    server: {
        host: '0.0.0.0',
        port: 3000,
        proxy: {
        '/api': {
            target: process.env.VITE_API_URL || 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
        },
        '/uploads': {
            target: process.env.VITE_API_URL || 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
        }
        }
    },
    
    preview: {
        host: '0.0.0.0',
        port: 3000,
    },
    
    build: {
        outDir: 'build',
        sourcemap: true,
        rollupOptions: {
        output: {
            manualChunks: {
            vendor: ['react', 'react-dom'],
            mui: ['@mui/material', '@mui/icons-material'],
            utils: ['lodash', 'date-fns', 'axios'],
            }
        }
        },
        chunkSizeWarningLimit: 1000,
    },
    
    optimizeDeps: {
        include: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled'],
    },
    
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        css: true,
    },
    
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
        __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    },
});