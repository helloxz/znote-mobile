import req from "@/utils/req";
import type { ApiResponse } from "@/api/user";
import type { Notebook, NotebookNode, Note } from "@/types/note";

/**
 * 获取笔记本分类树（后端已组装成树形）
 * 路由：GET /api/user/notebook/list（userRouter，需 Bearer token）
 * 返回 data 为 NotebookNode[] 递归数组
 */
export function fetchNotebookList() {
    return req.get<ApiResponse<NotebookNode[]>>("/api/user/notebook/list");
}

/**
 * 获取分类直属笔记列表（不含子分类笔记）
 * 路由：GET /api/user/notebook/note/list?notebook_id=<categoryId>
 */
export function fetchNoteList(categoryId: number) {
    return req.get<ApiResponse<Note[]>>("/api/user/notebook/note/list", {
        params: { notebook_id: categoryId },
    });
}

/** 更新笔记本/分类的入参（部分字段） */
export interface UpdateNotebookPayload {
    title?: string;
    description?: string;
    parent_id?: number | null;
}

/**
 * 更新笔记本/分类（重命名等）
 * 路由：POST /api/user/notebook/update，body：{ id, ...payload }
 * 返回更新后的 Notebook（扁平结构，无 children）
 */
export function updateNotebook(id: number, payload: UpdateNotebookPayload) {
    return req.post<ApiResponse<Notebook>>("/api/user/notebook/update", {
        id,
        ...payload,
    });
}

/** 删除结果统计 */
export interface DeleteNotebooksResult {
    deleted_notebooks: number;
    deleted_notes: number;
}

/**
 * 删除笔记本/分类（级联：子孙硬删，其下笔记软删进回收站）
 * 路由：POST /api/user/notebook/delete，body：{ ids: number[] }
 */
export function deleteNotebooks(ids: number[]) {
    return req.post<ApiResponse<DeleteNotebooksResult>>(
        "/api/user/notebook/delete",
        { ids }
    );
}

/** 笔记排序项 */
export interface SortNoteItem {
    id: number;
    sort_order: number;
}

/**
 * 笔记排序（同分类内拖拽排序）
 * 路由：POST /api/user/notebook/note/sort，body：{ items: [{id, sort_order}] }
 * sort_order 取新顺序的数组下标，发全量。返回该分类排序后的完整笔记列表
 */
export function sortNotes(items: SortNoteItem[]) {
    return req.post<ApiResponse<Note[]>>("/api/user/notebook/note/sort", {
        items,
    });
}

/** 更新笔记的入参（部分字段，用于置顶等） */
export interface UpdateNotePayload {
    title?: string;
    content?: string;
    is_pinned?: number;
    notebook_id?: number;
}

/**
 * 更新笔记（置顶/取消置顶、移动等）
 * 路由：POST /api/user/notebook/note/update，body：{ id, ...payload }
 * 返回更新后的 Note
 */
export function updateNote(id: number, payload: UpdateNotePayload) {
    return req.post<ApiResponse<Note>>("/api/user/notebook/note/update", {
        id,
        ...payload,
    });
}

/**
 * 移入回收站（软删除：is_deleted=1, deleted_at=now）
 * 路由：POST /api/user/notebook/note/delete，body：{ id }
 * 返回软删除后的笔记对象
 */
export function deleteNote(id: number) {
    return req.post<ApiResponse<Note>>("/api/user/notebook/note/delete", {
        id,
    });
}

/**
 * 搜索笔记（跨顶层笔记本下所有子分类，BM25 相关性排序，最多 50 条）
 * 路由：GET /api/user/note/search?notebook_id=<顶层笔记本>&keyword=<关键词>
 * 关键词需 ≥ 3 字符（trigram 分词器硬性要求）
 */
export function searchNotes(notebookId: number, keyword: string) {
    return req.get<ApiResponse<Note[]>>("/api/user/note/search", {
        params: { notebook_id: notebookId, keyword },
    });
}

