import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import { createPinia } from 'pinia';
import { IonicVue } from '@ionic/vue';
import i18n from './i18n';
import { initStorage } from './services/storage';
import { registerSW } from 'virtual:pwa-register';
import { useToast } from './composables/useToast';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * 暗色模式（跟随系统）已关闭，当前仅浅色模式；如需开启取消下一行注释即可
 */
/* import '@ionic/vue/css/palettes/dark.system.css'; */

/* Theme variables */
import './theme/variables.css';

/**
 * 应用启动
 * 先异步预加载本地存储（token / 服务器地址 / userInfo）到内存，
 * 再挂载 Vue，保证路由守卫和 axios 拦截器同步读到缓存值
 */
initStorage().then(() => {
  const app = createApp(App)
    .use(IonicVue)
    .use(createPinia())
    .use(router)
    .use(i18n);

  router.isReady().then(() => {
    app.mount('#app');
  });
});

// 注册 PWA Service Worker：监听新版本可用时通过 toast 提示用户刷新
// 仅在 Web 环境生效，Capacitor WebView 中自动忽略，无副作用
const { showToast } = useToast();
registerSW({
  immediate: true,
  onNeedRefresh() {
    // 复用现有 toast 系统，提示用户刷新即可拿到新版本外壳
    showToast('新版本已就绪，请刷新页面以更新', 'success');
  },
});
