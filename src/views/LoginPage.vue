<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-content">
      <!-- 顶部品牌区 -->
      <div class="brand">
        <div class="brand-logo">Z</div>
        <h1 class="brand-title">{{ t("login.title") }}</h1>
        <p class="brand-subtitle">{{ t("login.subtitle") }}</p>
      </div>

      <!-- 表单区 -->
      <div class="form-wrap">
        <ion-list class="form-list">
          <ion-item class="form-item">
            <ion-input
              v-model="serverUrl"
              :label="t('login.server')"
              :placeholder="t('login.serverPlaceholder')"
              label-placement="stacked"
              type="url"
              autocomplete="url"
              :clear-input="true"
            />
          </ion-item>

          <ion-item class="form-item">
            <ion-input
              v-model="username"
              :label="t('login.username')"
              :placeholder="t('login.usernamePlaceholder')"
              label-placement="stacked"
              autocomplete="username"
              :clear-input="true"
            />
          </ion-item>

          <ion-item class="form-item">
            <ion-input
              v-model="password"
              :label="t('login.password')"
              :placeholder="t('login.passwordPlaceholder')"
              label-placement="stacked"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
            >
              <!-- 密码可见切换 -->
              <ion-icon
                slot="end"
                :icon="showPassword ? eyeOffOutline : eyeOutline"
                class="eye-icon"
                @click="showPassword = !showPassword"
              />
            </ion-input>
          </ion-item>
        </ion-list>

        <ion-button
          expand="block"
          class="submit-btn"
          :disabled="loading"
          @click="onSubmit"
        >
          <ion-spinner v-if="loading" name="crescent" />
          <span v-else>{{ t("login.submit") }}</span>
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  IonPage,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
} from "@ionic/vue";
import { eyeOutline, eyeOffOutline } from "ionicons/icons";
import { useToast } from "@/composables/useToast";
import { useUserStore } from "@/stores/user";

const router = useRouter();
const { t } = useI18n();
const userStore = useUserStore();

// 表单数据
const serverUrl = ref("");
const username = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);

/** 自动回填已保存的服务器地址（用户切换账号时免重输） */
if (userStore.serverUrl) {
  serverUrl.value = userStore.serverUrl;
}

/**
 * 提交登录
 * 流程：前端校验 → 调 store.login → 成功跳 Tab1，失败弹 toast
 */
const onSubmit = async () => {
  // 简单非空校验
  if (!serverUrl.value.trim() || !username.value.trim() || !password.value) {
    await showToast(t("invalid.input"));
    return;
  }

  // 去除末尾斜杠（统一存储格式，避免 axios 拼接双斜杠）
  const normalizedUrl = serverUrl.value.trim().replace(/\/+$/, "");

  loading.value = true;
  const result = await userStore.login(
    normalizedUrl,
    username.value.trim(),
    password.value
  );
  loading.value = false;

  if (result.success) {
    await showToast(t("login.success"), "success");
    router.replace("/note");
  } else {
    // msg 为后端返回的英文 key 或前端自定义 key，直接作为 i18n key 翻译
    // 未命中翻译时 vue-i18n 返回 key 本身，兜底显示 unknown
    await showToast(t(result.msg, "unknown"));
  }
};

const { showToast } = useToast();
</script>

<style scoped>
.login-content {
  --background: var(--z-bg-page);
}

/* 品牌区 */
.brand {
  text-align: center;
  padding: 64px 0 40px;
}

.brand-logo {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  border-radius: var(--z-radius-lg);
  background: var(--z-primary);
  color: var(--z-primary-contrast);
  font-size: 36px;
  font-weight: 700;
  line-height: 72px;
  box-shadow: var(--z-shadow-md);
}

.brand-title {
  margin: 0;
  font-size: var(--z-fs-headline);
  font-weight: 700;
  color: var(--z-text-primary);
}

.brand-subtitle {
  margin: 8px 0 0;
  font-size: var(--z-fs-body);
  color: var(--z-text-secondary);
}

/* 表单区 */
.form-wrap {
  padding: 0 var(--z-space-xl);
}

.form-list {
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: var(--z-space-md);
  margin-bottom: var(--z-space-xl);
}

.form-item {
  --background: var(--z-bg-surface);
  --border-radius: var(--z-radius-md);
  --padding-start: var(--z-space-md);
  --inner-padding-end: var(--z-space-md);
  /* 去掉 ion-item 默认的底部内边框线（颜色 --ion-border-color #e5e6eb） */
  --border-width: 0;
  --inner-border-width: 0;
  border-radius: var(--z-radius-md);
  box-shadow: var(--z-shadow-xs);
}

/* 密码可见图标 */
.eye-icon {
  font-size: 20px;
  color: var(--z-text-tertiary);
  cursor: pointer;
}

/* 登录按钮 */
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
  margin: 0;
}
</style>
