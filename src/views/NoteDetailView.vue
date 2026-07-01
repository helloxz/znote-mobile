<template>
  <ion-page>
    <!-- 自定义顶部栏：左返回 + 右图标按钮 -->
    <div class="custom-header">
      <div class="title-row">
        <button class="icon-btn" @click="onBack">
          <ion-icon :icon="chevronBack" />
        </button>
        <span class="title-text">{{ note?.title || t("note.untitled") }}</span>
        <div class="action-btns">
          <!-- 编辑态：先预览按钮，再保存按钮 -->
          <template v-if="mode === 'edit'">
            <button
              class="icon-btn"
              :disabled="saving || loading"
              :title="t('note.detail.preview')"
              @click="onPreview"
            >
              <ion-icon :icon="eyeOutline" />
            </button>
            <button
              class="icon-btn"
              :disabled="saving || loading"
              :title="t('note.detail.save')"
              @click="onSave"
            >
              <ion-icon v-if="!saving" :icon="saveOutline" />
              <ion-icon v-else class="spin" :icon="reloadOutline" />
            </button>
          </template>
          <!-- 预览态：编辑按钮 -->
          <button
            v-else
            class="icon-btn"
            :disabled="saving || loading"
            :title="t('note.detail.edit')"
            @click="onEdit"
          >
            <ion-icon :icon="createOutline" />
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== 预览态 ==================== -->
    <template v-if="mode === 'read'">
      <ion-content :fullscreen="true" class="detail-content">
        <div class="header-placeholder"></div>

        <!-- 加载中 -->
        <div v-if="loading" class="state-wrap">
          <ion-spinner name="crescent" class="spinner" />
        </div>

        <!-- 错误 -->
        <div v-else-if="error" class="state-wrap">
          <ion-icon :icon="alertCircleOutline" class="state-icon" />
          <span class="state-text">{{ error }}</span>
        </div>

        <!-- 白色内容卡片 -->
        <div v-else-if="note" class="content-card">
          <h1 class="note-title">{{ note.title || t("note.untitled") }}</h1>

          <div v-if="note.updated_at" class="update-time">
            <ion-icon :icon="timeOutline" class="time-icon" />
            <span>{{ formatTime(note.updated_at) }}</span>
          </div>

          <MarkdownViewer :content="draftContent" class="viewer-area" />
        </div>
      </ion-content>
    </template>

    <!-- ==================== 编辑态 ==================== -->
    <template v-else>
      <!-- 加载中 -->
      <div v-if="loading" class="state-wrap">
        <ion-spinner name="crescent" class="spinner" />
      </div>

      <!-- 错误 -->
      <div v-else-if="error" class="state-wrap">
        <ion-icon :icon="alertCircleOutline" class="state-icon" />
        <span class="state-text">{{ error }}</span>
      </div>

      <!-- 编辑态：flex 布局，标题栏固定 + 编辑器撑满剩余空间 -->
      <div v-else-if="note" class="edit-page">
        <div class="edit-title-bar">
          <input
            v-model="draftTitle"
            :placeholder="t('note.detail.titlePlaceholder')"
            class="note-title-input"
            @keydown.enter="($event.target as HTMLElement).blur()"
          />
        </div>
        <MarkdownEditor
          v-model="draftContent"
          :placeholder="t('note.detail.editPlaceholder')"
          class="edit-editor"
        />
      </div>
    </template>
  </ion-page>
</template>

<script setup lang="ts">
/**
 * 笔记详情子页面
 *
 * 预览态：ion-content 内白色卡片包裹标题 + 时间 + 渲染内容，可滚动
 * 编辑态：固定标题栏 + 编辑器撑满剩余空间（工具栏固定不滚动，编辑器自带滚动）
 */
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  IonPage,
  IonIcon,
  IonContent,
  IonSpinner,
} from "@ionic/vue";
import {
  chevronBack,
  reloadOutline,
  alertCircleOutline,
  createOutline,
  eyeOutline,
  saveOutline,
  timeOutline,
} from "ionicons/icons";
import { useNoteStore } from "@/stores/note";
import { fetchNoteById } from "@/api/notebook";
import type { Note } from "@/types/note";
import type { ApiResponse } from "@/api/user";
import MarkdownViewer from "@/components/note/MarkdownViewer.vue";
import MarkdownEditor from "@/components/note/MarkdownEditor.vue";
import { useToast } from "@/composables/useToast";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const noteStore = useNoteStore();

const mode = ref<"read" | "edit">("read");
const loading = ref(false);
const error = ref("");
const saving = ref(false);
const note = ref<Note | null>(null);
const draftTitle = ref("");
const draftContent = ref("");

const hasUnsavedChanges = computed(() => {
  if (!note.value) return false;
  return (
    draftTitle.value !== note.value.title ||
    draftContent.value !== note.value.content
  );
});

