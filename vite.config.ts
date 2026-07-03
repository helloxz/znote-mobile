/// <reference types="vitest" />

import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // PWA 支持：仅缓存应用外壳（HTML/JS/CSS），API 请求走 NetworkOnly
    // Capacitor WebView 中 SW 自动失效，不影响原生构建链路
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'ZNote Mobile',
        short_name: 'ZNote',
        description: 'ZNote 移动端笔记应用',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#F7F8FA',
        theme_color: '#FF6900',
        icons: [
          { src: '/icons/icon-48.webp', type: 'image/webp', sizes: '48x48', purpose: 'any' },
          { src: '/icons/icon-72.webp', type: 'image/webp', sizes: '72x72', purpose: 'any' },
          { src: '/icons/icon-96.webp', type: 'image/webp', sizes: '96x96', purpose: 'any' },
          { src: '/icons/icon-128.webp', type: 'image/webp', sizes: '128x128', purpose: 'any' },
          { src: '/icons/icon-192.webp', type: 'image/webp', sizes: '192x192', purpose: 'any' },
          { src: '/icons/icon-256.webp', type: 'image/webp', sizes: '256x256', purpose: 'any' },
          { src: '/icons/icon-512.webp', type: 'image/webp', sizes: '512x512', purpose: 'any' },
          { src: '/icons/icon-512.webp', type: 'image/webp', sizes: '512x512', purpose: 'maskable' },
        ],
      },
    }),
  ],
  // 开发服务器配置：监听 0.0.0.0 允许内网其他设备访问
  server: {
    host: '0.0.0.0',
    port:8000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
