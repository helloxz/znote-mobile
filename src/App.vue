<template>
  <ion-app>
    <ion-router-outlet />
    <ToastContainer />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import ToastContainer from '@/components/ToastContainer.vue';
import { onMounted } from 'vue';
import { StatusBar, Style } from '@capacitor/status-bar';

// 应用启动后配置状态栏：浅色背景下使用深色图标，并同步背景色
// Web 端无 StatusBar，调用会被自动忽略
onMounted(async () => {
  try {
    // 禁止状态栏覆盖 WebView，避免 Android/MIUI 机型顶部内容被状态栏遮挡
    await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => undefined);
    // Style.Light 表示深色图标/文字，适配浅色背景
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#F7F8FA' }).catch(() => undefined);

    // Android 15+ 强制 edge-to-edge，overlaysWebView/backgroundColor 可能失效。
    // 这类设备即使 info.overlays=false，WebView 仍可能画到状态栏下方，需要主动补顶部安全区。
    const info = await StatusBar.getInfo();
    const androidVersion = navigator.userAgent.match(/Android\s+(\d+)/i);
    const isAndroidEdgeToEdge = androidVersion ? Number(androidVersion[1]) >= 15 : false;
    const safeTop = info.overlays || isAndroidEdgeToEdge ? `${info.height}px` : '0px';
    document.documentElement.style.setProperty('--z-status-bar-height', safeTop);
  } catch (e) {
    // 忽略：Web 或不支持的平台
  }
});
</script>
