import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.znote.app',
  appName: 'znote-mobile',
  webDir: 'dist',
  server: {
    cleartext: true   // 允许 HTTP 通信（Android 默认禁止明文流量）
  },
  plugins: {
    CapacitorHttp: {
      enabled: true   // 将 fetch/XHR 路由到原生 HTTP，绕过 WebView 混合内容限制
    }
  }
};

export default config;
