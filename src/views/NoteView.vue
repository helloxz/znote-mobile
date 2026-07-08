<template>
  <ion-page>
    <!-- 自定义顶部栏（不用 ion-header/ion-toolbar，避免其伪元素阴影） -->
    <div ref="headerRef" class="custom-header">
      <!-- 标题行：左汉堡菜单 + 中标题 + 右设置 -->
      <div class="title-row">
        <button class="icon-btn" @click="openMenu">
          <ion-icon :icon="menuOutline" />
        </button>
        <span class="title-text">{{ pageTitle }}</span>
        <button class="icon-btn" @click="showSettingMenu">
          <ion-icon :icon="cogOutline" />
        </button>
      </div>
      <!-- 搜索框 -->
      <div class="search-wrap">
        <ion-searchbar
          v-model="keyword"
          :placeholder="t('note.searchPlaceholder')"
          class="note-searchbar"
        />
      </div>
    </div>

    <ion-content
      :fullscreen="true"
      class="note-content"
    >
      <!-- 占位：撑开与 custom-header 等高的空间，避免内容被 fixed header 遮挡 -->
      <div class="header-placeholder" :style="placeholderStyle"></div>

      <!-- 下拉刷新：保持为 ion-content 直接子元素，避免 iOS PWA 下 slot/flex 组合裁切首个卡片 -->
      <ion-refresher slot="fixed" @ionRefresh="onRefresh($event)">
        <ion-refresher-content
          pulling-icon="lines"
          refreshing-spinner="crescent"
        />
      </ion-refresher>

      <!-- 笔记列表 -->
      <div class="note-list">
        <!-- 加载中：骨架屏（分类加载 or 搜索加载） -->
        <template v-if="noteStore.loadingNotes || noteStore.loadingSearch">
          <div v-for="i in 6" :key="`sk-${i}`" class="note-card skeleton-card">
            <ion-skeleton-text :animated="true" class="sk-title" />
            <ion-skeleton-text :animated="true" class="sk-desc" />
            <ion-skeleton-text :animated="true" class="sk-desc short" />
          </div>
        </template>

        <!-- 笔记列表（可拖拽排序，搜索态下禁用拖拽） -->
        <template v-else-if="noteStore.currentNotes.length > 0">
          <VueDraggable
            v-model="localNotes"
            class="draggable-list"
            :handle="'.drag-handle'"
            :animation="150"
            :disabled="sorting || noteStore.searchMode"
            @end="onDragEnd"
          >
            <NoteListItem
              v-for="note in localNotes"
              :key="note.id"
              v-memo="[note.id, note.updated_at, note.title, note.content, note.is_pinned, note.allow_vectorize, note.is_vectorized]"
              :note="note"
              :draggable="note.is_pinned !== 1 && !noteStore.searchMode"
              :notebook-title="noteStore.searchMode ? notebookTitleMap[note.notebook_id] : undefined"
              @select="onNoteSelect"
              @contextmenu="onNoteContextMenu"
            />
          </VueDraggable>
        </template>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <ion-icon :icon="documentsOutline" class="empty-icon" />
          <p class="empty-text">{{
            noteStore.searchMode ? t("note.search.empty") : t("note.empty")
          }}</p>
        </div>
      </div>
    </ion-content>

    <!-- 悬浮新建笔记按钮 -->
    <button
      v-if="noteStore.activeCategoryId && keyword.trim().length === 0 && !noteStore.searchMode"
      class="fab-create"
      @click="onCreateNote"
    >
      <ion-icon :icon="addOutline" />
    </button>

    <!-- 悬浮 AI 按钮：始终显示，位于添加按钮下方，避免添加按钮消失导致按钮跳动 -->
    <button
      class="fab-ai"
      :title="t('note.ai.button')"
      @click="goAI"
    >
      <ion-icon :icon="sparklesOutline" />
    </button>

    <!-- 移动笔记弹窗 -->
    <MoveCategoryModal
      :show="showMoveNoteModal"
      type="note"
      :source-id="moveNoteId"
      :source-name="moveNoteName"
      :category-tree="noteStore.currentCategoryTree"
      :current-category-id="moveNoteCurrentCategoryId"
      @confirm="onMoveNoteConfirm"
      @cancel="onMoveNoteCancel"
      @update:show="showMoveNoteModal = $event"
    />

    <!-- 创建分享弹窗 -->
    <CreateShareModal
      :show="showCreateShareModal"
      :note-id="shareNoteId"
      :note-title="shareNoteTitle"
      @cancel="showCreateShareModal = false"
      @update:show="showCreateShareModal = $event"
    />

    <!-- 底部滑出设置面板 -->
    <SettingsSheet
      :show="showSettings"
      @update:show="showSettings = $event"
      @change-password="router.push('/change-password')"
      @about="router.push('/about')"
      @logout="onLogout"
    />

    <!-- 底部操作面板（笔记长按菜单） -->
    <ActionSheet
      :show="actionSheet.show.value"
      :header="actionSheet.options.value.header"
      :buttons="actionSheet.options.value.buttons"
      :cancel-text="actionSheet.options.value.cancelText"
      @update:show="actionSheet.onClose"
      @select="actionSheet.onSelect"
    />

    <!--
      离屏快照容器：生成分享图片时渲染 NoteSnapshotCard，截图后立即卸载。
      绝对定位移出可视区且 z-index 置底，不能用 display:none（截图库拿不到布局尺寸）。
      宽度由卡片自身（750px）决定，容器只负责承载。
    -->
    <div v-if="snapshotNote" class="snapshot-host">
      <NoteSnapshotCard
        ref="snapshotCardRef"
        :note="snapshotNote"
      />
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  IonPage,
  IonIcon,
  IonContent,
  IonSearchbar,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  menuController,
  onIonViewWillEnter,
} from "@ionic/vue";
import { VueDraggable } from "vue-draggable-plus";
import { Capacitor } from "@capacitor/core";
import {
  menuOutline,
  cogOutline,
  documentsOutline,
  addOutline,
  sparklesOutline,
} from "ionicons/icons";
import { useUserStore } from "@/stores/user";
import { useNoteStore } from "@/stores/note";
import { useTrashStore } from "@/stores/trash";
import type { Note } from "@/types/note";
import SettingsSheet from "@/components/note/SettingsSheet.vue";
import NoteListItem from "@/components/note/NoteListItem.vue";
import ActionSheet from "@/components/note/ActionSheet.vue";
import MoveCategoryModal from "@/components/note/MoveCategoryModal.vue";
import CreateShareModal from "@/components/note/CreateShareModal.vue";
import NoteSnapshotCard from "@/components/note/NoteSnapshotCard.vue";
import { useActionSheet } from "@/composables/useActionSheet";
import { useToast } from "@/composables/useToast";
import { useNoteImageShare } from "@/composables/useNoteImageShare";
import { useFixedHeader } from "@/composables/useFixedHeader";

