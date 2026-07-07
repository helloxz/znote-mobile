/**
 * AI 对话接口封装层
 *
 * 与后端 routers.ts 中的 userRouter.ai.* / publicRouter.ai.* 路由一一对应。
 * SSE 流式对话（/api/user/ai/chat）不在本文件封装，由 AIView.vue 内用原生
 * fetch 直接处理（axios 不支持 ReadableStream，无法接收 SSE 流式响应）。
 *
 * 与 web 端 frontend/src/api/ai.ts 的差异：使用移动端动态 baseURL 的 req 实例。
 */
import req from "@/utils/req";
import type { ApiResponse } from "@/api/user";
import type { Notebook } from "@/types/note";

/** 会话线程 */
export interface AIThread {
    id: string;
    resourceId: string;
    createdAt: string;
    updatedAt?: string;
    title?: string;
}

/** 会话消息（Mastra Memory 存储，content 可能是结构化对象） */
export interface AIThreadMessage {
    id: string;
    role: "user" | "assistant";
    content: string | { content?: string; parts?: { type: string; text?: string }[] };
    createdAt: string;
}

/** 会话详情（含消息列表） */
export interface AIThreadDetail {
    thread: AIThread;
    messages: AIThreadMessage[];
}

/**
 * 获取当前用户的 AI 对话会话列表
 * 路由：GET /api/user/ai/threads（userRouter，需 Bearer token）
 */
export async function fetchThreads(): Promise<AIThread[]> {
    const res = await req.get<ApiResponse<AIThread[]>>("/api/user/ai/threads");
    if (res.data?.code === 200) {
        return res.data.data ?? [];
    }
    return [];
}

/**
 * 获取指定会话详情（含消息历史）
 * 路由：GET /api/user/ai/thread/:id（userRouter，需 Bearer token）
 */
export async function fetchThreadDetail(
    threadId: string,
): Promise<AIThreadDetail | null> {
    const res = await req.get<ApiResponse<AIThreadDetail>>(
        `/api/user/ai/thread/${threadId}`,
    );
    if (res.data?.code === 200) {
        return res.data.data;
    }
    return null;
}

/**
 * 删除指定会话
 * 路由：DELETE /api/user/ai/thread/:id（userRouter，需 Bearer token）
 */
export async function deleteThread(threadId: string): Promise<boolean> {
    const res = await req.delete<ApiResponse<null>>(
        `/api/user/ai/thread/${threadId}`,
    );
    return res.data?.code === 200;
}

/**
 * 检查 AI 功能是否已启用（公开接口，无需认证）
 * 路由：GET /api/ai/status（publicRouter）
 * @returns boolean - true 表示已启用；失败时默认 true（静默降级，不阻塞用户使用）
 */
export async function fetchAIStatus(): Promise<boolean> {
    const res = await req.get<ApiResponse<{ enabled: boolean }>>(
        "/api/ai/status",
    );
    if (res.data?.code === 200) {
        return !!res.data.data?.enabled;
    }
    return true;
}

/**
 * 获取当前用户的顶层笔记本列表（用于 AI 笔记本选择器）
 * 路由：GET /api/user/notebook/top（userRouter，需 Bearer token）
 */
export async function fetchTopNotebooks(): Promise<Notebook[]> {
    const res = await req.get<ApiResponse<Notebook[]>>(
        "/api/user/notebook/top",
    );
    if (res.data?.code === 200) {
        return res.data.data ?? [];
    }
    return [];
}
