/**
 * 数据存储服务
 * 基于 @capacitor/preferences（原生持久化）+ 内存缓存
 *
 * 关键设计：
 * preferences 是异步 API，但 axios 请求拦截器是同步执行的，
 * 不能在拦截器里 await。所以维护内存缓存：
 * - 启动时 initStorage() 异步预加载到内存
 * - get*() 同步读内存，供拦截器同步调用
 * - set*() 异步写 preferences + 同步更新内存
 */
import { Preferences } from "@capacitor/preferences";

// preferences 存储 key
const KEY_TOKEN = "token";
const KEY_SERVER_URL = "server_url";
const KEY_USER_INFO = "user_info";
const KEY_ACTIVE_NOTEBOOK = "active_notebook_id"; // 选中的笔记本 id（跨会话保留）

// 内存缓存（同步读取，供 axios 拦截器 / store 初始化同步使用）
let tokenCache: string | null = null;
let serverUrlCache: string | null = null;
let userInfoCache: UserInfo | null = null;
let activeNotebookIdCache: number | null = null;

/** 用户信息类型 */
export interface UserInfo {
    id: number;
    username: string;
    email: string;
    role: "admin" | "user";
}

/** 启动时调用：从 preferences 异步预加载到内存 */
export async function initStorage(): Promise<void> {
    const [tokenRes, urlRes, userInfoRes, activeNotebookRes] = await Promise.all([
        Preferences.get({ key: KEY_TOKEN }),
        Preferences.get({ key: KEY_SERVER_URL }),
        Preferences.get({ key: KEY_USER_INFO }),
        Preferences.get({ key: KEY_ACTIVE_NOTEBOOK }),
    ]);
    tokenCache = tokenRes.value;
    serverUrlCache = urlRes.value;
    userInfoCache = userInfoRes.value ? JSON.parse(userInfoRes.value) : null;
    activeNotebookIdCache = activeNotebookRes.value
        ? Number(activeNotebookRes.value)
        : null;
}

// ========== Token ==========
/** 同步读取 token（供 axios 拦截器同步调用） */
export function getToken(): string | null {
    return tokenCache;
}

/** 异步写入 token：写 preferences + 更新内存 */
export async function setToken(token: string): Promise<void> {
    tokenCache = token;
    await Preferences.set({ key: KEY_TOKEN, value: token });
}

/** 同步清空 token */
export function clearToken(): void {
    tokenCache = null;
    void Preferences.remove({ key: KEY_TOKEN });
}

// ========== 服务器地址 ==========
/** 同步读取服务器地址（供 axios 拦截器同步调用） */
export function getServerUrl(): string | null {
    return serverUrlCache;
}

/** 异步写入服务器地址：写 preferences + 更新内存 */
export async function setServerUrl(url: string): Promise<void> {
    serverUrlCache = url;
    await Preferences.set({ key: KEY_SERVER_URL, value: url });
}

// ========== 用户信息 ==========
/** 同步读取用户信息 */
export function getUserInfo(): UserInfo | null {
    return userInfoCache;
}

/** 异步写入用户信息：写 preferences + 更新内存 */
export async function setUserInfo(info: UserInfo): Promise<void> {
    userInfoCache = info;
    await Preferences.set({ key: KEY_USER_INFO, value: JSON.stringify(info) });
}

// ========== 选中笔记本（跨会话保留） ==========
/** 同步读取选中的笔记本 id */
export function getActiveNotebookId(): number | null {
    return activeNotebookIdCache;
}

/** 异步写入选中的笔记本 id：写 preferences + 更新内存 */
export async function setActiveNotebookId(id: number): Promise<void> {
    activeNotebookIdCache = id;
    await Preferences.set({ key: KEY_ACTIVE_NOTEBOOK, value: String(id) });
}

// ========== 统一清理 ==========
/** 清空所有登录相关数据（登出时调用） */
export function clearAll(): void {
    tokenCache = null;
    serverUrlCache = null;
    userInfoCache = null;
    activeNotebookIdCache = null;
    void Preferences.remove({ key: KEY_TOKEN });
    void Preferences.remove({ key: KEY_SERVER_URL });
    void Preferences.remove({ key: KEY_USER_INFO });
    void Preferences.remove({ key: KEY_ACTIVE_NOTEBOOK });
}