const router = useRouter();
const { headerRef, placeholderStyle, remeasure } = useFixedHeader();
const { t } = useI18n();
const userStore = useUserStore();
const noteStore = useNoteStore();
const trashStore = useTrashStore();
const actionSheet = useActionSheet();
const { showToast } = useToast();
const { snapshotNote, snapshotCardRef, shareAsImage } = useNoteImageShare();

// 搜索关键字
const keyword = ref("");

// 首屏加载笔记本树
onMounted(() => {
  noteStore.loadNotebookTree().catch(() => {});
});

/** Tab 切换回来时重新测量 header，防止 overlay 残留导致占位高度失效 */
onIonViewWillEnter(() => {
  nextTick(() => requestAnimationFrame(remeasure));
});

// ========== 搜索：输入达 3 字符自动搜索，清空恢复原列表 ==========
let searchTimer: ReturnType<typeof setTimeout> | null = null;

watch(keyword, (val) => {
  const kw = val.trim();
  // 清除上一次防抖
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
  // 不足 3 字符：退出搜索态，恢复原分类笔记
  if (kw.length < 3) {
    if (noteStore.searchMode) {
      noteStore.clearSearch();
    }
    return;
  }
  // 防抖 300ms 后调后端搜索
  searchTimer = setTimeout(() => {
    void noteStore.searchNotes(kw);
  }, 300);
});

