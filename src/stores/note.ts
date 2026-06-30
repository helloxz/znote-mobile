import { defineStore } from "pinia";
import { fetchNotebookList, fetchNoteList } from "@/api/notebook";
import {
    getActiveNotebookId,
    setActiveNotebookId,
} from "@/services/storage";
import type { NotebookNode, Note } from "@/types/note";

/** 后端统一响应格式 */
interface ApiResponse<T> {
    code: number;
    msg: string;
    data: T;
}

/** 递归查找树中指定 id 的节点（任意层级） */
function findNodeById(
    tree: NotebookNode[],
    id: number
): NotebookNode | null {
    for (const node of tree) {
        if (node.id === id) return node;
        if (node.children?.length) {
            const found = findNodeById(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

export const useNoteStore = defineStore("note", {
    state: () => ({
        // 笔记本分类树（后端返回的完整树形结构，单一数据源）
        notebookTree: [] as NotebookNode[],
        // 当前选中的顶层笔记本 id（持久化到 preferences）
        activeNotebookId: getActiveNotebookId() as number | null,
        // 当前选中的分类 id（任意层级，内存，会话级）
        activeCategoryId: null as number | null,
        // 分类 id → 该分类直属笔记列表（按需懒加载缓存）
        notesByCategory: {} as Record<number, Note[]>,
        // 已加载笔记的分类 id 集合（避免重复请求）
        loadedCategoryIds: new Set<number>(),
        // 加载状态
        loadingTree: false,
        loadingNotes: false,
    }),

    getters: {
        /** 当前选中的顶层笔记本节点 */
        activeNotebook: (state): NotebookNode | null => {
            if (state.activeNotebookId === null) return null;
            return (
                state.notebookTree.find((n) => n.id === state.activeNotebookId) ||
                null
            );
        },
        /** 当前笔记本下的分类树（二级及以下） */
        currentCategoryTree: (state): NotebookNode[] => {
            if (state.activeNotebookId === null) return [];
            const nb = state.notebookTree.find(
                (n) => n.id === state.activeNotebookId
            );
            return nb?.children ?? [];
        },
        /** 当前分类下的笔记列表 */
        currentNotes: (state): Note[] => {
            if (state.activeCategoryId === null) return [];
            return state.notesByCategory[state.activeCategoryId] ?? [];
        },
    },

    actions: {
        /**
         * 首屏加载：拉笔记本树 → 恢复/默认选中笔记本 → 恢复/默认选中分类 → 加载笔记
         */
        async loadNotebookTree(): Promise<void> {
            this.loadingTree = true;
            try {
                const res = await fetchNotebookList();
                const body = res.data as ApiResponse<NotebookNode[]>;
                if (body.code !== 200) return;

                this.notebookTree = body.data || [];
                if (this.notebookTree.length === 0) return;

                // 校验持久化的笔记本 id 是否仍存在，不存在则默认选第一个
                let nbId = this.activeNotebookId;
                if (
                    nbId === null ||
                    !this.notebookTree.some((n) => n.id === nbId)
                ) {
                    nbId = this.notebookTree[0].id;
                    this.activeNotebookId = nbId;
                    await setActiveNotebookId(nbId);
                }

                // 默认选中该笔记本下第一个分类
                const notebook = this.notebookTree.find(
                    (n) => n.id === nbId
                );
                const firstCategory = notebook?.children?.[0];
                if (firstCategory) {
                    await this.selectCategory(firstCategory.id);
                } else {
                    // 笔记本下无分类：清空选中
                    this.activeCategoryId = null;
                }
            } finally {
                this.loadingTree = false;
            }
        },

        /**
         * 切换顶层笔记本：持久化 + 自动选第一个分类 + 加载笔记
         */
        async switchNotebook(id: number): Promise<void> {
            this.activeNotebookId = id;
            await setActiveNotebookId(id);

            // 选中该笔记本下第一个分类
            const notebook = this.notebookTree.find((n) => n.id === id);
            const firstCategory = notebook?.children?.[0];
            if (firstCategory) {
                await this.selectCategory(firstCategory.id);
            } else {
                this.activeCategoryId = null;
            }
        },

        /**
         * 选中分类：设 activeCategoryId + 按需加载该分类直属笔记
         */
        async selectCategory(id: number | null): Promise<void> {
            this.activeCategoryId = id;
            if (id !== null && !this.loadedCategoryIds.has(id)) {
                await this.loadCategoryNotes(id);
            }
        },

        /**
         * 加载指定分类的笔记列表并缓存
         */
        async loadCategoryNotes(categoryId: number): Promise<void> {
            this.loadingNotes = true;
            try {
                const res = await fetchNoteList(categoryId);
                const body = res.data as ApiResponse<Note[]>;
                if (body.code === 200) {
                    this.notesByCategory = {
                        ...this.notesByCategory,
                        [categoryId]: body.data || [],
                    };
                    this.loadedCategoryIds.add(categoryId);
                }
            } finally {
                this.loadingNotes = false;
            }
        },
    },
});
