<template>
  <ion-page>
    <!-- 自定义固定顶部栏（标题 + 搜索框） -->
    <div ref="headerRef" class="custom-header">
      <div class="title-row">
        <span class="title-text">{{ t("shares.title") }}</span>
      </div>
      <div class="search-wrap">
        <ion-searchbar
          v-model="keyword"
          :placeholder="t('shares.search_placeholder')"
          class="share-searchbar"
        />
      </div>
    </div>

    <ion-content
      :fullscreen="true"
      id="share-content"
      class="share-content"
    >
      <!-- 占位：撑开与 custom-header 等高的空间 -->
      <div class="header-placeholder" :style="placeholderStyle"></div>

      <!-- 下拉刷新 -->
      <ion-refresher slot="fixed" @ionRefresh="onRefresh($event)">
        <ion-refresher-content
          pulling-icon="lines"
          refreshing-spinner="crescent"
        />
      </ion-refresher>

      <!-- 分享列表 -->
      <div class="share-list">
        <!-- 加载中：骨架屏 -->
        <template v-if="loading">
          <div v-for="i in 6" :key="`sk-${i}`" class="share-card skeleton-card">
            <ion-skeleton-text :animated="true" class="sk-title" />
            <ion-skeleton-text :animated="true" class="sk-meta" />
          </div>
        </template>

        <!-- 有数据 -->
        <template v-else-if="filteredShares.length > 0">
          <div
            v-for="share in filteredShares"
            :key="share.id"
            class="share-card"
            @touchstart.passive="(e: TouchEvent) => onTouchStart(e, share)"
            @touchmove.passive="onTouchMove"
            @touchend="onTouchEnd"
            @touchcancel="onTouchCancel"
            @contextmenu.prevent="(e: Event) => onContextMenu(e, share)"
          >
            <!-- 笔记标题（点击在浏览器中打开分享页面） -->
            <p
              class="card-title"
              @click.stop="openShareLink(share)"
            >{{ share.note_title }}</p>

            <!-- 底部：状态 + 到期日期 -->
            <div class="card-meta">
              <span
                class="status-badge"
                :class="share.status === 'active' ? 'status-active' : 'status-revoked'"
              >
                {{ share.status === 'active' ? t('shares.status.active') : t('shares.status.revoked') }}
              </span>
              <span class="meta-sep">·</span>
              <span class="card-date">
                <template v-if="share.expires_at">{{ formatDate(share.expires_at) }}</template>
                <template v-else>{{ t('shares.never_expire') }}</template>
              </span>
            </div>
          </div>
        </template>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <ion-icon :icon="shareSocialOutline" class="empty-icon" />
          <p class="empty-text">{{ keyword ? t('shares.no_results') : t('shares.empty') }}</p>
        </div>
      </div>
    </ion-content>

    <!-- 底部操作面板（分享长按菜单） -->
    <ActionSheet
      :show="actionSheet.show.value"
      :header="actionSheet.options.value.header"
      :buttons="actionSheet.options.value.buttons"
      :cancel-text="actionSheet.options.value.cancelText"
      @update:show="actionSheet.onClose"
      @select="actionSheet.onSelect"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import {
  IonPage,
  IonIcon,
  IonContent,
  IonSearchbar,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  onIonViewWillEnter,
  alertController,
} from "@ionic/vue";
import { shareSocialOutline } from "ionicons/icons";
import { getServerUrl } from "@/services/storage";
import { fetchMyShares, deleteShare } from "@/api/share";
import { useShareStore } from "@/stores/share";
import type { ShareItem } from "@/types/note";
import ActionSheet from "@/components/note/ActionSheet.vue";
import { useActionSheet } from "@/composables/useActionSheet";
import { useToast } from "@/composables/useToast";
import { useFixedHeader } from "@/composables/useFixedHeader";

const { t } = useI18n();
const { headerRef, placeholderStyle } = useFixedHeader();
const actionSheet = useActionSheet();
const shareStore = useShareStore();

// 分享列表数据
const shares = ref<ShareItem[]>([]);
const loading = ref(false);

// 搜索关键词
const keyword = ref("");

/** 前端筛选：关键词 ≥ 2 字符时按 note_title 模糊匹配 */
const filteredShares = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (kw.length < 2) return shares.value;
  return shares.value.filter((s) =>
    s.note_title.toLowerCase().includes(kw)
  );
});

/** 格式化日期：YYYY/MM/DD */
const formatDate = (ts: number | string | null): string => {
  if (!ts) return "";
  const ms = typeof ts === "number" && ts < 1e12 ? ts * 1000 : ts;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
};

/** 点击标题：在系统浏览器中打开分享页面 */
const openShareLink = (share: ShareItem) => {
  const serverUrl = getServerUrl();
  const url = `${serverUrl}/s/${share.share_id}`;
  window.open(url, "_system"); // Capacitor 中用 _system 打开系统浏览器
};

