<template>
  <ion-list class="menu-list">
    <ion-item button :detail="false" @click="onChangePassword">
      <ion-icon :icon="keyOutline" slot="start" class="menu-icon" />
      <ion-label>{{ t("note.menu.changePassword") }}</ion-label>
    </ion-item>
    <ion-item button :detail="false" @click="onLogout">
      <ion-icon :icon="logOutOutline" slot="start" class="menu-icon" />
      <ion-label>{{ t("note.menu.logout") }}</ion-label>
    </ion-item>
  </ion-list>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { IonList, IonItem, IonIcon, IonLabel, popoverController } from "@ionic/vue";
import { keyOutline, logOutOutline } from "ionicons/icons";

const { t } = useI18n();

/** 点击修改密码：dismiss 并回传 action，由父组件处理跳转 */
const onChangePassword = () => {
  popoverController.dismiss({ action: "changePassword" });
};

/** 点击退出：dismiss 并回传 action，由父组件处理登出逻辑 */
const onLogout = () => {
  popoverController.dismiss({ action: "logout" });
};
</script>

<style scoped>
.menu-list {
  padding: 0;
  min-width: 180px;
}

.menu-icon {
  color: var(--z-text-secondary);
}
</style>
