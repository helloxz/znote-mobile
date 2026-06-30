<template>
  <ion-page>
    <!-- 自定义固定顶部栏：标题 + 清空按钮 -->
    <div class="custom-header">
      <div class="title-row">
        <span class="title-text">{{ t("trash.title") }}</span>
        <div
          class="header-action"
          :class="{ 'header-action--disabled': trashNotes.length === 0 || emptying }"
          @click="handleEmptyTrash"
        >
          <ion-icon :icon="trashOutline" class="action-icon" />
          <span class="action-label">{{ t("trash.empty.button") }}</span>
        </div>
      </div>
    </div>

    <ion-content
      :fullscreen="true"
      id="trash-content"
      class="trash-content"
      ref="contentRef"
    >
      <!-- 占位：撑开与 custom-header 等高的空间 -->
      <div class="header-placeholder"></div>

      <!-- 回收站列表 -->
      <div class="trash-list">
        <!-- 加载中：骨架屏 -->
        <template v-if="loading">
          <div v-for="i in 6" :key="`sk-${i}`" class="trash-card skeleton-card">
            <ion-skeleton-text :animated="true" class="sk-title" />
            <ion-skeleton-text :animated="true" class="sk-meta" />
          </div>
        </template>

        <!-- 有数据 -->
        <template v-else-if="trashNotes.length > 0">
          <div
            v-for="note in trashNotes"
            :key="note.id"
            class="trash-card"
            @touchstart.passive="(e: TouchEvent) => onTouchStart(e, note)"
            @touchmove.passive="onTouchMove"
            @touchend="onTouchEnd"
            @touchcancel="onTouchCancel"
            @contextmenu.prevent="(e: Event) => onContextMenu(e, note)"
          >
            <!-- 笔记标题 -->
            <p class="card-title">{{ note.title || t("note.untitled") }}</p>

            <!-- 底部：删除时间 -->
            <div class="card-meta">
              <ion-icon :icon="timeOutline" class="meta-icon" />
              <span class="card-date">{{ formatDate(note.deleted_at) }}</span>
            </div>
          </div>
        </template>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <ion-icon :icon="trashOutline" class="empty-icon" />
          <p class="empty-text">{{ t("trash.empty") }}</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import {
  IonPage,
  IonIcon,
  IonContent,
  IonSkeletonText,
  actionSheetController,
  alertController,
  toastController,
} from "@ionic/vue";
import { trashOutline, timeOutline } from "ionicons/icons";
import { fetchTrashNotes, emptyTrash, permanentDeleteNote } from "@/api/notebook";
import type { Note } from "@/types/note";

const { t } = useI18n();

// ion-content 实例引用（用于 dismiss overlay 后恢复滚动）
const contentRef = ref<InstanceType<typeof IonContent> | null>(null);

// 回收站数据
const trashNotes = ref<Note[]>([]);
const loading = ref(false);
const emptying = ref(false);