/** 加载分享列表 */
const loadShares = async () => {
  loading.value = true;
  try {
    shares.value = await fetchMyShares();
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadShares().catch(() => {});
});

/** Tab 切换时按需刷新：仅在列表被标记为脏时（如刚创建了分享）才重新请求 */
onIonViewWillEnter(() => {
  if (shareStore.consumeDirty()) {
    loadShares();
  }
});

/** 下拉刷新：重新加载分享列表 */
const onRefresh = async (event: Event) => {
  const target = event.target as HTMLIonRefresherElement;
  try {
    await loadShares();
    target.complete();
    await showToast(t("common.refresh.success"), "success");
  } catch {
    // 网络错误由 axios 拦截器统一弹 toast，此处不重复弹
    target.complete();
  }
};

// ========== 长按手势 ==========
// 500ms 长按后设置标记，touchend 时才弹出 actionSheet，
// 避免 touch 序列中途弹 overlay 导致 Ionic 滚动锁残留

let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let longPressTriggered = false;
let startPoint = { x: 0, y: 0 };
let currentShare: ShareItem | null = null;

const onTouchStart = (e: TouchEvent, share: ShareItem) => {
  const touch = e.touches[0];
  startPoint = { x: touch.clientX, y: touch.clientY };
  longPressTriggered = false;
  currentShare = share;
  longPressTimer = setTimeout(() => {
    longPressTriggered = true;
    showActionSheet(currentShare!);
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
const onContextMenu = (_e: Event, share: ShareItem) => {
  showActionSheet(share);
};

/** 弹出底部操作菜单：复制分享链接 / 删除分享 */
const showActionSheet = async (share: ShareItem) => {
  const role = await actionSheet.showActionSheet({
    header: share.note_title,
    buttons: [
      {
        text: t("shares.copy_link"),
        role: "copy",
      },
      {
        text: t("shares.delete"),
        role: "delete",
      },
    ],
  });

  if (role === "copy") {
    await handleCopyLink(share);
  } else if (role === "delete") {
    await handleDelete(share);
  }
};

/** 复制分享链接 + 密码（如有） */
const handleCopyLink = async (share: ShareItem) => {
  const serverUrl = getServerUrl();
  const url = `${serverUrl}/s/${share.share_id}`;
  const lines = [`${t("shares.result.url")}: ${url}`];
  if (share.password) {
    lines.push(`${t("shares.result.password")}: ${share.password}`);
  }
  try {
    await navigator.clipboard.writeText(lines.join("\n"));
    await showToast(t("shares.copy.success"), "success");
  } catch {
    // 兜底：部分环境 clipboard API 不可用
    await showToast(t("shares.copy.success"), "success");
  }
};

/** 删除分享：先弹确认框，确认后调 API 删除 */
const handleDelete = async (share: ShareItem) => {
  const alert = await alertController.create({
    header: t("shares.delete"),
    message: t("shares.delete_confirm"),
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

  if (role === "confirm") {
    const ok = await deleteShare(share.id);
    if (ok) {
      await showToast(t("shares.delete.success"), "success");
      // 从本地列表移除已删除项
      shares.value = shares.value.filter((s) => s.id !== share.id);
    }
  }
};

const { showToast } = useToast();
</script>

<style scoped>
/* 内容区背景 */
.share-content {
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
}

/* 搜索框容器 */
.search-wrap {
  padding: 0 var(--z-space-md) var(--z-space-sm);
}

.share-searchbar {
  --background: var(--z-bg-surface);
  --border-radius: var(--z-radius-md);
  --box-shadow: none;
  padding: 0;
}

/* 占位：撑开与 custom-header 等高的空间 */
.header-placeholder {
  /* 标题行 48px + 搜索框区 + 安全区顶部；测量后会用真实值覆盖 */
  height: calc(48px + 58px + var(--z-safe-area-top));
}

/* 分享列表 */
.share-list {
  padding: 0 var(--z-space-md) var(--z-space-md);
  display: flex;
  flex-direction: column;
  gap: var(--z-space-sm);
}

/* 分享卡片 */
.share-card {
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  touch-action: manipulation;
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
  cursor: pointer;
  transition: color 0.15s;
}

.card-title:active {
  color: var(--z-primary);
}

/* 底部信息行：状态标签 + 日期 */
.card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 状态标签 */
.status-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--z-radius-pill);
  line-height: 1.4;
}

.status-active {
  background: #e8f8ee;
  color: #00b42a;
}

.status-revoked {
  background: var(--z-bg-subtle);
  color: var(--z-text-disabled);
}

.meta-sep {
  color: var(--z-text-disabled);
  font-size: var(--z-fs-caption);
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
