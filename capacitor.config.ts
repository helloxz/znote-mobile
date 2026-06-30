import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.znote.app',
  appName: 'znote-mobile',
  webDir: 'dist',
  server: {
    cleartext: true   // 允许 HTTP 通信（Android 默认禁止明文流量）
  }
};

export default config;
