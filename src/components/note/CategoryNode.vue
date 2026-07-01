<template>
  <div class="category-node">
    <!-- 当前节点 -->
    <div
      class="node-row"
      :class="{
        disabled: isExcluded,
        selected: selectedId === node.id,
        current: isCurrent,
      }"
      :style="{ paddingLeft: `${level * 16 + 8}px` }"
      @click="onSelect"
    >
      <!-- 展开/折叠箭头（有子节点时显示） -->
      <ion-icon
        v-if="node.children?.length"
        :icon="isExpanded ? chevronDown : chevronForward"
        class="expand-icon"
        @click.stop="onToggle"
      />
      <span v-else class="expand-placeholder" />

      <!-- 文件夹图标 -->
      <ion-icon
        :icon="isCurrent ? folderOpenOutline : folderOutline"
        class="node-icon"
      />

      <!-- 标题 -->
      <span class="node-title">
        {{ node.title }}
        <span v-if="isCurrent" class="current-badge">
          ({{ t("note.category.move.current") }})
        </span>
      </span>

      <!-- 选中图标 -->
      <ion-icon
        v-if="selectedId === node.id && !isExcluded"
        :icon="checkmarkCircle"
        class="check-icon"
      />
    </div>

    <!-- 递归渲染子节点（展开状态下） -->
    <div v-if="isExpanded && node.children?.length" class="children">
      <CategoryNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :exclude-ids="excludeIds"
        :current-id="currentId"
        :selected-id="selectedId"
        :expanded-ids="expandedIds"
        @select="(id: number) => emit('select', id)"
        @toggle="(id: number) => emit('toggle', id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { IonIcon } from "@ionic/vue";
import {
  chevronDown,
  chevronForward,
  folderOutline,
  folderOpenOutline,
  checkmarkCircle,
} from "ionicons/icons";
import { useI18n } from "vue-i18n";
import type { NotebookNode } from "@/types/note";

const { t } = useI18n();

const props = defineProps<{
  node: NotebookNode;
  level: number;
  excludeIds: Set<number>;
  currentId: number;
  selectedId: number | null;
  expandedIds: Set<number>;
}>();

const emit = defineEmits<{
  (e: "select", id: number): void;
  (e: "toggle", id: number): void;
}>();

/** 是否被排除（自身或祖先在排除列表中） */
const isExcluded = computed(() => props.excludeIds.has(props.node.id));

/** 是否是当前所在位置 */
const isCurrent = computed(() => props.node.id === props.currentId);

/** 是否展开 */
const isExpanded = computed(() => props.expandedIds.has(props.node.id));

/** 选中节点 */
const onSelect = () => {
  if (isExcluded.value) return;
  emit("select", props.node.id);
};

/** 切换展开/折叠 */
const onToggle = () => {
  emit("toggle", props.node.id);
};
</script>

<style scoped>
.category-node {
  display: flex;
  flex-direction: column;
}

.node-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 8px;
  border-radius: var(--z-radius-md);
  cursor: pointer;
  transition: background-color 0.15s;
}

.node-row:active:not(.disabled) {
  background: var(--z-bg-subtle);
}

/* 选中态：浅橙底色 */
.node-row.selected:not(.disabled) {
  background: var(--z-primary-bg);
}

/* 禁用状态：灰色半透明 */
.node-row.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 当前位置：特殊标记 */
.node-row.current {
  opacity: 0.6;
}

.expand-icon {
  font-size: 16px;
  color: var(--z-text-tertiary);
  flex-shrink: 0;
  padding: 2px;
}

.expand-placeholder {
  width: 20px;
  flex-shrink: 0;
}

.node-icon {
  font-size: 18px;
  color: var(--z-primary);
  flex-shrink: 0;
}

.node-title {
  flex: 1;
  font-size: var(--z-fs-body);
  color: var(--z-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.current-badge {
  font-size: var(--z-fs-caption);
  color: var(--z-text-tertiary);
}

.check-icon {
  font-size: 20px;
  color: var(--z-primary);
  flex-shrink: 0;
}

.children {
  display: flex;
  flex-direction: column;
}
</style>
