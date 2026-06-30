import req from "@/utils/req";
import type { ApiResponse } from "@/api/user";
import type { NotebookNode, Note } from "@/types/note";

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
