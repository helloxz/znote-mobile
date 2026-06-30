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
 * 删除分享
 * POST /api/user/note/share/delete
 * @param id 分享记录 ID
 */
export async function deleteShare(id: number): Promise<boolean> {
    const res = await req.post("/api/user/note/share/delete", { id });
    return res.data?.code === 200;
}