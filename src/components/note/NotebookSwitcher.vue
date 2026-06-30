<template>
  <ion-list class="notebook-popover">
    <div class="popover-header">{{ t("note.switchNotebook") }}</div>
    <ion-item
      v-for="nb in noteStore.notebookTree"
      :key="nb.id"
      button
      :detail="false"
      :class="{ active: nb.id === noteStore.activeNotebookId }"
      @click="onSelect(nb.id)"
    >
      <ion-icon
        :icon="nb.id === noteStore.activeNotebookId ? book : bookOutline"
        slot="start"
        class="nb-icon"
      />
      <ion-label>{{ nb.title }}</ion-label>
      <ion-icon
        v-if="nb.id === noteStore.activeNotebookId"
        :icon="checkmark"
        slot="end"
        class="check-icon"
      />
    </ion-item>
    <div v-if="noteStore.notebookTree.length === 0" class="empty-hint">
      {{ t("note.empty") }}
    </div>
  </ion-list>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  popoverController,
} from "@ionic/vue";
import { book, bookOutline, checkmark } from "ionicons/icons";
import { useNoteStore } from "@/stores/note";

const { t } = useI18n();
const noteStore = useNoteStore();

/** 选择笔记本：dismiss 并回传 id，由父组件处理切换逻辑 */
const onSelect = (id: number) => {
  popoverController.dismiss({ notebookId: id });
};
</script>

<style scoped>
.notebook-popover {
  padding: 0;
  min-width: 220px;
  max-height: 60vh;
  overflow-y: auto;
}

.popover-header {
  font-size: var(--z-fs-caption);
  font-weight: 600;
  color: var(--z-text-tertiary);
  padding: 12px 16px 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

ion-item.active {
  --color: var(--z-primary);
  font-weight: 500;
}

.nb-icon {
  color: var(--z-text-secondary);
}

ion-item.active .nb-icon {
  color: var(--z-primary);
}

.check-icon {
  color: var(--z-primary);
  font-size: 18px;
}

.empty-hint {
  padding: 16px;
  font-size: var(--z-fs-caption);
  color: var(--z-text-tertiary);
  text-align: center;
}
</style>
