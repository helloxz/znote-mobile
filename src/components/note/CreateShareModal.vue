<template>
  <IonModal
    :is-open="show"
    :breakpoints="[0, 0.65, 1]"
    :initial-breakpoint="0.65"
    @didDismiss="onCancel"
  >
    <div class="share-sheet">
      <!-- 自定义标题栏：左取消 + 中标题 + 右操作按钮 -->
      <div class="modal-header">
        <button class="header-btn header-btn-cancel" @click="onCancel">
          {{ t("note.category.cancel") }}
        </button>
        <span class="header-title">{{ t("share.create.title") }}</span>
        <button
          class="header-btn header-btn-confirm"
          :class="{ 'header-btn-disabled': creating }"
          :disabled="creating"
          @click="created ? onDone() : onConfirm()"
        >
          {{ creating ? t("share.create.creating") : t("share.create.done") }}
        </button>
      </div>

      <!-- 内容区 -->
      <div class="modal-body">
        <!-- 创建前：设置密码和到期时间 -->
        <template v-if="!created">
          <!-- 笔记标题 -->
          <div class="info-card">
            <div class="info-label">{{ t("share.create.noteTitle") }}</div>
            <div class="info-value">{{ noteTitle }}</div>
          </div>

          <!-- 密码设置 -->
          <div class="form-group">
            <div class="form-header">
              <span class="form-label">{{ t("share.create.passwordLabel") }}</span>
              <span class="form-hint">{{ t("share.create.passwordHint") }}</span>
            </div>
            <div class="input-wrap">
              <ion-input
                v-model="password"
                type="text"
                :placeholder="t('share.create.passwordPlaceholder')"
                class="form-input"
                :maxlength="16"
              />
            </div>
          </div>

          <!-- 到期天数 -->
          <div class="form-group">
            <div class="form-header">
              <span class="form-label">{{ t("share.create.expireLabel") }}</span>
              <span class="form-hint">{{ t("share.create.expireHint") }}</span>
            </div>
            <div class="input-wrap">
              <ion-input
                v-model="expireDays"
                type="number"
                :placeholder="t('share.create.expirePlaceholder')"
                class="form-input"
                min="1"
              />
            </div>
          </div>
        </template>

        <!-- 创建成功：显示分享链接 -->
        <template v-else>
          <div class="success-section">
            <ion-icon :icon="checkmarkCircleOutline" class="success-icon" />
            <div class="success-text">{{ t("share.create.success") }}</div>
          </div>

          <div class="result-card">
            <!-- 分享链接 -->
            <div class="result-item">
              <span class="result-label">{{ t("share.create.link") }}</span>
              <div class="result-value-row">
                <span class="result-value">{{ shareLink }}</span>
                <button class="copy-btn" @click="copyLink">
                  <ion-icon :icon="copyOutline" />
                </button>
              </div>
            </div>

            <!-- 分享密码 -->
            <div v-if="sharePassword" class="result-item result-item--bordered">
              <span class="result-label">{{ t("share.create.passwordResult") }}</span>
              <div class="result-value-row">
                <span class="result-value">{{ sharePassword }}</span>
                <button class="copy-btn" @click="copyPassword">
                  <ion-icon :icon="copyOutline" />
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>

    </div>
  </IonModal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { IonModal, IonIcon, IonInput } from "@ionic/vue";
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
/* ========== 整体容器 ========== */
.share-sheet {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--z-bg-page);
}

/* ========== 自定义标题栏 ========== */
.modal-header {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 var(--z-space-xs);
  background: var(--z-bg-page);
  flex-shrink: 0;
  border-bottom: 1px solid var(--z-border-light);
}

.header-btn {
  flex-shrink: 0;
  min-width: 48px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0 var(--z-space-sm);
  font-size: var(--z-fs-body);
  cursor: pointer;
  border-radius: var(--z-radius-sm);
}

.header-btn-cancel {
  color: var(--z-text-secondary);
}

.header-btn-confirm {
  color: var(--z-primary);
  font-weight: 600;
}

.header-btn-disabled {
  color: var(--z-text-disabled);
  cursor: not-allowed;
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: var(--z-fs-body-lg);
  font-weight: 600;
  color: var(--z-text-primary);
}

/* ========== 内容区 ========== */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--z-space-lg);
  -webkit-overflow-scrolling: touch;
}

/* ========== 创建前：信息卡片 ========== */
.info-card {
  background: var(--z-bg-surface);
  border-radius: var(--z-radius-md);
  padding: var(--z-space-md);
  box-shadow: var(--z-shadow-xs);
  margin-bottom: var(--z-space-lg);
}

.info-label {
  font-size: var(--z-fs-caption);
  color: var(--z-text-tertiary);
  margin-bottom: 4px;
}

.info-value {
  font-size: var(--z-fs-body-lg);
  font-weight: 600;
  color: var(--z-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== 表单分组 ========== */
.form-group {
  margin-bottom: var(--z-space-lg);
}

.form-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: var(--z-space-sm);
}

.form-label {
  font-size: var(--z-fs-body);
  font-weight: 600;
  color: var(--z-text-primary);
}

.form-hint {
  font-size: var(--z-fs-caption);
  color: var(--z-text-tertiary);
}

.input-wrap {
  background: var(--z-bg-surface);
  border-radius: var(--z-radius-md);
  box-shadow: var(--z-shadow-xs);
  overflow: hidden;
}

.form-input {
  --background: transparent;
  --padding-start: var(--z-space-md);
  --padding-end: var(--z-space-md);
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-size: var(--z-fs-body);
}

/* ========== 创建成功 ========== */
.success-section {
  text-align: center;
  margin-bottom: var(--z-space-lg);
}

.success-icon {
  font-size: 48px;
  color: var(--z-success);
}

.success-text {
  margin-top: 8px;
  font-size: var(--z-fs-body-lg);
  font-weight: 600;
  color: var(--z-text-primary);
}

/* ========== 结果卡片 ========== */
.result-card {
  background: var(--z-bg-surface);
  border-radius: var(--z-radius-md);
  box-shadow: var(--z-shadow-xs);
  overflow: hidden;
}

.result-item {
  padding: var(--z-space-md);
}

.result-item--bordered {
  border-top: 1px solid var(--z-border-light);
}

.result-label {
  font-size: var(--z-fs-caption);
  color: var(--z-text-tertiary);
  margin-bottom: 6px;
}

.result-value-row {
  display: flex;
  align-items: center;
  gap: var(--z-space-sm);
}

.result-value {
  flex: 1;
  font-size: var(--z-fs-body);
  color: var(--z-text-primary);
  word-break: break-all;
  user-select: all;
}

.copy-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--z-radius-sm);
  color: var(--z-primary);
  font-size: 20px;
  cursor: pointer;
  transition: background 0.15s;
}

.copy-btn:active {
  background: var(--z-bg-subtle);
}

</style>
