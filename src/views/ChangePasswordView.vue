<template>
  <ion-page>
    <!-- 自定义顶部栏（复用 NoteView 方案，避免 ion-header 伪元素阴影） -->
    <div class="custom-header">
      <div class="title-row">
        <button class="icon-btn" @click="onBack">
          <ion-icon :icon="chevronBack" />
        </button>
        <span class="title-text">{{ t("note.password.title") }}</span>
        <span class="icon-btn placeholder"></span>
      </div>
    </div>

    <ion-content :fullscreen="true" class="page-content">
      <!-- 占位：撑开与 custom-header 等高的空间 -->
      <div class="header-placeholder"></div>

      <!-- 成功倒计时提示 -->
      <div v-if="showSuccess" class="success-banner">
        <ion-icon :icon="checkmarkCircle" class="success-icon" />
        <span>{{ t("note.password.logoutCountdown", { seconds: countdown }) }}</span>
      </div>

      <!-- 表单区 -->
      <div class="form-wrap" :class="{ disabled: showSuccess }">
        <div class="form-item">
          <ion-input
            v-model="form.old_password"
            :label="t('note.password.old')"
            :placeholder="t('note.password.placeholder.old')"
            label-placement="stacked"
            :type="showOld ? 'text' : 'password'"
            :clear-input="!showSuccess"
          >
            <ion-icon
              slot="end"
              :icon="showOld ? eyeOffOutline : eyeOutline"
              class="eye-icon"
              @click="showOld = !showOld"
            />
          </ion-input>
        </div>

        <div class="form-item">
          <ion-input
            v-model="form.new_password"
            :label="t('note.password.new')"
            :placeholder="t('note.password.placeholder.new')"
            label-placement="stacked"
            :type="showNew ? 'text' : 'password'"
            :clear-input="!showSuccess"
          >
            <ion-icon
              slot="end"
              :icon="showNew ? eyeOffOutline : eyeOutline"
              class="eye-icon"
              @click="showNew = !showNew"
            />
          </ion-input>
        </div>

        <div class="form-item">
          <ion-input
            v-model="form.repeat_password"
            :label="t('note.password.repeat')"
            :placeholder="t('note.password.placeholder.repeat')"
            label-placement="stacked"
            :type="showRepeat ? 'text' : 'password'"
            :clear-input="!showSuccess"
            @keydown.enter="onSubmit"
          >
            <ion-icon
              slot="end"
              :icon="showRepeat ? eyeOffOutline : eyeOutline"
              class="eye-icon"
              @click="showRepeat = !showRepeat"
            />
          </ion-input>
        </div>

        <ion-button
          expand="block"
          class="submit-btn"
          :disabled="loading || showSuccess"
          @click="onSubmit"
        >
          <ion-spinner v-if="loading" name="crescent" />
          <span v-else>{{ t("note.password.submit") }}</span>
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  IonPage,
  IonIcon,
  IonContent,
  IonInput,
  IonButton,
  IonSpinner,
} from "@ionic/vue";
import {
  chevronBack,
  eyeOutline,
  eyeOffOutline,
  checkmarkCircle,
} from "ionicons/icons";
import { useToast } from "@/composables/useToast";
import { changePassword } from "@/api/user";
import { useUserStore } from "@/stores/user";

const router = useRouter();
const { t } = useI18n();
const userStore = useUserStore();

// 表单数据
const form = reactive({
  old_password: "",
  new_password: "",
  repeat_password: "",
});

// 密码显隐
const showOld = ref(false);
const showNew = ref(false);
const showRepeat = ref(false);

// 提交状态
const loading = ref(false);
const showSuccess = ref(false);
const countdown = ref(3);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

