<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast-item"
          :class="'toast-' + t.color"
        >
          <span class="toast-text">{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from "@/composables/useToast";

const { toasts } = useToast();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: calc(env(safe-area-inset-top) + 12px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.toast-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  border-radius: var(--z-radius-pill);
  font-size: var(--z-fs-body);
  font-weight: 500;
  line-height: 1.4;
  box-shadow: var(--z-shadow-md);
  pointer-events: auto;
  max-width: 90vw;
}

/* 成功：绿色 */
.toast-success {
  background: var(--z-success);
  color: #fff;
}

/* 失败：红色 */
.toast-danger {
  background: var(--z-danger);
  color: #fff;
}

.toast-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 入场/离场动画 */
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>