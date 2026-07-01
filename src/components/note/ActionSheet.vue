<template>
  <Teleport to="body">
    <!-- 遮罩层：点击关闭 -->
    <Transition name="sheet-fade">
      <div v-if="show" class="sheet-overlay" @click="onDismiss" />
    </Transition>

    <!-- 底部面板：滑入/滑出 -->
    <Transition name="sheet-slide">
      <div v-if="show" class="sheet-panel">
        <!-- 拖拽指示条 -->
        <div class="sheet-handle">
          <div class="sheet-handle-bar" />
        </div>

        <!-- 标题（可选） -->
        <div v-if="header" class="sheet-header">{{ header }}</div>

        <!-- 操作按钮卡片 -->
        <div class="sheet-card">
          <div
            v-for="btn in buttons"
            :key="btn.role"
            class="sheet-item"
            :class="{ 'sheet-item-danger': btn.danger }"
            @click="onSelect(btn.role)"
          >
            <span class="sheet-item-text">{{ btn.text }}</span>
          </div>
        </div>

        <!-- 取消按钮 -->
        <button class="sheet-cancel-btn" @click="onDismiss">
          {{ cancelText }}
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

export interface ActionSheetButton {
  text: string;
  role: string;
  danger?: boolean;
}

const props = withDefaults(
  defineProps<{
    show: boolean;
    header?: string;
    buttons: ActionSheetButton[];
    cancelText?: string;
  }>(),
  {
    cancelText: "",
  }
);

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "select", role: string): void;
}>();

const { t } = useI18n();

/** 取消按钮文案：优先用 prop，否则用 i18n */
const cancelText = computed(() => props.cancelText || t("note.settings.cancel"));

/** 点击遮罩或取消按钮：关闭面板 */
const onDismiss = () => {
  emit("update:show", false);
};

/** 点击操作项：通知父组件并关闭面板 */
const onSelect = (role: string) => {
  emit("select", role);
  emit("update:show", false);
};
</script>

<style scoped>
/* ========== 遮罩层 ========== */
.sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.4);
}

/* 遮罩淡入/淡出 */
.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 0.25s ease;
}
.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

/* ========== 底部面板 ========== */
.sheet-panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1001;
  background: var(--z-bg-page);
  border-radius: var(--z-radius-xl) var(--z-radius-xl) 0 0;
  padding: 0 var(--z-space-lg) calc(var(--z-space-lg) + env(safe-area-inset-bottom));
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.12);
}

/* 面板滑入/滑出 */
.sheet-slide-enter-active,
.sheet-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-slide-enter-from,
.sheet-slide-leave-to {
  transform: translateY(100%);
}

/* ========== 拖拽指示条 ========== */
.sheet-handle {
  display: flex;
  justify-content: center;
  padding: var(--z-space-sm) 0;
}

.sheet-handle-bar {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--z-text-disabled);
}

/* ========== 标题 ========== */
.sheet-header {
  text-align: center;
  font-size: var(--z-fs-body);
  font-weight: 600;
  color: var(--z-text-primary);
  padding: var(--z-space-sm) 0 var(--z-space-lg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== 操作按钮卡片 ========== */
.sheet-card {
  background: var(--z-bg-surface);
  border-radius: var(--z-radius-md);
  box-shadow: var(--z-shadow-xs);
  overflow: hidden;
}

.sheet-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px var(--z-space-lg);
  cursor: pointer;
  transition: background 0.15s;
}

.sheet-item:active {
  background: var(--z-bg-subtle);
}

/* 非最后一项加底部分割线 */
.sheet-item:not(:last-child) {
  border-bottom: 1px solid var(--z-border-light);
}

.sheet-item-text {
  font-size: var(--z-fs-body);
  color: var(--z-text-primary);
}

/* 危险操作：红色 */
.sheet-item-danger .sheet-item-text {
  color: var(--z-danger);
  font-weight: 500;
}

/* ========== 取消按钮 ========== */
.sheet-cancel-btn {
  display: block;
  width: 100%;
  margin-top: var(--z-space-lg);
  padding: 14px 0;
  background: var(--z-bg-surface);
  border: none;
  border-radius: var(--z-radius-md);
  font-size: var(--z-fs-body-lg);
  font-weight: 600;
  color: var(--z-text-primary);
  box-shadow: var(--z-shadow-xs);
  cursor: pointer;
  transition: background 0.15s;
}

.sheet-cancel-btn:active {
  background: var(--z-bg-subtle);
}
</style>