/** 格式化时间：兼容 Unix 秒数 / ISO 字符串 → YYYY-MM-DD */
const formatTime = (val: any): string => {
  if (!val) return "";
  const ms = typeof val === "number" && val < 1e12 ? val * 1000 : val;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const loadNote = async (id: number) => {
  loading.value = true;
  error.value = "";
  try {
    let found: Note | null = null;
    for (const catId of Object.keys(noteStore.notesByCategory)) {
      const list = noteStore.notesByCategory[Number(catId)];
      const n = list.find((item) => item.id === id);
      if (n) { found = n; break; }
    }
    if (!found) {
      const res = await fetchNoteById(id);
      const body = res.data as ApiResponse<Note>;
      if (body.code === 200 && body.data) found = body.data;
    }
    if (!found) { error.value = t("note.detail.loadFailed"); return; }
    note.value = found;
    draftTitle.value = found.title || "";
    draftContent.value = found.content || "";
  } catch {
    error.value = t("note.detail.loadFailed");
  } finally {
    loading.value = false;
  }
};

const onEdit = () => { mode.value = "edit"; };

const onSave = async () => { await saveNote(); };

const onPreview = async () => {
  if (hasUnsavedChanges.value) {
    mode.value = "read";
    await saveNote();
  } else {
    mode.value = "read";
  }
};

const onBack = async () => {
  if (hasUnsavedChanges.value) {
    const ok = await saveNote();
    if (!ok) return;
  }
  router.back();
};

const saveNote = async (): Promise<boolean> => {
  if (!note.value || saving.value) return false;
  saving.value = true;
  try {
    const ok = await noteStore.updateNote(note.value.id, {
      title: draftTitle.value.trim(),
      content: draftContent.value,
    });
    if (ok) {
      note.value = { ...note.value, title: draftTitle.value.trim(), content: draftContent.value };
      await showToast(t("note.detail.saveSuccess"), "success");
      return true;
    }
    await showToast(t("note.detail.saveFailed"));
    return false;
  } catch {
    await showToast(t("note.detail.saveFailed"));
    return false;
  } finally {
    saving.value = false;
  }
};

const { showToast } = useToast();

/** 监听键盘弹出：通过 visualViewport 动态设置 --kb-height CSS 变量 */
let kbCleanup: (() => void) | null = null;

onMounted(() => {
  const id = Number(route.params.noteId);
  if (id) loadNote(id);

  // 路由参数 edit=true 时直接进入编辑态（新建笔记场景）
  if (route.query.edit === "true") {
    mode.value = "edit";
  }

  // 监听 visualViewport 变化（键盘弹出/收起），动态调整 edit-page 的 bottom
  if (window.visualViewport) {
    const handler = () => {
      const kbHeight = window.innerHeight - window.visualViewport!.height;
      document.documentElement.style.setProperty("--kb-height", `${kbHeight}px`);
    };
    window.visualViewport.addEventListener("resize", handler);
    window.visualViewport.addEventListener("scroll", handler);
    kbCleanup = () => {
      window.visualViewport!.removeEventListener("resize", handler);
      window.visualViewport!.removeEventListener("scroll", handler);
      document.documentElement.style.removeProperty("--kb-height");
    };
  }
});

onUnmounted(() => {
  kbCleanup?.();
});
</script>

<style scoped>
.detail-content {
  --background: var(--z-bg-page);
}

/* ========== 自定义顶部栏 ========== */
.custom-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  background: var(--z-bg-page);
  border-bottom: 1px solid var(--z-border);
  padding-top: env(safe-area-inset-top);
}

.title-row {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 var(--z-space-xs);
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
.icon-btn:disabled {
  opacity: 0.4;
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 2px;
}

.title-text {
  flex: 1;
  text-align: center;
  font-size: var(--z-fs-body);
  font-weight: 600;
  color: var(--z-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spin {
  animation: z-spin 0.8s linear infinite;
}
@keyframes z-spin {
  to { transform: rotate(360deg); }
}

.header-placeholder {
  height: calc(48px + env(safe-area-inset-top));
}

/* ========== 加载/错误占位 ========== */
.state-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--z-space-sm);
  padding: 4rem 0;
  color: var(--z-text-tertiary);
}
.spinner {
  color: var(--z-primary);
}
.state-icon {
  font-size: 36px;
  opacity: 0.5;
}
.state-text {
  font-size: var(--z-fs-body);
}

/* ========== 预览态：白色卡片 ========== */
.content-card {
  margin: var(--z-space-md);
  padding: var(--z-space-lg);
  background: var(--z-bg-surface);
  border-radius: var(--z-radius-lg);
  box-shadow: var(--z-shadow-xs);
}

.note-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--z-text-primary);
  margin: 0 0 var(--z-space-xs);
  line-height: 1.3;
  word-break: break-word;
}

.update-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--z-fs-caption);
  color: var(--z-text-tertiary);
  margin-bottom: var(--z-space-md);
  padding-bottom: var(--z-space-md);
  border-bottom: 1px solid var(--z-border);
}
.time-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.viewer-area {
  min-height: 0;
}

/* ========== 编辑态：flex 布局，标题栏固定 + 编辑器撑满剩余 ========== */

/* 编辑页容器：占满 header 下方全部空间，flex 纵向排列 */
.edit-page {
  position: fixed;
  top: calc(48px + env(safe-area-inset-top));
  left: 0;
  right: 0;
  bottom: var(--kb-height, 0px);
  display: flex;
  flex-direction: column;
  background: #fff;
}

/* 标题栏：固定不滚动 */
.edit-title-bar {
  flex-shrink: 0;
  padding: var(--z-space-sm) var(--z-space-md);
  border-bottom: 1px solid var(--z-border);
  background: #fff;
}

/* 编辑器：撑满剩余空间 */
.edit-editor {
  flex: 1;
  min-height: 0;
}

/* 标题输入框：无边框、无轮廓 */
.note-title-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--z-text-primary);
  line-height: 1.3;
  padding: 0;
  outline: none;
}
.note-title-input::placeholder {
  color: var(--z-text-disabled);
  font-weight: 600;
}
</style>