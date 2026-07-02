<template>
  <Teleport to="body">
    <!-- 遮罩层：点击关闭 -->
    <Transition name="sheet-fade">
      <div v-if="show" class="sheet-overlay" @click="onClose" />
    </Transition>

    <!-- 底部面板：滑入/滑出 -->
    <Transition name="sheet-slide">
      <div v-if="show" class="sheet-panel">
        <!-- 拖拽指示条 -->
        <div class="sheet-handle">
          <div class="sheet-handle-bar" />
        </div>

        <!-- 用户信息区 -->
        <div class="sheet-user">
          <div class="sheet-avatar">{{ avatarLetter }}</div>
          <div class="sheet-user-info">
            <span class="sheet-username">{{ userStore.userInfo?.username || "ZNote" }}</span>
            <span class="sheet-server">{{ userStore.serverUrl || "" }}</span>
          </div>
        </div>

        <!-- 设置项卡片 -->
        <div class="settings-card">
          <!-- 修改密码 -->
          <div class="setting-item" @click="onChangePassword">
            <div class="setting-left">
              <ion-icon :icon="keyOutline" class="setting-icon setting-icon-default" />
              <span class="setting-text">{{ t("note.menu.changePassword") }}</span>
            </div>
            <ion-icon :icon="chevronForwardOutline" class="setting-arrow" />
          </div>

          <!-- 关于 -->
          <div class="setting-item" @click="onAbout">
            <div class="setting-left">
              <ion-icon :icon="informationCircleOutline" class="setting-icon setting-icon-default" />
              <span class="setting-text">{{ t("note.menu.about") }}</span>
            </div>
            <ion-icon :icon="chevronForwardOutline" class="setting-arrow" />
          </div>

          <!-- 退出登录 -->
          <div class="setting-item" @click="onLogout">
            <div class="setting-left">
              <ion-icon :icon="logOutOutline" class="setting-icon setting-icon-danger" />
              <span class="setting-text setting-text-danger">{{ t("note.menu.logout") }}</span>
            </div>
            <ion-icon :icon="chevronForwardOutline" class="setting-arrow" />
          </div>
        </div>

        <!-- 取消按钮 -->
        <button class="sheet-cancel-btn" @click="onClose">
          {{ t("note.settings.cancel") }}
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { IonIcon, alertController } from "@ionic/vue";
import { keyOutline, logOutOutline, chevronForwardOutline, informationCircleOutline } from "ionicons/icons";
import { useUserStore } from "@/stores/user";

defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "changePassword"): void;
  (e: "about"): void;
  (e: "logout"): void;
}>();

const { t } = useI18n();
const userStore = useUserStore();

/** 头像缩写：取用户名首字符大写 */
const avatarLetter = computed(() => {
  const name = userStore.userInfo?.username || "Z";
  return name.charAt(0).toUpperCase();
});

/** 关闭面板 */
const onClose = () => {
  emit("update:show", false);
};

/** 修改密码：关闭面板并通知父组件 */
const onChangePassword = () => {
  emit("update:show", false);
  emit("changePassword");
};

/** 关于：关闭面板并通知父组件跳转关于页 */
const onAbout = () => {
  emit("update:show", false);
  emit("about");
};

/** 退出登录：先关闭面板，再弹出确认框 */
const onLogout = async () => {
  // 先关闭面板，避免遮挡确认弹窗
  emit("update:show", false);

  // 等待面板关闭动画完成（300ms），再弹出确认框
  await new Promise((resolve) => setTimeout(resolve, 300));

  const alert = await alertController.create({
    header: t("note.settings.logoutConfirm"),
    buttons: [
      { text: t("note.settings.cancel"), role: "cancel" },
      {
        text: t("note.settings.logoutConfirmOk"),
        role: "destructive",
        handler: () => {
          emit("logout");
        },
      },
    ],
  });
  await alert.present();
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

/* ========== 用户信息区 ========== */
.sheet-user {
  display: flex;
  align-items: center;
  gap: var(--z-space-md);
  padding: var(--z-space-md) 0 var(--z-space-lg);
  border-bottom: 1px solid var(--z-border-light);
  margin-bottom: var(--z-space-lg);
}

.sheet-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--z-primary);
  color: var(--z-primary-contrast);
  font-size: var(--z-fs-title);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sheet-user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.sheet-username {
  font-size: var(--z-fs-body-lg);
  font-weight: 600;
  color: var(--z-text-primary);
}

.sheet-server {
  font-size: var(--z-fs-caption);
  color: var(--z-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== 设置项卡片（对齐 AboutPage 风格） ========== */
.settings-card {
  background: var(--z-bg-surface);
  border-radius: var(--z-radius-md);
  box-shadow: var(--z-shadow-xs);
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px var(--z-space-lg);
  cursor: pointer;
  transition: background 0.15s;
}

.setting-item:active {
  background: var(--z-bg-subtle);
}

/* 非最后一项加底部分割线 */
.setting-item:not(:last-child) {
  border-bottom: 1px solid var(--z-border-light);
}

.setting-left {
  display: flex;
  align-items: center;
  gap: var(--z-space-md);
}

.setting-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.setting-icon-default {
  color: var(--z-icon-default);
}

.setting-icon-danger {
  color: var(--z-danger);
}

.setting-text {
  font-size: var(--z-fs-body);
  color: var(--z-text-primary);
}

.setting-text-danger {
  color: var(--z-danger);
}

.setting-arrow {
  font-size: 18px;
  color: var(--z-text-disabled);
  flex-shrink: 0;
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