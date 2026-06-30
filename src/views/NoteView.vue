<template>
  <ion-page>
    <!-- 左侧侧边栏（汉堡菜单触发） -->
    <!-- 内部用普通 div 自滚动，不用 ion-content，避免 overlay dismiss 后滚动锁不释放 -->
    <ion-menu menu-id="note-menu" content-id="note-content" side="start">
      <div class="menu-scroll">
        <SidebarMenu @select="onCategorySelected" />
      </div>
    </ion-menu>

    <!-- 自定义顶部栏（不用 ion-header/ion-toolbar，避免其伪元素阴影） -->
    <div class="custom-header">
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

    <ion-content :fullscreen="true" id="note-content" class="note-content">
      <!-- 占位：撑开与 custom-header 等高的空间，避免内容被 fixed header 遮挡 -->
      <div class="header-placeholder"></div>

      <!-- 笔记列表 -->
      <div class="note-list">
        <!-- 加载中：骨架屏 -->
        <template v-if="noteStore.loadingNotes">
          <div v-for="i in 6" :key="`sk-${i}`" class="note-card skeleton-card">
            <ion-skeleton-text :animated="true" class="sk-title" />
            <ion-skeleton-text :animated="true" class="sk-desc" />
            <ion-skeleton-text :animated="true" class="sk-desc short" />
          </div>
        </template>

        <!-- 笔记列表 -->
        <template v-else-if="noteStore.currentNotes.length > 0">
          <div
            v-for="note in noteStore.currentNotes"
            :key="note.id"
            class="note-card"
          >
            <div class="card-title">{{ note.title || t("note.untitled") }}</div>
            <div class="card-desc">{{ summarize(note.content) }}</div>
            <div class="card-time">{{ formatTime(note.updated_at) }}</div>
          </div>
        </template>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <ion-icon :icon="documentsOutline" class="empty-icon" />
          <p class="empty-text">{{ t("note.empty") }}</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  IonPage,
  IonIcon,
  IonContent,
  IonSearchbar,
  IonSkeletonText,
  IonMenu,
  menuController,
  popoverController,
} from "@ionic/vue";
import {
  menuOutline,
  cogOutline,
  documentsOutline,
} from "ionicons/icons";
import { useUserStore } from "@/stores/user";
import { useNoteStore } from "@/stores/note";
import SidebarMenu from "@/components/note/SidebarMenu.vue";
import LogoutMenu from "@/components/LogoutMenu.vue";

const router = useRouter();
const { t } = useI18n();
const userStore = useUserStore();
const noteStore = useNoteStore();

// 搜索关键字（搜索功能后续接入）
const keyword = ref("");

// 首屏加载笔记本树
onMounted(() => {
  void noteStore.loadNotebookTree();
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

/** 打开侧边栏 */
const openMenu = () => {
  void menuController.open("note-menu");
};

/** 选中分类后：关闭侧边栏 */
const onCategorySelected = () => {
  void menuController.close("note-menu");
};

/** 设置按钮 → Popover 退出菜单 */
const showSettingMenu = async (ev: Event) => {
  const popover = await popoverController.create({
    component: LogoutMenu,
    event: ev,
    translucent: true,
    showBackdrop: false,
    alignment: "end",
  });
  await popover.present();
  const { data } = await popover.onDidDismiss();
  if (data?.action === "logout") {
    await onLogout();
  }
};

/** 退出登录：调后端撤销 session + 清本地数据 + 跳登录页 */
const onLogout = async () => {
  await userStore.logout();
  router.replace("/login");
};

/** 提取笔记内容摘要（去 markdown 标记，取前两行） */
const summarize = (content: string): string => {
  if (!content) return "";
  // 去除常见 markdown 标记
  const plain = content
    .replace(/^#+\s*/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .trim();
  // 取前两行非空
  const lines = plain.split("\n").filter((l) => l.trim());
  return lines.slice(0, 2).join(" ").slice(0, 80);
};

/** 格式化更新时间（后端返回 ISO 字符串如 2025-09-09T19:42:22.000Z） */
const formatTime = (ts: number | string): string => {
  if (!ts) return "";
  // JS 原生 Date 可直接解析 ISO 字符串和时间戳
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  // 格式化：YYYY-MM-DD HH:mm
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
};
</script>

<style scoped>
/* 侧边栏滚动容器：普通 div 自滚动，避开 Ionic 滚动锁机制 */
.menu-scroll {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
  background: var(--z-bg-page);
}

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
  padding-top: env(safe-area-inset-top);
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
  padding: var(--z-space-sm) var(--z-space-md) var(--z-space-sm);
}

.note-searchbar {
  --background: var(--z-bg-surface);
  --border-radius: var(--z-radius-md);
  --box-shadow: none;
  padding: 0;
}

/* 占位：撑开与 custom-header 等高的空间，避免内容被 fixed header 遮挡 */
.header-placeholder {
  /* 标题行 48px + 搜索框区约 56px + 安全区顶部 */
  height: calc(48px + 56px + env(safe-area-inset-top));
}

/* 笔记列表 */
.note-list {
  padding: 0 var(--z-space-md) var(--z-space-md);
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
</style>
