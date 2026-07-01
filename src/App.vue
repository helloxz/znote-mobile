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
    // Style.Dark 表示深色图标/文字，适配浅色背景
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#F7F8FA' });
  } catch (e) {
    // 忽略：Web 或不支持的平台
  }
});
</script>
