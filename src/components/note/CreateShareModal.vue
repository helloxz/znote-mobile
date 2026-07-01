<template>
  <IonModal
    :is-open="show"
    :breakpoints="[0, 0.6, 1]"
    :initial-breakpoint="0.6"
    @didDismiss="onCancel"
  >
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ t("share.create.title") }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="onCancel">{{ t("note.category.cancel") }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- 创建前：设置密码和到期时间 -->
      <template v-if="!created">
        <div class="form-section">
          <div class="form-label">{{ t("share.create.noteTitle") }}</div>
          <div class="form-value">{{ noteTitle }}</div>
        </div>

        <div class="form-section">
          <div class="form-label">{{ t("share.create.passwordLabel") }}</div>
          <div class="form-hint">{{ t("share.create.passwordHint") }}</div>
          <ion-input
            v-model="password"
            type="text"
            :placeholder="t('share.create.passwordPlaceholder')"
            class="form-input"
            :maxlength="16"
          />
        </div>

        <div class="form-section">
          <div class="form-label">{{ t("share.create.expireLabel") }}</div>
          <div class="form-hint">{{ t("share.create.expireHint") }}</div>
          <ion-input
            v-model="expireDays"
            type="number"
            :placeholder="t('share.create.expirePlaceholder')"
            class="form-input"
            min="1"
          />
        </div>
      </template>

      <!-- 创建成功：显示分享链接 -->
      <template v-else>
        <div class="success-section">
          <ion-icon :icon="checkmarkCircleOutline" class="success-icon" />
          <div class="success-text">{{ t("share.create.success") }}</div>
        </div>

        <div class="result-section">
          <div class="result-label">{{ t("share.create.link") }}</div>
          <div class="result-value-row">
            <span class="result-value">{{ shareLink }}</span>
            <ion-button fill="clear" size="small" @click="copyLink">
              <ion-icon :icon="copyOutline" slot="icon-only" />
            </ion-button>
          </div>
        </div>

        <div v-if="sharePassword" class="result-section">
          <div class="result-label">{{ t("share.create.passwordResult") }}</div>
          <div class="result-value-row">
            <span class="result-value">{{ sharePassword }}</span>
            <ion-button fill="clear" size="small" @click="copyPassword">
              <ion-icon :icon="copyOutline" slot="icon-only" />
            </ion-button>
          </div>
        </div>
      </template>
    </ion-content>

    <!-- 底部按钮 -->
    <ion-footer class="modal-footer">
      <ion-button
        v-if="!created"
        expand="block"
        :disabled="creating"
        @click="onConfirm"
      >
        {{ creating ? t("share.create.creating") : t("share.create.confirm") }}
      </ion-button>
      <ion-button
        v-else
        expand="block"
        @click="onDone"
      >
        {{ t("share.create.done") }}
      </ion-button>
    </ion-footer>
  </IonModal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  IonInput,
} from "@ionic/vue";
import { useToast } from "@/composables/useToast";
import { checkmarkCircleOutline, copyOutline } from "ionicons/icons";
import { useI18n } from "vue-i18n";
import { createShare } from "@/api/share";

const { t } = useI18n();

const props = defineProps<{
  show: boolean;
  noteId: number;
  noteTitle: string;
}>();

const emit = defineEmits<{
  (e: "cancel"): void;
  (e: "update:show", val: boolean): void;
}>();

// 状态
const password = ref("");
const expireDays = ref<string>("");  // 到期天数，空字符串表示永不过期
const creating = ref(false);
const created = ref(false);
const shareLink = ref("");
const sharePassword = ref("");

/** 生成6位随机密码（字母+数字） */
const generateRandomPassword = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 弹窗打开时重置状态
watch(
  () => props.show,
  (val) => {
    if (val) {
      password.value = generateRandomPassword();
      expireDays.value = "";
      creating.value = false;
      created.value = false;
      shareLink.value = "";
      sharePassword.value = "";
    }
  }
);

/** 确认创建分享 */
const onConfirm = async () => {
  creating.value = true;
  try {
    // 计算到期时间：当前时间 + 天数（毫秒时间戳）
    let expiresAt: number | undefined;
    if (expireDays.value && Number(expireDays.value) > 0) {
      const days = Number(expireDays.value);
      expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
    }

    const result = await createShare(props.noteId, {
      password: password.value || undefined,
      expires_at: expiresAt,
    });
    if (result) {
      created.value = true;
      shareLink.value = `${window.location.origin}/s/${result.share_id}`;
      sharePassword.value = result.password || "";
    } else {
      await showToast(t("share.create.failed"), "danger");
    }
  } catch {
    await showToast(t("share.create.failed"), "danger");
  } finally {
    creating.value = false;
  }
};

/** 复制链接 */
const copyLink = async () => {
  await navigator.clipboard.writeText(shareLink.value);
  await showToast(t("share.create.copied"), "success");
};

/** 复制密码 */
const copyPassword = async () => {
  await navigator.clipboard.writeText(sharePassword.value);
  await showToast(t("share.create.copied"), "success");
};

/** 完成 */
const onDone = () => {
  emit("update:show", false);
};

/** 取消 */
const onCancel = () => {
  emit("update:show", false);
  emit("cancel");
};

const { showToast } = useToast();
</script>

<style scoped>
.form-section {
  margin-bottom: 20px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin-bottom: 4px;
}

.form-hint {
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-bottom: 8px;
}

.form-value {
  font-size: 15px;
  color: var(--ion-color-dark);
}

.form-input {
  --background: var(--ion-color-light);
  --padding-start: 12px;
  --padding-end: 12px;
  --padding-top: 10px;
  --padding-bottom: 10px;
  border-radius: 8px;
  margin-top: 4px;
}

/* 创建成功 */
.success-section {
  text-align: center;
  margin-bottom: 24px;
}

.success-icon {
  font-size: 48px;
  color: var(--ion-color-success);
}

.success-text {
  margin-top: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-color-dark);
}

/* 结果区域 */
.result-section {
  margin-bottom: 16px;
}

.result-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin-bottom: 4px;
}

.result-value-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--ion-color-light);
  border-radius: 8px;
  padding: 8px 12px;
}

.result-value {
  flex: 1;
  font-size: 14px;
  color: var(--ion-color-dark);
  word-break: break-all;
}

/* 底部按钮 */
.modal-footer {
  padding: 8px 16px 16px;
}
</style>
