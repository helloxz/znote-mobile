import { defineStore } from "pinia";
import {
    fetchNotebookList,
    fetchNoteList,
    createNote,
    updateNotebook,
    deleteNotebooks,
    sortNotes,
    updateNote,
    deleteNote,
    searchNotes,
    type UpdateNotebookPayload,
    type SortNoteItem,
    type UpdateNotePayload,
} from "@/api/notebook";
import {
    getActiveNotebookId,
    setActiveNotebookId,
    getActiveCategoryId,
    setActiveCategoryId,
} from "@/services/storage";
import type { Notebook, NotebookNode, Note } from "@/types/note";

/** 后端统一响应格式 */
interface ApiResponse<T> {
    code: number;
    msg: string;
    data: T;
}

/**
 * 递归工具：就地更新树中指定 id 的节点字段（保留 children 结构，不可变更新）
 * 参考 web 端 stores/note.ts 的 updateNodeInTree
 */
function updateNodeInTree(
    tree: NotebookNode[],
    id: number,
    updated: Notebook
): NotebookNode[] {
    return tree.map((node) => {
        if (node.id === id) {
            // 合并更新字段，保留原 children（后端返回的是扁平结构无 children）
            return { ...node, ...updated, children: node.children };
        }
        if (node.children?.length) {
            return {
                ...node,
                children: updateNodeInTree(node.children, id, updated),
            };
        }
        return node;
    });
}

/**
 * 递归工具：从树中移除所有在 idSet 中的节点（含子孙自动随父移除）
 */
function removeNodeFromTree(
    tree: NotebookNode[],
    idSet: Set<number>
): NotebookNode[] {
    return tree
        .filter((node) => !idSet.has(node.id))
        .map((node) => ({
            ...node,
            children: node.children?.length
                ? removeNodeFromTree(node.children, idSet)
                : [],
        }));
}

/**
 * 递归工具：从树中收集 ids 及其所有子孙 id（BFS 逐层按 parent_id 查找）
 * 参考 web 端 stores/note.ts 的 collectDescendantIdsFromTree
 */
function collectDescendantIdsFromTree(
    tree: NotebookNode[],
    ids: Set<number>
): Set<number> {
    const allIds = new Set<number>(ids);
    let currentIds = [...ids];
    while (currentIds.length > 0) {
        const nextLevel: number[] = [];
        for (const node of tree) {
            // 深度优先在整棵树中找 parent_id 命中 currentIds 的节点
            const stack = [...tree];
            while (stack.length) {
                const n = stack.pop()!;
                if (n.children?.length) {
                    for (const child of n.children) {
                        if (
                            currentIds.includes(child.parent_id ?? -1) &&
                            !allIds.has(child.id)
                        ) {
                            allIds.add(child.id);
                            nextLevel.push(child.id);
                        }
                        stack.push(child);
                    }
                }
            }
        }
        currentIds = nextLevel;
    }
    return allIds;
}

/**
 * 笔记列表排序工具：与后端 listNotes 口径一致
 * is_pinned DESC → sort_order ASC → created_at DESC
 * 用于 updateNote 后前端重排，保证置顶项上浮
 */
