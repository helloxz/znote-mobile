<template>
  <IonModal
    :is-open="show"
    :breakpoints="[0, 0.7, 1]"
    :initial-breakpoint="0.7"
    @didDismiss="onCancel"
  >
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ dialogTitle }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="onCancel">{{ t("note.category.cancel") }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- 源信息 -->
      <div class="source-info">
        <span class="source-label">{{ t("note.category.move.source") }}：</span>
        <span class="source-name">{{ sourceName }}</span>
      </div>

      <!-- 目标选择提示 -->
      <div class="select-hint">{{ t("note.category.move.selectTarget") }}</div>

      <!-- 分类树列表 -->
      <div class="category-list">
        <CategoryNode
          v-for="node in categoryTree"
          :key="node.id"
          :node="node"
          :level="0"
          :exclude-ids="excludeSet"
          :current-id="currentCategoryId ?? -1"
          :selected-id="selectedId"
          :expanded-ids="expandedIds"
          @select="onSelect"
          @toggle="onToggle"
        />
      </div>
    </ion-content>

    <!-- 底部确认按钮 -->
    <ion-footer class="modal-footer">
      <ion-button
        expand="block"
        :disabled="selectedId === null"
        @click="onConfirm"
      >
        {{ t("note.category.move.toHere") }}
      </ion-button>
    </ion-footer>
  </IonModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonFooter,
} from "@ionic/vue";
import { useI18n } from "vue-i18n";
import type { NotebookNode } from "@/types/note";
import CategoryNode from "./CategoryNode.vue";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    show: boolean;
    /** 弹窗类型：移动分类或移动笔记 */
    type?: "note" | "category";
    sourceId: number;
    sourceName: string;
    categoryTree: NotebookNode[];
    /** 移动分类时需要排除的节点 id（自身 + 子孙），移动笔记时可不传 */
    excludeNodeIds?: number[];
    /** 移动笔记时标记当前所属分类 id，移动分类时标记自身 id */
    currentCategoryId?: number;
  }>(),
  {
    type: "category",
  }
);

const emit = defineEmits<{
  (e: "confirm", targetId: number): void;
  (e: "cancel"): void;
  (e: "update:show", val: boolean): void;
}>();

/** 弹窗标题：根据 type 区分 */
const dialogTitle = computed(() =>
  props.type === "category"
    ? t("note.category.move.title")
    : t("note.move.title_note")
);

// 选中的目标 id（null 表示未选择）
const selectedId = ref<number | null>(null);

// 展开的节点 id 集合
const expandedIds = ref<Set<number>>(new Set());

// 排除节点集合
const excludeSet = computed(() => new Set(props.excludeNodeIds ?? []));

// 弹窗打开时重置状态
watch(
  () => props.show,
  (val) => {
    if (val) {
      selectedId.value = null;
      // 默认展开所有非排除的一级节点
      expandedIds.value = new Set(
        props.categoryTree
          .filter((n) => !excludeSet.value.has(n.id))
          .map((n) => n.id)
      );
    }
  }
);

/** 选中分类节点 */
const onSelect = (id: number) => {
  if (excludeSet.value.has(id)) return;
  selectedId.value = id;
};

/** 切换展开/折叠 */
const onToggle = (id: number) => {
  const next = new Set(expandedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  expandedIds.value = next;
};

/** 确认移动 */
const onConfirm = () => {
  if (selectedId.value === null) return;
  emit("confirm", selectedId.value);
};

/** 取消 */
const onCancel = () => {
  emit("update:show", false);
  emit("cancel");
};
</script>

<style scoped>
.source-info {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  font-size: 14px;
}

.source-label {
  color: var(--ion-color-medium);
}

.source-name {
  font-weight: 600;
  color: var(--ion-color-dark);
}

.select-hint {
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-bottom: 12px;
}

.category-list {
  display: flex;
  flex-direction: column;
}

/* 底部按钮 */
.modal-footer {
  padding: 8px 16px 16px;
}
</style>
