<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="note" href="/note">
          <ion-icon aria-hidden="true" :icon="bookOutline" />
          <ion-label>{{ t("tabs.notes") }}</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="shares" href="/shares">
          <ion-icon aria-hidden="true" :icon="shareOutline" />
          <ion-label>{{ t("tabs.shares") }}</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="me" href="/me">
          <ion-icon aria-hidden="true" :icon="personOutline" />
          <ion-label>{{ t("tabs.me") }}</ion-label>
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
} from "@ionic/vue";
import { bookOutline, shareOutline, personOutline } from "ionicons/icons";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>
