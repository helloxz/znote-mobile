<template>
  <div class="tree-node">
    <!-- 当前节点行 -->
    <div
      class="node-row"
      :class="{ active: activeCategoryId === node.id }"
      :style="{ paddingLeft: `${8 + level * 16}px` }"
      @click="onSelect"
    >
      <!-- 展开/折叠箭头（有子节点才可点） -->
      <button
        class="arrow-btn"
        :class="{ invisible: !hasChildren }"
        @click.stop="onToggle"
      >
        <ion-icon
          :icon="isExpanded ? chevronDown : chevronForward"
          class="arrow-icon"
        />
      </button>

      <!-- 文件夹图标 -->
      <ion-icon
        :icon="activeCategoryId === node.id ? folderOpen : folder"
        class="folder-icon"
      />

      <!-- 标题 -->
      <span class="node-title">{{ node.title }}</span>
    </div>

    <!-- 递归渲染子节点：仅在展开且有子节点时 -->
    <div v-if="hasChildren && isExpanded" class="children">
      <CategoryTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :active-category-id="activeCategoryId"
        :level="level + 1"
        @select="(id: number) => emit('select', id)"
      />
    </div>
  </div>
</template>

<script lang="ts">
// 显式声明组件名，供模板内自引用递归（Vue 3 必须）
export default { name: "CategoryTreeNode" };
</script>

<script setup lang="ts">
import { computed, inject, type Ref } from "vue";
import { IonIcon } from "@ionic/vue";
import {
  chevronForward,
  chevronDown,
  folder,
  folderOpen,
} from "ionicons/icons";
import type { NotebookNode } from "@/types/note";

const props = defineProps<{
  node: NotebookNode;
  activeCategoryId: number | null;
  level: number;
}>();

// 从父级 SidebarMenu 注入展开状态集合与切换方法
const expandedIds = inject<Ref<Set<number>>>("expandedIds")!;
const toggleExpand = inject<(id: number, level: number) => void>(
  "toggleExpand"
)!;

/** 是否有子节点 */
const hasChildren = computed(
  () => Array.isArray(props.node.children) && props.node.children.length > 0
);

/** 当前节点是否展开 */
const isExpanded = computed(() => expandedIds.value.has(props.node.id));

/** 点击行：选中该分类（emit 由 inject 的方式不便，直接走 store 不合适，改 emit） */
const emit = defineEmits<{ (e: "select", id: number): void }>();
const onSelect = () => emit("select", props.node.id);

/** 点击箭头：切换展开/折叠 */
const onToggle = () => toggleExpand(props.node.id, props.level);
</script>

<style scoped>
.node-row {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 40px;
  border-radius: var(--z-radius-sm);
  cursor: pointer;
  color: var(--z-text-primary);
  transition: background-color 0.15s;
}

.node-row:active {
  background: var(--z-bg-surface);
}

/* 选中态高亮 */
.node-row.active {
  background: color-mix(in srgb, var(--z-primary) 12%, transparent);
  color: var(--z-primary);
}

.arrow-btn {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0;
  color: var(--z-text-tertiary);
}

.arrow-btn.invisible {
  visibility: hidden;
}

.arrow-icon {
  font-size: 18px;
}

.folder-icon {
  flex-shrink: 0;
  font-size: 16px;
  color: var(--z-text-secondary);
}

.node-row.active .folder-icon {
  color: var(--z-primary);
}

.node-title {
  flex: 1;
  font-size: var(--z-fs-body);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