// 组件卸载时清理防抖定时器
onUnmounted(() => {
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
});

/** 顶部标题：当前分类名 → 笔记本名 → ZNote */
const pageTitle = computed(() => {
    // 递归在当前笔记本的分类树中找当前分类名
    const findName = (
      nodes: typeof noteStore.currentCategoryTree,
    ): string | null => {
      for (const n of nodes) {
        if (n.id === noteStore.activeCategoryId) return n.title;
        if (n.children?.length) {
          const r = findName(n.children);
          if (r) return r;
        }
      }
      return null;
    };
    return (
      findName(noteStore.currentCategoryTree) ||
      noteStore.activeNotebook?.title ||
      t("note.title")
    );
  });

  /**
   * 搜索模式下，从笔记本树构建 notebook_id → title 的映射表
   * 用于在搜索结果中展示每条笔记所属的分类名称
   */
  const notebookTitleMap = computed(() => {
    const map: Record<number, string> = {};
    const walk = (nodes: typeof noteStore.currentCategoryTree) => {
      for (const n of nodes) {
        // 只记录非顶层笔记本的分类节点（顶层笔记本的 title 是笔记本名，不是分类名）
        map[n.id] = n.title;
        if (n.children?.length) {
          walk(n.children);
        }
      }
    };
    // 遍历整个笔记本树（非仅当前笔记本），覆盖所有搜索结果可能归属的分类
    for (const nb of noteStore.notebookTree) {
      if (nb.children?.length) {
        walk(nb.children);
      }
    }
    return map;
  });

/** 打开侧边栏 */
const openMenu = () => {
  void menuController.open("note-menu");
};

/** 跳转 AI 对话页 */
const goAI = () => {
  router.push("/ai");
};

// 设置面板显隐
const showSettings = ref(false);

/** 设置按钮 → 打开底部滑出设置面板 */
const showSettingMenu = () => {
  showSettings.value = true;
};

/** 退出登录：调后端撤销 session + 清本地数据 + 跳登录页 */
const onLogout = async () => {
  await userStore.logout();
  router.replace("/login");
};

// ========== 笔记列表：拖拽排序 + 长按菜单 ==========

// 移动笔记弹窗状态
const showMoveNoteModal = ref(false);
const moveNoteId = ref(0);
const moveNoteName = ref("");
const moveNoteCurrentCategoryId = ref<number | undefined>(undefined);

// 创建分享弹窗状态
const showCreateShareModal = ref(false);
const shareNoteId = ref(0);
const shareNoteTitle = ref("");

// 本地笔记副本（VueDraggable 直接 mutate，watch 同步 store 数据）
const localNotes = ref<Note[]>([]);

// 同步 store 数据到本地副本（store 数据变化时刷新）
watch(
  () => noteStore.currentNotes,
  (notes) => {
    localNotes.value = [...notes];
  },
  { immediate: true }
);

const sorting = ref(false);

/** 下拉刷新：重新加载当前分类的笔记列表 */
const onRefresh = async (event: Event) => {
  const target = event.target as HTMLIonRefresherElement;
  try {
    // 非搜索模式且有选中分类时，强制刷新该分类的笔记
    if (!noteStore.searchMode && noteStore.activeCategoryId) {
      await noteStore.loadCategoryNotes(noteStore.activeCategoryId, true);
    }
    // 结束刷新动画
    target.complete();
    await showToast(t("common.refresh.success"), "success");
  } catch {
    // 网络错误由 axios 拦截器统一弹 toast，此处不重复弹
    target.complete();
  }
};

