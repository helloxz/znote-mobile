<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ t("tabs.search") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="tab-content">
      <div class="placeholder">
        <ion-icon :icon="searchOutline" class="placeholder-icon" />
        <p class="placeholder-text">{{ t("placeholder.search") }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon } from '@ionic/vue';
import { searchOutline } from 'ionicons/icons';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped>
.tab-content {
  --background: var(--z-bg-page);
}
.placeholder {
  text-align: center;
  padding-top: 30vh;
}
.placeholder-icon {
  font-size: 48px;
  color: var(--z-text-disabled);
}
.placeholder-text {
  margin-top: 12px;
  font-size: var(--z-fs-body);
  color: var(--z-text-tertiary);
}
</style>
