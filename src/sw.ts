/// <reference lib="webworker" />
/* ============================================================
 * znote-mobile PWA Service Worker
 *
 * 设计原则（对齐 AGENTS.md 「当前不做离线」策略）：
 * - 仅 precache 应用外壳（HTML/JS/CSS 等构建产物），实现页面外壳可离线加载
 * - 所有 API 请求走默认 fetch 行为（NetworkOnly），不缓存任何接口数据
 * - 不引入笔记正文离线缓存，避免与 @capacitor/preferences 存储语义冲突
 *
 * 运行环境：
 * - Web 部署：HTTPS 环境下注册生效，提供离线外壳 + 可安装到桌面
 * - Capacitor WebView：SW 自动失效，原生构建链路完全不受影响
 * ============================================================ */
import { precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

// Service Worker 上下文声明：与主线程 Window 不同，需要显式声明为 SW 类型
// __WB_MANIFEST 由 vite-plugin-pwa 在构建时注入实际的 precache 清单
declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: (string | import('workbox-precaching').PrecacheEntry)[] }

// 构建时由 vite-plugin-pwa 注入构建产物清单（dev 环境为空数组）
// 注意：self.__WB_MANIFEST 字面量不可替换，injectManifest 注入器靠正则匹配此字符串定位注入点
precacheAndRoute(self.__WB_MANIFEST)

// 新 SW 安装后立即跳过等待，配合 autoUpdate 实现静默更新
self.addEventListener('message', (event) => {
  // 客户端可通过 postMessage({ type: 'SKIP_WAITING' }) 触发立即接管
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// SW 安装/激活后立即接管所有客户端，确保外壳缓存尽快生效
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  clientsClaim()
})