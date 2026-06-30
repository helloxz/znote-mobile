<template>
  <div class="sidebar">
    <!-- 上段：当前笔记本 + 切换按钮 -->
    <div class="section notebook-section">
      <div class="notebook-bar" @click="showSwitcher">
        <ion-icon :icon="bookOutline" class="nb-icon" />
        <span class="nb-title">{{ currentNotebookTitle }}</span>
        <ion-icon :icon="chevronDown" class="switch-icon" />
      </div>
    </div>

    <!-- 下段：当前笔记本的分类树 -->
    <div class="section section-categories">
      <div class="section-header">{{ t("note.categories") }}</div>
      <div class="category-tree">
        <CategoryTreeNode
          v-for="node in noteStore.currentCategoryTree"
          :key="node.id"
          :node="node"
          :active-category-id="noteStore.activeCategoryId"
          :level="0"
          @select="onSelectCategory"
        />
        <div
          v-if="noteStore.currentCategoryTree.length === 0 && !noteStore.loadingTree"
          class="empty-hint"
        >
          {{ t("note.empty") }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide, watch, computed } from "vue";
import { IonIcon, popoverController } from "@ionic/vue";
import { bookOutline, chevronDown } from "ionicons/icons";
import { useI18n } from "vue-i18n";
import { useNoteStore } from "@/stores/note";
import CategoryTreeNode from "@/components/note/CategoryTreeNode.vue";
import NotebookSwitcher from "@/components/note/NotebookSwitcher.vue";

const { t } = useI18n();
const noteStore = useNoteStore();

// 展开状态：节点 id 集合（组件本地管理，切换笔记本时重置）
const expandedIds = ref<Set<number>>(new Set());

/** 当前笔记本名 */
const currentNotebookTitle = computed(() => {
  return noteStore.activeNotebook?.title || t("note.notebooks");
});

/**
 * 切换展开/折叠
 * 顶级节点（level===0）互斥：展开新顶级节点时自动折叠其他顶级节点
 * 子级节点（level>0）自由切换，互不影响
 */
const toggleExpand = (id: number, level: number) => {
  const next = new Set(expandedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    // 顶级节点互斥：清掉其他顶级节点的展开态
    if (level === 0) {
      for (const topNode of noteStore.currentCategoryTree) {
        next.delete(topNode.id);
      }
    }
    next.add(id);
  }
  expandedIds.value = next;
};

// provide 给递归子组件 CategoryTreeNode 使用
provide("expandedIds", expandedIds);
provide("toggleExpand", toggleExpand);

// 切换笔记本时清空展开状态（分类树重新加载）
watch(
  () => noteStore.activeNotebookId,
  () => {
    expandedIds.value = new Set();
  }
);

/** 弹出笔记本切换 Popover */
const showSwitcher = async (ev: Event) => {
  const popover = await popoverController.create({
    component: NotebookSwitcher,
    event: ev,
    translucent: true,
    showBackdrop: true,
    alignment: "start",
  });
  await popover.present();
  const { data } = await popover.onDidDismiss();
  if (data?.notebookId !== undefined) {
    await onSwitchNotebook(data.notebookId);
  }
};

/** 切换笔记本 */
const onSwitchNotebook = (id: number) => {
  void noteStore.switchNotebook(id);
};

/** 选中分类：触发 store 选中 + 通知父组件关闭菜单 */
const emit = defineEmits<{ (e: "select"): void }>();
const onSelectCategory = (id: number) => {
  void noteStore.selectCategory(id);
  emit("select");
};
</script>

<style scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--z-bg-page);
  padding-top: env(safe-area-inset-top);
}

.section {
  padding: var(--z-space-sm) var(--z-space-sm);
}

.section-categories {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.section-header {
  font-size: var(--z-fs-caption);
  font-weight: 600;
  color: var(--z-text-tertiary);
  padding: var(--z-space-sm) var(--z-space-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 笔记本切换条 */
.notebook-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 var(--z-space-sm);
  border-radius: var(--z-radius-sm);
  cursor: pointer;
  color: var(--z-text-primary);
  transition: background-color 0.15s;
}

.notebook-bar:active {
  background: var(--z-bg-surface);
}

.nb-icon {
  font-size: 18px;
  color: var(--z-primary);
}

.nb-title {
  flex: 1;
  font-size: var(--z-fs-body-lg);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.switch-icon {
  font-size: 16px;
  color: var(--z-text-tertiary);
}

/* 分类树 */
.category-tree {
  display: flex;
  flex-direction: column;
}

.empty-hint {
  padding: var(--z-space-md) var(--z-space-sm);
  font-size: var(--z-fs-caption);
  color: var(--z-text-tertiary);
  text-align: center;
}
</style>
