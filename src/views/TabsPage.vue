<template>
  <ion-page>
    <!-- 左侧侧边栏：放在 ion-tabs 外部，确保 z-index 高于 tab-bar，
         菜单打开时覆盖整个页面（含底部 Tab 栏） -->
    <ion-menu menu-id="note-menu" content-id="note-content" side="start">
      <div class="menu-scroll">
        <SidebarMenu @select="onCategorySelected" />
      </div>
    </ion-menu>

    <!-- 隐藏的 ion-content：作为菜单拖拽手势的监听目标，始终存在于 DOM 中 -->
    <ion-content id="note-content" class="menu-content-host" :aria-hidden="true" />

    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="note" href="/note">
          <ion-icon aria-hidden="true" :icon="documentTextOutline" />
          <ion-label>{{ t("tabs.notes") }}</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="shares" href="/shares">
          <ion-icon aria-hidden="true" :icon="shareOutline" />
          <ion-label>{{ t("tabs.shares") }}</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="trash" href="/trash">
          <ion-icon aria-hidden="true" :icon="trashOutline" />
          <ion-label>{{ t("tabs.trash") }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonLabel,
  IonIcon,
  IonPage,
  IonRouterOutlet,
  IonMenu,
  IonContent,
  menuController,
} from "@ionic/vue";
import { documentTextOutline, shareOutline, trashOutline } from "ionicons/icons";
import { useI18n } from "vue-i18n";
import SidebarMenu from "@/components/note/SidebarMenu.vue";

const { t } = useI18n();

/** 选中分类后：关闭侧边栏 */
const onCategorySelected = () => {
  void menuController.close("note-menu");
};
</script>

<style scoped>
/* 侧边栏滚动容器：普通 div 自滚动，避开 Ionic 滚动锁机制 */
.menu-scroll {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
  background: var(--z-bg-page);
}

/* 隐藏的菜单 content 宿主：不显示、不占空间，仅作为拖拽手势监听目标 */
.menu-content-host {
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  --background: transparent;
}
</style>