/** 格式化日期：YYYY/MM/DD HH:mm */
const formatDate = (ts: number | string | null | undefined): string => {
  if (!ts) return "";
  const ms = typeof ts === "number" && ts < 1e12 ? ts * 1000 : ts;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 加载回收站列表 */
const loadTrashNotes = async () => {
  loading.value = true;
  try {
    const res = await fetchTrashNotes();
    const body = res.data as { code: number; msg: string; data: Note[] };
    if (body.code === 200) {
      trashNotes.value = body.data ?? [];
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadTrashNotes();
});

// ========== 长按手势 ==========
// 500ms 长按后设置标记，touchend 时才弹出 actionSheet，
// 避免 touch 序列中途弹 overlay 导致 Ionic 滚动锁残留

let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let longPressTriggered = false;
let startPoint = { x: 0, y: 0 };
let currentNote: Note | null = null;

const onTouchStart = (e: TouchEvent, note: Note) => {
  const touch = e.touches[0];
  startPoint = { x: touch.clientX, y: touch.clientY };
  longPressTriggered = false;
  currentNote = note;
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
  if (longPressTriggered && currentNote) {
    longPressTriggered = false;
    showActionSheet(currentNote);
    currentNote = null;
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
const onContextMenu = (_e: Event, note: Note) => {
  showActionSheet(note);
};

/**
 * 强制清理 overlay dismiss 后可能残留的滚动锁。
 * 参考 ShareView.vue 的 restoreScroll 实现
 */
const restoreScroll = () => {
  requestAnimationFrame(() => {
    document.body.classList.remove("backdrop-no-scroll");
    document.body.style.removeProperty("overflow");

    const appRoot = document.querySelector("ion-app") || document.body;
    const viewContainer = appRoot.querySelector(
      "ion-router-outlet, #ion-view-container-root"
    );
    if (viewContainer) {
      viewContainer.removeAttribute("aria-hidden");
      viewContainer.removeAttribute("inert");
    }

    const ionContentEl = contentRef.value?.$el as
      | (HTMLElement & { getScrollElement?: () => Promise<HTMLElement> })
      | undefined;
    void ionContentEl?.getScrollElement?.().then((scrollEl) => {
      scrollEl.style.removeProperty("overflow");
      scrollEl.style.removeProperty("overflow-y");
      scrollEl.style.removeProperty("touch-action");
      scrollEl.style.removeProperty("pointer-events");
    });
  });

  setTimeout(() => {
    document.body.classList.remove("backdrop-no-scroll");
    document.body.style.removeProperty("overflow");
  }, 100);
};

// ========== 长按弹出 Action Sheet ==========

/** 弹出底部操作菜单：移动笔记 / 彻底删除 */
const showActionSheet = async (note: Note) => {
  const actionSheet = await actionSheetController.create({
    header: note.title || t("note.untitled"),
    buttons: [
      {
        text: t("trash.move"),
        role: "move",
      },
      {
        text: t("trash.permanent_delete"),
        role: "delete",
        cssClass: "danger",
      },
      {
        text: t("note.list.cancel"),
        role: "cancel",
      },
    ],
  });
  await actionSheet.present();
  const { role } = await actionSheet.onDidDismiss();

  // overlay dismiss 后主动恢复滚动
  restoreScroll();

  if (role === "move") {
    await handleMoveNote();
  } else if (role === "delete") {
    await handlePermanentDelete(note);
  }
};

/** 移动笔记：暂不实现功能，保留入口 */
const handleMoveNote = async () => {
  await showToast(t("note.list.feature.comingSoon"), "warning");
};

/** 彻底删除：先弹确认框，确认后调 API 删除 */
const handlePermanentDelete = async (note: Note) => {
  const alert = await alertController.create({
    header: t("trash.permanent_delete"),
    message: t("trash.permanent_delete.confirm"),
    buttons: [
      {
        text: t("note.list.cancel"),
        role: "cancel",
      },
      {
        text: t("note.dialog.confirm"),
        role: "confirm",
        cssClass: "danger",
      },
    ],
  });
  await alert.present();
  const { role } = await alert.onDidDismiss();

  restoreScroll();

  if (role === "confirm") {
    const res = await permanentDeleteNote(note.id);
    const body = res.data as { code: number; msg: string };
    if (body.code === 200) {
      await showToast(t("trash.permanent_delete.success"), "success");
      // 从本地列表移除已删除项
      trashNotes.value = trashNotes.value.filter((n) => n.id !== note.id);
    }
  }
};

// ========== 清空回收站 ==========

/** 点击清空按钮：弹确认框 → 调 API 清空 */
const handleEmptyTrash = async () => {
  // 回收站为空或正在清空中不响应
  if (trashNotes.value.length === 0 || emptying.value) return;

  const alert = await alertController.create({
    header: t("trash.empty.button"),
    message: t("trash.empty.confirm"),
    buttons: [
      {
        text: t("note.list.cancel"),
        role: "cancel",
      },
      {
        text: t("note.dialog.confirm"),
        role: "confirm",
        cssClass: "danger",
      },
    ],
  });
  await alert.present();
  const { role } = await alert.onDidDismiss();

  restoreScroll();

  if (role !== "confirm") return;

  emptying.value = true;
  try {
    const res = await emptyTrash();
    const body = res.data as { code: number; msg: string; data: { deleted: number } };
    if (body.code === 200) {
      trashNotes.value = [];
      await showToast(t("trash.empty.success"), "success");
    }
  } finally {
    emptying.value = false;
  }
};

/** Toast 提示 */
const showToast = async (message: string, color: string = "danger") => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color,
    position: "top",
  });
  await toast.present();
};
</script>

<style scoped>
/* 内容区背景 */
.trash-content {
  --background: var(--z-bg-page);
}

/* 自定义顶部栏：固定顶部 */
.custom-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: var(--z-bg-page);
  padding-top: env(safe-area-inset-top);
}

/* 标题行 */
.title-row {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 var(--z-space-md);
}

.title-text {
  flex: 1;
  text-align: center;
  font-size: var(--z-fs-body-lg);
  font-weight: 600;
  color: var(--z-text-primary);
  margin-left: 64px; /* 右侧清空按钮的宽度，保持标题居中 */
}

/* 右侧清空按钮 */
.header-action {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: var(--z-radius-sm);
  color: var(--z-danger);
  font-size: var(--z-fs-body-sm);
  cursor: pointer;
  transition: opacity 0.15s;
  user-select: none;
}

.header-action:active {
  opacity: 0.7;
}

.header-action--disabled {
  opacity: 0.35;
  pointer-events: none;
}

.action-icon {
  font-size: 16px;
}

.action-label {
  font-weight: 500;
}

/* 占位：撑开与 custom-header 等高的空间 */
.header-placeholder {
  height: calc(48px + env(safe-area-inset-top));
}

/* 回收站列表 */
.trash-list {
  padding: 0 var(--z-space-md) var(--z-space-md);
  display: flex;
  flex-direction: column;
  gap: var(--z-space-sm);
}

/* 回收站卡片 */
.trash-card {
  background: var(--z-bg-surface);
  border-radius: var(--z-radius-md);
  padding: var(--z-space-md);
  box-shadow: var(--z-shadow-xs);
}

.card-title {
  font-size: var(--z-fs-body-lg);
  font-weight: 600;
  color: var(--z-text-primary);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 底部信息行：删除时间 */
.card-meta {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-icon {
  font-size: 13px;
  color: var(--z-text-tertiary);
  flex-shrink: 0;
}

.card-date {
  font-size: var(--z-fs-caption);
  color: var(--z-text-tertiary);
}

/* 骨架屏 */
.skeleton-card {
  padding: var(--z-space-md);
}

.sk-title {
  width: 60%;
  height: 18px;
  margin-bottom: 10px;
  border-radius: var(--z-radius-sm);
}

.sk-meta {
  width: 40%;
  height: 14px;
  border-radius: var(--z-radius-sm);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding-top: 25vh;
}

.empty-icon {
  font-size: 56px;
  color: var(--z-text-disabled);
}

.empty-text {
  margin-top: 12px;
  font-size: var(--z-fs-body);
  color: var(--z-text-tertiary);
}
</style>