// 密码格式：6-18 位，字母数字或 !@#$%^&*()_+.
const PASSWORD_REGEX = /^[a-zA-Z0-9!@#$%^&*()_+.]{6,18}$/;

/** 返回上一页 */
const onBack = () => {
  router.back();
};

/** 提交修改密码 */
const onSubmit = async () => {
  if (loading.value || showSuccess.value) return;

  // 前端校验：非空
  if (
    !form.old_password.trim() ||
    !form.new_password.trim() ||
    !form.repeat_password.trim()
  ) {
    await showToast(t("note.password.fieldsRequired"));
    return;
  }

  // 前端校验：两次新密码一致
  if (form.new_password !== form.repeat_password) {
    await showToast(t("note.password.notMatch"));
    return;
  }

  // 前端校验：新密码格式
  if (!PASSWORD_REGEX.test(form.new_password)) {
    await showToast(t("invalid.password"));
    return;
  }

  loading.value = true;
  try {
    const res = await changePassword({
      old_password: form.old_password.trim(),
      new_password: form.new_password.trim(),
      repeat_password: form.repeat_password.trim(),
    });
    const body = res.data;
    if (body.code === 200) {
      // 成功：启动倒计时，结束后清登录态跳登录页
      showSuccess.value = true;
      await showToast(t("note.password.success"), "success");
      startCountdown();
    } else {
      // 失败：后端 msg 直接作 i18n key 翻译
      await showToast(t(body.msg, "unknown"));
    }
  } catch {
    // 网络错误
    await showToast(t("network.error", "unknown"));
  } finally {
    loading.value = false;
  }
};

/** 启动 3 秒倒计时，结束后清登录态跳登录页 */
const startCountdown = () => {
  countdown.value = 3;
  countdownTimer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      clearTimer();
      // 后端已撤销所有 session，清本地登录态并跳登录页
      userStore.clearUserData();
      router.replace("/login");
    }
  }, 1000);
};

const clearTimer = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
};

// 组件卸载时清理定时器
onUnmounted(clearTimer);

const { showToast } = useToast();
</script>

<style scoped>
.page-content {
  --background: var(--z-bg-page);
}

/* 自定义顶部栏（复用 NoteView 方案） */
.custom-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: var(--z-bg-page);
  padding-top: env(safe-area-inset-top);
}

.title-row {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 var(--z-space-xs);
}

.title-text {
  flex: 1;
  text-align: center;
  font-size: var(--z-fs-body-lg);
  font-weight: 600;
  color: var(--z-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-btn {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0;
  color: var(--z-text-primary);
}

.icon-btn ion-icon {
  font-size: 22px;
}

/* 占位按钮（保持标题居中） */
.icon-btn.placeholder {
  visibility: hidden;
}

/* 占位高度 */
.header-placeholder {
  height: calc(48px + env(safe-area-inset-top));
}

/* 成功提示条 */
.success-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: var(--z-space-md);
  padding: var(--z-space-md);
  border-radius: var(--z-radius-md);
  background: color-mix(in srgb, #22c55e 12%, transparent);
  color: #16a34a;
  font-size: var(--z-fs-body);
}

.success-icon {
  font-size: 20px;
  color: #22c55e;
}

/* 表单区 */
.form-wrap {
  padding: 0 var(--z-space-md) var(--z-space-md);
  display: flex;
  flex-direction: column;
  gap: var(--z-space-md);
}

.form-wrap.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.form-item {
  --background: var(--z-bg-surface);
  --border-radius: var(--z-radius-md);
  --padding-start: var(--z-space-md);
  --inner-padding-end: var(--z-space-md);
  --border-width: 0;
  --inner-border-width: 0;
  border-radius: var(--z-radius-md);
  box-shadow: var(--z-shadow-xs);
}

.eye-icon {
  font-size: 20px;
  color: var(--z-text-tertiary);
}

/* 提交按钮 */
.submit-btn {
  --background: var(--z-primary);
  --background-hover: var(--z-primary-hover);
  --background-activated: var(--z-primary-pressed);
  --color: var(--z-primary-contrast);
  --border-radius: var(--z-radius-md);
  --box-shadow: none;
  height: 48px;
  font-weight: 600;
  font-size: var(--z-fs-body-lg);
  margin-top: var(--z-space-sm);
}
</style>
