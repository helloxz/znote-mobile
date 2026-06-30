/**
 * 笔记相关类型定义
 * 与后端 backend/db/schema.ts 的 notebooks / notes 表结构对齐
 */

/** 笔记本/分类节点（扁平结构，对应表行） */
export interface Notebook {
    id: number;
    user_id: number;
    parent_id: number | null; // null = 顶层笔记本，非空 = 子分类
    title: string;
    description: string;
    sort_order: number;
    created_at: number | string;
    updated_at: number | string;
}

/** 树形节点：后端 GET /api/user/notebook/list 直接返回此结构的递归数组 */
export interface NotebookNode extends Notebook {
    children: NotebookNode[];
}

/** 笔记 */
export interface Note {
    id: number;
    user_id: number;
    notebook_id: number;
    title: string;
    content: string;
    is_pinned: number; // 0/1
    is_deleted: number; // 0/1
    sort_order: number;
    created_at: number | string;
    updated_at: number | string;
}
