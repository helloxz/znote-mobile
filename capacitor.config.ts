import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.znote.app',
  appName: 'ZNote Mobile',
  webDir: 'dist',
  server: {
    cleartext: true,          // 允许 HTTP 通信（Android 默认禁止明文流量）
    androidScheme: 'http'     // 强制 Capacitor 本地服务器使用 HTTP（默认 HTTPS）
  },
  android: {
    allowMixedContent: true  // 允许 WebView 加载跨域 HTTP 图片等混合内容
  },
  plugins: {
    CapacitorHttp: {
      enabled: true   // 将 fetch/XHR 路由到原生 HTTP，绕过 WebView 混合内容限制
    },
    StatusBar: {
      overlaysWebView: false,   // 状态栏不覆盖 WebView，避免页面顶部内容被系统状态栏遮挡
      style: "LIGHT",           // 浅色背景使用深色状态栏文字/图标
      backgroundColor: "#F7F8FA"
    }
  }
};

export default config;
