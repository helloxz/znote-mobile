<template>
  <div
    class="note-card"
    @click="onClick"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchCancel"
    @contextmenu.prevent="onContextMenu"
  >
    <!-- 拖拽把手（左侧，置顶时禁用交互但保持显示以对称） -->
    <div class="drag-handle" :class="{ disabled: !draggable }">
      <ion-icon :icon="reorderTwo" />
    </div>

    <!-- 主体内容 -->
    <div class="card-body">
      <div class="card-title-row">
        <!-- 置顶徽标（仅置顶笔记显示，琥珀色文字标签） -->
        <span v-if="note.is_pinned === 1" class="pin-badge">置顶</span>
        <span class="card-title">{{ note.title || "无标题" }}</span>
      </div>
      <div class="card-desc">{{ summary }}</div>
      <div class="card-time">{{ formattedTime }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { IonIcon } from "@ionic/vue";
import { reorderTwo } from "ionicons/icons";
import type { Note } from "@/types/note";

const props = defineProps<{
  note: Note;
  /** 是否可拖拽（置顶笔记传 false） */
  draggable: boolean;
}>();

const emit = defineEmits<{
  (e: "select", note: Note): void;
  (e: "contextmenu", note: Note): void;
}>();

/** 摘要：去 markdown 标记，取前两行非空，截断 80 字 */
const summary = computed(() => {
  const content = props.note.content || "";
  if (!content) return "";
  const plain = content
    .replace(/^#+\s*/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .trim();
  const lines = plain.split("\n").filter((l) => l.trim());
  return lines.slice(0, 2).join(" ").slice(0, 80);
});

/** 格式化时间：YYYY-MM-DD HH:mm */
const formattedTime = computed(() => {
  const ts = props.note.updated_at;
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
});

/** 点击：选中笔记（短按） */
const onClick = () => emit("select", props.note);

// ========== 长按手势（仅卡片主体，把手区域由 sortablejs 接管） ==========
// 关键设计：长按 500ms 后只设置标记，在 touchend 时才 emit contextmenu。
// 这样 actionSheet 在 touch 序列结束后才 present，避免 Ionic 的 scroll lock 残留。
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let longPressTriggered = false;
let startPoint = { x: 0, y: 0 };

const onTouchStart = (e: TouchEvent) => {
  const touch = e.touches[0];
  startPoint = { x: touch.clientX, y: touch.clientY };
  longPressTriggered = false;
  longPressTimer = setTimeout(() => {
    longPressTriggered = true;
  }, 500);
};

const onTouchMove = (e: TouchEvent) => {
  if (!longPressTimer && !longPressTriggered) return;
  const touch = e.touches[0];
  const dx = touch.clientX - startPoint.x;
  const dy = touch.clientY - startPoint.y;
  // 滑动超过阈值取消长按，避免滚动时误触
  if (Math.sqrt(dx * dx + dy * dy) > 10) {
    clearTimer();
  }
};

const onTouchEnd = () => {
  clearTimer();
  if (longPressTriggered) {
    longPressTriggered = false;
    emit("contextmenu", props.note);
  }
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

/** PC 端右键触发（桌面调试用） */
const onContextMenu = () => {
  emit("contextmenu", props.note);
};
</script>

<style scoped>
.note-card {
  display: flex;
  align-items: stretch;
  background: var(--z-bg-surface);
  border-radius: var(--z-radius-md);
  padding: var(--z-space-md);
  box-shadow: var(--z-shadow-xs);
}

/* 拖拽把手 */
.drag-handle {
  flex-shrink: 0;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--z-text-disabled);
  cursor: grab;
  touch-action: none; /* 让 sortablejs 接管触摸，不触发滚动 */
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle ion-icon {
  font-size: 18px;
}

/* 置顶笔记：把手禁用交互但保持显示，视觉变淡以示不可拖 */
.drag-handle.disabled {
  pointer-events: none;
  opacity: 0.3;
  cursor: default;
}

/* 主体 */
.card-body {
  flex: 1;
  min-width: 0;
  margin-left: var(--z-space-sm);
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

/* 置顶徽标：琥珀色文字 + 浅琥珀背景的圆角药丸 */
.pin-badge {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  padding: 3px 6px;
  border-radius: var(--z-radius-sm);
  color: #d97706; /* 琥珀色文字 */
  background: color-mix(in srgb, #f59e0b 15%, transparent); /* 浅琥珀背景 */
}

.card-title {
  flex: 1;
  font-size: var(--z-fs-body-lg);
  font-weight: 600;
  color: var(--z-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-desc {
  font-size: var(--z-fs-body);
  color: var(--z-text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8px;
}

.card-time {
  font-size: var(--z-fs-caption);
  color: var(--z-text-tertiary);
}
</style>
