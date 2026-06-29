import { defineStore } from "pinia";
import { login as loginApi, type LoginResult } from "@/api/user";
import {
    getToken,
    setToken,
    clearToken,
    getServerUrl,
    setServerUrl,
    getUserInfo,
    setUserInfo,
    clearAll,
    type UserInfo,
} from "@/services/storage";

/** 服务器地址校验正则：http(s):// 开头，末尾无 / */
const SERVER_URL_REGEX = /^https?:\/\/.+[^/]$/;

/** 后端统一响应格式 */
interface ApiResponse<T> {
    code: number;
    msg: string;
    data: T;
}

/** 登录操作结果：成功返回用户信息，失败返回错误 msg key */
export interface LoginActionResult {
    success: boolean;
    msg: string; // 后端返回的 msg key 或前端自定义网络错误 key，供 i18n 翻译
    data?: LoginResult;
}

export const useUserStore = defineStore("user", {
    state: () => ({
        // 直接从内存缓存初始化（启动时已 initStorage 预加载）
        token: getToken() as string | null,
        serverUrl: getServerUrl() as string | null,
        userInfo: getUserInfo() as UserInfo | null,
    }),

    getters: {
        /** 是否已登录 */
        isLoggedIn: (state) => !!state.token,
    },

    actions: {
        /**
         * 登录
         * @param serverUrl 服务器地址（如 https://www.example.com）
         * @param username 用户名或邮箱
         * @param password 密码
         * @returns 登录结果，msg 用于前端 i18n 翻译展示
         */
        async login(
            serverUrl: string,
            username: string,
            password: string
        ): Promise<LoginActionResult> {
            // 1. 校验服务器地址格式
            if (!SERVER_URL_REGEX.test(serverUrl)) {
                return { success: false, msg: "invalid.server.url" };
            }

            // 2. 先写入服务器地址（供 axios 拦截器拼接 baseURL）
            await setServerUrl(serverUrl);
            this.serverUrl = serverUrl;

            try {
                // 3. 调用登录接口
                const res = await loginApi({ username, password });
                const body = res.data as ApiResponse<LoginResult>;

                if (body.code === 200 && body.data?.token) {
                    // 4. 登录成功：保存 token + userInfo
                    const { token, ...userInfo } = body.data;
                    await setToken(token);
                    await setUserInfo(userInfo);
                    this.token = token;
                    this.userInfo = userInfo;
                    return { success: true, msg: body.msg, data: body.data };
                }
                // 5. 业务失败：返回后端 msg key 供前端翻译
                return { success: false, msg: body.msg };
            } catch (err) {
                // 网络层错误：响应拦截器已转成 { code, msg, data } 结构
                const msg = (err as ApiResponse<unknown>)?.msg || "network.error";
                return { success: false, msg };
            }
        },

        /**
         * 登出：清空所有登录数据
         */
        logout(): void {
            clearAll();
            this.token = null;
            this.serverUrl = null;
            this.userInfo = null;
        },
    },
});