function sortNotesList(list: Note[]): Note[] {
    return [...list].sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return b.is_pinned - a.is_pinned;
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    });
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
        // 当前选中的分类 id（任意层级，持久化到 preferences，跨会话保留）
        activeCategoryId: getActiveCategoryId() as number | null,
        // 分类 id → 该分类直属笔记列表（按需懒加载缓存）
        notesByCategory: {} as Record<number, Note[]>,
        // 已加载笔记的分类 id 集合（避免重复请求）
        loadedCategoryIds: new Set<number>(),
        // 加载状态
        loadingTree: false,
        loadingNotes: false,
        // 搜索态
        searchMode: false, // 是否处于搜索态（列表显示搜索结果而非分类笔记）
        searchKeyword: "", // 当前搜索关键词
        searchResults: [] as Note[], // 搜索结果（跨子分类，BM25 相关性排序）
        loadingSearch: false, // 搜索加载中
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
        /** 当前列表笔记：搜索态返回搜索结果，否则返回当前分类笔记 */
        currentNotes: (state): Note[] => {
            // 搜索态：直接返回搜索结果（已按 BM25 排序，不重新排序）
            if (state.searchMode) return state.searchResults;
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

                // 尝试恢复持久化的分类 id（校验是否仍存在于当前笔记本的分类树中）
                const notebook = this.notebookTree.find(
                    (n) => n.id === nbId
                );
                const persistedCatId = this.activeCategoryId;
                if (
                    persistedCatId !== null &&
                    notebook &&
                    findNodeById(notebook.children ?? [], persistedCatId)
                ) {
                    // 持久化的分类仍存在，恢复选中
                    await this.selectCategory(persistedCatId);
                } else {
                    // 持久化分类不存在，回退到第一个分类
                    const firstCategory = notebook?.children?.[0];
                    if (firstCategory) {
                        await this.selectCategory(firstCategory.id);
                    } else {
                        this.activeCategoryId = null;
                    }
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

            // 切笔记本时清搜索态（搜索结果属于旧笔记本，已失效）
            this.clearSearch();

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
         * 选中分类：设 activeCategoryId + 持久化 + 按需加载该分类直属笔记
         */
        async selectCategory(id: number | null): Promise<void> {
            this.activeCategoryId = id;
            if (id !== null) {
                await setActiveCategoryId(id);
                if (!this.loadedCategoryIds.has(id)) {
                    await this.loadCategoryNotes(id);
                }
            }
        },

        /**
         * 加载指定分类的笔记列表并缓存
         * @param categoryId 分类 id
         * @param force 是否强制刷新（忽略缓存）
         */
        async loadCategoryNotes(categoryId: number, force: boolean = false): Promise<void> {
            // 强制刷新时清除该分类的缓存标记
            if (force) {
                this.loadedCategoryIds.delete(categoryId);
            }
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

        /**
         * 创建笔记
         * 调 API → 成功后插入对应分类缓存头部
         * @returns 创建后的笔记对象，失败返回 null
         */
        async createNote(payload: {
            notebook_id: number;
            title: string;
            content?: string;
        }): Promise<Note | null> {
            try {
                const res = await createNote(payload);
                const body = res.data as ApiResponse<Note>;
                if (body.code === 200 && body.data) {
                    const note = body.data;
                    // 将新笔记插入对应分类缓存头部
                    const existing =
                        this.notesByCategory[note.notebook_id] ?? [];
                    this.notesByCategory = {
                        ...this.notesByCategory,
                        [note.notebook_id]: [note, ...existing],
                    };
                    this.loadedCategoryIds.add(note.notebook_id);
                    return note;
                }
                return null;
            } catch {
                return null;
            }
        },

        /**
         * 更新笔记本/分类（重命名等）
         * 成功后就地递归更新树节点，保留 children 结构，不重载整棵树
         * @returns 是否成功
         */
        async updateNotebook(
            id: number,
            payload: UpdateNotebookPayload
        ): Promise<boolean> {
            this.loadingTree = true;
            try {
                const res = await updateNotebook(id, payload);
                const body = res.data as ApiResponse<Notebook>;
                if (body.code === 200 && body.data) {
                    this.notebookTree = updateNodeInTree(
                        this.notebookTree,
                        id,
                        body.data
                    );
                    return true;
                }
                return false;
            } finally {
                this.loadingTree = false;
            }
        },

        /**
         * 删除笔记本/分类（级联：子孙硬删，笔记软删进回收站）
         * 删前递归收集受影响 id → 调 API → 从树移除 → 切换选中态 → 清缓存
         * @returns 是否成功
         */
        async deleteNotebooks(ids: number[]): Promise<boolean> {
            // ① 删前递归收集所有受影响 id（含子孙）
            const allIds = collectDescendantIdsFromTree(
                this.notebookTree,
                new Set(ids)
            );

            try {
                const res = await deleteNotebooks(ids);
                const body = res.data as ApiResponse<unknown>;
                if (body.code !== 200) return false;

                // ② 从树中移除所有受影响节点
                this.notebookTree = removeNodeFromTree(this.notebookTree, allIds);

                // ③ 删的是当前选中分类：清空 category/note 选中（回空态，不自动选兄弟，对齐 web 端）
                if (
                    this.activeCategoryId !== null &&
                    allIds.has(this.activeCategoryId)
                ) {
                    this.activeCategoryId = null;
                }

                // ④ 删的是当前顶层笔记本：自动切第一个；无剩余则清空
                if (
                    this.activeNotebookId !== null &&
                    allIds.has(this.activeNotebookId)
                ) {
                    const next = this.notebookTree[0];
                    if (next) {
                        await this.switchNotebook(next.id);
                    } else {
                        this.activeNotebookId = null;
                        this.activeCategoryId = null;
                    }
                }

                // ⑤ 清理被删分类的笔记缓存
                for (const cid of allIds) {
                    delete this.notesByCategory[cid];
                    this.loadedCategoryIds.delete(cid);
                }
                return true;
            } catch {
                return false;
            }
        },

        /**
         * 移动分类到新的父节点
         * 调 API → 成功后重载整棵树（移动会导致树结构大范围变化）
         * @param id 要移动的分类 id
         * @param parentId 目标父节点 id，null 表示移动到顶层
         * @returns 是否成功
         */
        async moveCategory(
            id: number,
            parentId: number | null
        ): Promise<boolean> {
            this.loadingTree = true;
            try {
                const res = await updateNotebook(id, {
                    parent_id: parentId,
                });
                const body = res.data as ApiResponse<Notebook>;
                if (body.code === 200) {
                    // 移动分类后重载整棵树（树结构大范围变化，就地更新难以保证一致性）
                    await this.loadNotebookTree();
                    return true;
                }
                return false;
            } finally {
                this.loadingTree = false;
            }
        },

        /**
         * 笔记排序（同分类内拖拽排序）
         * 调 API → 用后端返回的有序列表整体覆盖该分类缓存
         * @returns 是否成功（失败时调用方应回退本地顺序）
         */
        async sortNotes(items: SortNoteItem[]): Promise<boolean> {
            this.loadingTree = true;
            try {
                const res = await sortNotes(items);
                const body = res.data as ApiResponse<Note[]>;
                if (body.code === 200 && body.data) {
                    // 从 result[0].notebook_id 推断分类，整体覆盖缓存
                    const notebookId = body.data[0]?.notebook_id;
                    if (notebookId !== undefined) {
                        this.notesByCategory = {
                            ...this.notesByCategory,
                            [notebookId]: body.data,
                        };
                    }
                    return true;
                }
                return false;
            } finally {
                this.loadingTree = false;
            }
        },

        /**
         * 更新笔记（置顶/取消置顶、移动等）
         * 调 API → 就地更新对应分类缓存中的笔记字段
         * 移动笔记时（notebook_id 变化）：从原分类缓存移除，目标分类标记需重载
         * @returns 是否成功
         */
        async updateNote(
            id: number,
            payload: UpdateNotePayload
        ): Promise<boolean> {
            try {
                const res = await updateNote(id, payload);
                const body = res.data as ApiResponse<Note>;
                if (body.code === 200 && body.data) {
                    const updated = body.data;
                    // 在所有分类缓存中查找该笔记
                    for (const catId of Object.keys(this.notesByCategory)) {
                        const list = this.notesByCategory[Number(catId)];
                        const idx = list.findIndex((n) => n.id === id);
                        if (idx !== -1) {
                            // 笔记被移动到其他分类（notebook_id 变化）：从原分类移除
                            if (
                                payload.notebook_id !== undefined &&
                                payload.notebook_id !== Number(catId)
                            ) {
                                const newList = list.filter(
                                    (n) => n.id !== id
                                );
                                this.notesByCategory = {
                                    ...this.notesByCategory,
                                    [Number(catId)]: newList,
                                };
                                // 清除目标分类的缓存标记，下次选中时会重新加载
                                this.loadedCategoryIds.delete(
                                    payload.notebook_id
                                );
                            } else {
                                // 普通更新（置顶等）：就地替换字段并重排
                                const newList = sortNotesList([
                                    ...list.slice(0, idx),
                                    { ...list[idx], ...updated },
                                    ...list.slice(idx + 1),
                                ]);
                                this.notesByCategory = {
                                    ...this.notesByCategory,
                                    [Number(catId)]: newList,
                                };
                            }
                            break;
                        }
                    }
                    return true;
                }
                return false;
            } catch {
                return false;
            }
        },

        /**
         * 移入回收站（软删除）
         * 调 API → 成功后从对应分类缓存 filter 移除该笔记
         * store 更新后 currentNotes 变化 → NoteView watch 自动同步 localNotes → 列表自动刷新
         * @returns 是否成功
         */
        async deleteNote(id: number): Promise<boolean> {
            try {
                const res = await deleteNote(id);
                const body = res.data as ApiResponse<Note>;
                if (body.code !== 200) return false;

                // 遍历所有分类缓存，移除该笔记
                for (const catId of Object.keys(this.notesByCategory)) {
                    const list = this.notesByCategory[Number(catId)];
                    const idx = list.findIndex((n) => n.id === id);
                    if (idx !== -1) {
                        this.notesByCategory = {
                            ...this.notesByCategory,
                            [Number(catId)]: list.filter((n) => n.id !== id),
                        };
                        break; // 一条笔记只在一个分类里
                    }
                }
                return true;
            } catch {
                return false;
            }
        },

        /**
         * 搜索笔记（跨顶层笔记本下所有子分类，BM25 相关性排序）
         * 设 searchMode=true → 调 API → 存 searchResults
         */
        async searchNotes(keyword: string): Promise<void> {
            if (this.activeNotebookId === null) return;
            this.searchMode = true;
            this.searchKeyword = keyword;
            this.loadingSearch = true;
            try {
                const res = await searchNotes(
                    this.activeNotebookId,
                    keyword
                );
                const body = res.data as ApiResponse<Note[]>;
                if (body.code === 200) {
                    this.searchResults = body.data ?? [];
                } else {
                    this.searchResults = [];
                }
            } catch {
                this.searchResults = [];
            } finally {
                this.loadingSearch = false;
            }
        },

        /**
         * 清除搜索态，恢复原分类列表
         * 不主动重载分类笔记，靠 currentNotes getter 隐式切换回 notesByCategory
         */
        clearSearch(): void {
            this.searchMode = false;
            this.searchKeyword = "";
            this.searchResults = [];
        },
    },
});
