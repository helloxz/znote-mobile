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
          @contextmenu="onContextMenu"
        />
        <div
          v-if="noteStore.currentCategoryTree.length === 0 && !noteStore.loadingTree"
          class="empty-hint"
        >
          {{ t("note.empty") }}
        </div>
      </div>
    </div>

    <!-- 移动分类弹窗 -->
    <MoveCategoryModal
      :show="showMoveModal"
      :source-id="moveSourceId"
      :source-name="moveSourceName"
      :category-tree="noteStore.currentCategoryTree"
      :exclude-node-ids="moveExcludeIds"
      @confirm="onMoveConfirm"
      @cancel="onMoveCancel"
      @update:show="showMoveModal = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, provide, watch, computed } from "vue";
import {
  IonIcon,
  popoverController,
  actionSheetController,
  alertController,
  toastController,
} from "@ionic/vue";
import { bookOutline, chevronDown } from "ionicons/icons";
import { useI18n } from "vue-i18n";
import { useNoteStore } from "@/stores/note";
import type { NotebookNode } from "@/types/note";
import CategoryTreeNode from "@/components/note/CategoryTreeNode.vue";
import NotebookSwitcher from "@/components/note/NotebookSwitcher.vue";
import MoveCategoryModal from "@/components/note/MoveCategoryModal.vue";

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

// ========== 分类长按菜单（编辑/移动/删除） ==========

// 移动分类弹窗状态
const showMoveModal = ref(false);
const moveSourceId = ref(0);
const moveSourceName = ref("");
const moveExcludeIds = ref<number[]>([]);

/**
 * 递归收集节点自身及所有子孙 id（用于移动分类时排除）
 * 防止用户把分类移到自己或自己的子孙下（循环引用）
 */
const collectDescendantIds = (
  nodeId: number,
  tree: NotebookNode[]
): number[] => {
  const ids: number[] = [nodeId];
  const walk = (nodes: NotebookNode[]) => {
    for (const node of nodes) {
      if (node.id === nodeId) {
        // 找到目标节点，收集其所有子孙
        const collectChildren = (n: NotebookNode) => {
          ids.push(n.id);
          if (n.children?.length) {
            n.children.forEach(collectChildren);
          }
        };
        node.children?.forEach(collectChildren);
        return true;
      }
      if (node.children?.length && walk(node.children)) {
        return true;
      }
    }
    return false;
  };
  walk(tree);
  return ids;
};

/** 长按分类触发：弹出底部 Action Sheet */
const onContextMenu = async (node: NotebookNode) => {
  const actionSheet = await actionSheetController.create({
    header: node.title,
    buttons: [
      {
        text: t("note.category.renameText"),
        role: "rename",
      },
      {
        text: t("note.category.moveText"),
        role: "move",
      },
      {
        text: t("note.category.deleteText"),
        role: "delete",
      },
      {
        text: t("note.category.cancel"),
        role: "cancel",
      },
    ],
  });
  await actionSheet.present();
  const { role } = await actionSheet.onDidDismiss();
  if (role === "rename") {
    await showRenameAlert(node);
  } else if (role === "move") {
    // 收集排除节点（自身 + 子孙），打开移动分类弹窗
    moveSourceId.value = node.id;
    moveSourceName.value = node.title;
    moveExcludeIds.value = collectDescendantIds(
      node.id,
      noteStore.currentCategoryTree
    );
    showMoveModal.value = true;
  } else if (role === "delete") {
    await showDeleteConfirmAlert(node);
  }
};

/** 重命名：Alert 输入框 */
const showRenameAlert = async (node: NotebookNode) => {
  const alert = await alertController.create({
    header: t("note.category.rename.title"),
    inputs: [
      {
        name: "title",
        value: node.title,
        placeholder: t("note.category.rename.placeholder"),
      },
    ],
    buttons: [
      { text: t("note.category.cancel"), role: "cancel" },
      {
        text: t("note.dialog.confirm"),
        handler: async (data) => {
          const newTitle = (data?.title || "").trim();
          if (!newTitle || newTitle === node.title) return;
          const ok = await noteStore.updateNotebook(node.id, {
            title: newTitle,
          });
          await showToast(
            ok
              ? t("note.category.rename.success")
              : t("unknown"),
            ok ? "success" : "danger"
          );
        },
      },
    ],
  });
  await alert.present();
};

/** 删除确认：输入分类名才解锁 */
const showDeleteConfirmAlert = async (node: NotebookNode) => {
  const alert = await alertController.create({
    header: t("note.category.delete.title"),
    subHeader: t("note.category.delete.warning", { title: node.title }),
    inputs: [
      {
        name: "confirm",
        placeholder: t("note.category.delete.hint"),
      },
    ],
    buttons: [
      { text: t("note.category.cancel"), role: "cancel" },
      {
        text: t("note.category.delete.confirmText"),
        handler: async (data) => {
          const input = (data?.confirm || "").trim();
          if (input !== node.title) return false; // 输入不匹配，阻止关闭
          const ok = await noteStore.deleteNotebooks([node.id]);
          await showToast(
            ok ? t("note.category.delete.success") : t("unknown"),
            ok ? "success" : "danger"
          );
        },
      },
    ],
  });
  await alert.present();
};

/** 移动分类确认：调用 store 移动 */
const onMoveConfirm = async (parentId: number | null) => {
  showMoveModal.value = false;
  const ok = await noteStore.moveCategory(moveSourceId.value, parentId);
  await showToast(
    ok ? t("note.category.move.success") : t("unknown"),
    ok ? "success" : "danger"
  );
};

/** 移动分类取消 */
const onMoveCancel = () => {
  showMoveModal.value = false;
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
