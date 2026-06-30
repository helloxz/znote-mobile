import req from "@/utils/req";
import type { ShareItem } from "@/types/note";

interface ApiResponse<T> {
    code: number;
    msg: string;
    data: T;
}

/**
 * 获取当前用户的所有分享列表
 * GET /api/user/note/share/list
 */
export async function fetchMyShares(): Promise<ShareItem[]> {
    const res = await req.get<ApiResponse<ShareItem[]>>("/api/user/note/share/list");
    if (res.data?.code === 200) return res.data.data ?? [];
    return [];
}

/**
 * 创建分享
 * POST /api/user/note/share/create
 * @param noteId 笔记 ID
 * @param options 可选参数：password（分享密码）、expires_at（过期时间戳，毫秒）
 * @returns 创建成功返回 ShareItem，失败返回 null
 */
export async function createShare(
    noteId: number,
    options?: { password?: string; expires_at?: number }
): Promise<ShareItem | null> {
    const res = await req.post<ApiResponse<ShareItem>>("/api/user/note/share/create", {
        note_id: noteId,
        password: options?.password || undefined,
        expires_at: options?.expires_at || undefined,
    });
    if (res.data?.code === 200) return res.data.data;
    return null;
}

/**
 * 删除分享
 * POST /api/user/note/share/delete
 * @param id 分享记录 ID
 */
export async function deleteShare(id: number): Promise<boolean> {
    const res = await req.post("/api/user/note/share/delete", { id });
    return res.data?.code === 200;
}