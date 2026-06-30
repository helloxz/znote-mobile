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

