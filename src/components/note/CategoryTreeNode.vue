<template>
  <div class="tree-node">
    <!-- 当前节点行 -->
    <div
      class="node-row"
      :class="{ active: activeCategoryId === node.id }"
      :style="{ paddingLeft: `${8 + level * 16}px` }"
      @click="onSelect"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchCancel"
      @contextmenu.prevent="onContextMenu"
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
        @contextmenu="(n: NotebookNode, l: number) => emit('contextmenu', n, l)"
      />
    </div>
  </div>
</template>

<script lang="ts">
// 显式声明组件名，供模板内自引用递归（Vue 3 必须）
export default { name: "CategoryTreeNode" };
</script>

<script setup lang="ts">
import { computed, inject, ref, type Ref } from "vue";
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

// 事件定义：select 选中分类，contextmenu 长按/右键触发菜单（携带 level 供调用方判断层级）
const emit = defineEmits<{
  (e: "select", id: number): void;
  (e: "contextmenu", node: NotebookNode, level: number): void;
}>();

/** 点击行：选中该分类 */
const onSelect = () => emit("select", props.node.id);

/** 点击箭头：切换展开/折叠 */
const onToggle = () => toggleExpand(props.node.id, props.level);

// ========== 长按手势 ==========
// 长按超过 500ms 触发 contextmenu，touchmove 超过 10px 视为滑动取消
// 关键设计：长按 500ms 后只设置标记，在 touchend 时才 emit。
// 这样 actionSheet 在 touch 序列结束后才 present，避免 Ionic 的 scroll lock 残留。
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let longPressTriggered = false;
const startPoint = ref({ x: 0, y: 0 });

const onTouchStart = (e: TouchEvent) => {
  const touch = e.touches[0];
  startPoint.value = { x: touch.clientX, y: touch.clientY };
  longPressTriggered = false;
  longPressTimer = setTimeout(() => {
    longPressTriggered = true;
    emit("contextmenu", props.node, props.level);
  }, 500);
};

const onTouchMove = (e: TouchEvent) => {
  if (!longPressTimer && !longPressTriggered) return;
  const touch = e.touches[0];
  const dx = touch.clientX - startPoint.value.x;
  const dy = touch.clientY - startPoint.value.y;
  // 滑动超过阈值取消长按，避免滚动时误触
  if (Math.sqrt(dx * dx + dy * dy) > 10) {
    clearTimer();
  }
};

const onTouchEnd = () => {
  clearTimer();
};

const onTouchCancel = () => {
  clearTimer();
};

const clearTimer = () => {
  longPressTriggered = false;
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
};

/** PC 端右键触发（开发调试用） */
const onContextMenu = () => {
  emit("contextmenu", props.node, props.level);
};
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
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  touch-action: manipulation;
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