/** 拖拽结束：构建 items 调排序 API，失败回退 */
const onDragEnd = async () => {
  const items = localNotes.value.map((n, idx) => ({
    id: n.id,
    sort_order: idx,
  }));
  sorting.value = true;
  const ok = await noteStore.sortNotes(items);
  sorting.value = false;
  if (!ok) {
    // 失败回退到 store 顺序
    localNotes.value = [...noteStore.currentNotes];
    await showToast(t("note.list.sort.failed"));
  }
};

/** 短按笔记：进入笔记详情子页面（预览态） */
const onNoteSelect = (note: Note) => {
  router.push(`/note/${note.id}`);
};

/** 创建新笔记：自动创建默认笔记，新笔记出现在列表顶部 */
const onCreateNote = async () => {
  // 未选中分类或搜索模式下不响应
  if (!noteStore.activeCategoryId || noteStore.searchMode) return;

  const note = await noteStore.createNote({
    notebook_id: noteStore.activeCategoryId,
    title: t("note.untitled"),
    content: "",
  });
  if (note) {
    // 创建成功，笔记已自动出现在列表顶部，无需跳转
  } else {
    await showToast(t("unknown"), "danger");
  }
};

/** 长按笔记：弹出底部操作面板 */
const onNoteContextMenu = async (note: Note) => {
  const isPinned = note.is_pinned === 1;
  const isVectorized = note.allow_vectorize === 1;
  const role = await actionSheet.showActionSheet({
    header: note.title || t("note.untitled"),
    buttons: [
      {
        text: isPinned ? t("note.list.unpin") : t("note.list.pin"),
        role: "pin",
      },
      {
        text: t("note.list.edit"),
        role: "edit",
      },
      {
        text: t("note.list.share"),
        role: "share",
      },
      // 仅原生 APP 支持图片分享（PWA 下隐藏）
      ...(Capacitor.isNativePlatform() ? [{
        text: t("note.list.shareImage"),
        role: "share-image",
      }] : []),
      {
        text: t("note.list.move"),
        role: "move",
      },
      {
        text: isVectorized ? t("note.list.disable_vectorize") : t("note.list.enable_vectorize"),
        role: "toggle_vectorize",
      },
      {
        text: t("note.list.trash"),
        role: "trash",
      },
    ],
  });

  if (role === "pin") {
    // 置顶/取消置顶：复用 updateNote 传 is_pinned
    const next = isPinned ? 0 : 1;
    const ok = await noteStore.updateNote(note.id, { is_pinned: next });
    await showToast(
      ok
        ? t(next === 1 ? "note.list.pin.success" : "note.list.unpin.success")
        : t("unknown"),
      ok ? "success" : "danger"
    );
  } else if (role === "edit") {
    // 延迟 200ms 进入编辑模式，等待 ActionSheet 关闭动画完成
    router.push(`/note/${note.id}?edit=true`);
  } else if (role === "trash") {
    // 移入回收站：软删除，store 更新后列表自动刷新
    const ok = await noteStore.deleteNote(note.id);
    if (ok) {
      // 标记回收站列表已变更，切到【回收站】tab 时刷新一次
      trashStore.markDirty();
    }
    await showToast(
      ok ? t("note.list.trash.success") : t("unknown"),
      ok ? "success" : "danger"
    );
  } else if (role === "move") {
    // 打开移动笔记弹窗
    moveNoteId.value = note.id;
    moveNoteName.value = note.title || t("note.untitled");
    moveNoteCurrentCategoryId.value = note.notebook_id;
    showMoveNoteModal.value = true;
  } else if (role === "share") {
    // 打开创建分享弹窗
    shareNoteId.value = note.id;
    shareNoteTitle.value = note.title || t("note.untitled");
    showCreateShareModal.value = true;
  } else if (role === "share-image") {
    // 笔记转图片并唤起系统分享面板（微信/QQ 等）
    const res = await shareAsImage(note);
    await showToast(t(res.msg), res.ok ? "success" : "danger");
  } else if (role === "toggle_vectorize") {
    // 切换向量化开关：allow_vectorize 0/1 互转
    const next = note.allow_vectorize === 1 ? 0 : 1;
    const ok = await noteStore.updateNote(note.id, { allow_vectorize: next });
    await showToast(
      ok
        ? t(next === 1 ? "note.list.enable_vectorize.success" : "note.list.disable_vectorize.success")
        : t("unknown"),
      ok ? "success" : "danger"
    );
  }
};

/** 移动笔记确认：调用 store 更新 notebook_id */
const onMoveNoteConfirm = async (targetId: number) => {
  showMoveNoteModal.value = false;
  const ok = await noteStore.updateNote(moveNoteId.value, {
    notebook_id: targetId,
  });
  await showToast(
    ok ? t("note.move.success") : t("unknown"),
    ok ? "success" : "danger"
  );
};

/** 移动笔记取消 */
const onMoveNoteCancel = () => {
  showMoveNoteModal.value = false;
};

</script>

<style scoped>
/* 内容区背景 */
.note-content {
  --background: var(--z-bg-page);
}

/* 自定义顶部栏：固定顶部，与页面背景一致，无任何边框阴影 */
.custom-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: var(--z-bg-page);
  padding-top: var(--z-safe-area-top);
}

/* 标题行 */
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

/* 图标按钮（原生 button，无 Ionic toolbar 样式） */
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

/* 搜索框容器：左右 padding 与笔记列表对齐 */
.search-wrap {
  padding: 0 var(--z-space-md) var(--z-space-sm);
}

.note-searchbar {
  --background: var(--z-bg-surface);
  --border-radius: var(--z-radius-md);
  --box-shadow: none;
  padding: 0;
}

/* 占位：撑开与 custom-header 等高的空间，避免内容被 fixed header 遮挡 */
.header-placeholder {
  /* 标题行 48px + 搜索框区 + 安全区顶部；测量后会用真实值覆盖 */
  height: calc(48px + 58px + var(--z-safe-area-top));
}

/* 笔记列表 */
.note-list {
  padding: 0 var(--z-space-md) var(--z-space-md);
  display: flex;
  flex-direction: column;
  gap: var(--z-space-sm);
}

/* VueDraggable 根元素：继承 flex 布局 + gap，保证卡片之间有间隙 */
.draggable-list {
  display: flex;
  flex-direction: column;
  gap: var(--z-space-sm);
}

/* 笔记卡片 */
.note-card {
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

/* 骨架屏卡片 */
.skeleton-card {
  padding: var(--z-space-md);
}

.sk-title {
  width: 50%;
  height: 18px;
  margin-bottom: 10px;
  border-radius: var(--z-radius-sm);
}

.sk-desc {
  width: 100%;
  height: 14px;
  margin-bottom: 8px;
  border-radius: var(--z-radius-sm);
}

.sk-desc.short {
  width: 40%;
  margin-bottom: 0;
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

/* 悬浮按钮通用样式：44x44px，右下角固定定位 */
.fab-create,
.fab-ai {
  position: fixed;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  transition: transform 0.2s, opacity 0.2s, box-shadow 0.2s;
}

.fab-create ion-icon,
.fab-ai ion-icon {
  font-size: 20px;
}

/* 悬浮新建笔记按钮：位于 AI 按钮上方，避免与 AI 按钮重叠 */
.fab-create {
  bottom: calc(78px + env(safe-area-inset-bottom));
  background: var(--ion-color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.fab-create:active {
  transform: scale(0.92);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 悬浮 AI 按钮：始终显示，位于最下方，避免添加按钮消失导致按钮跳动 */
.fab-ai {
  bottom: calc(24px + env(safe-area-inset-bottom));
  background: var(--z-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.fab-ai:active {
  transform: scale(0.92);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 离屏快照容器：绝对定位移出可视区且置底，不可用 display:none（截图库拿不到布局尺寸） */
.snapshot-host {
  position: fixed;
  left: -99999px;
  top: 0;
  z-index: -1;
  pointer-events: none;
}
</style>
