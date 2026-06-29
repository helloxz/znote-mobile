import axios, { AxiosError } from "axios";
import { getToken, getServerUrl } from "@/services/storage";

/**
 * axios 实例
 *
 * 与 web 端的核心差异：不设固定 baseURL，而是从内存缓存动态读取服务器地址。
 * 原因：移动端 APP 无同源概念，服务器地址由用户登录时输入并保存。
 * 登录前需先 setServerUrl()，之后所有请求（含登录请求本身）共用此实例。
 */
const req = axios.create({
    timeout: 120000,
});

// 请求拦截器：动态注入 baseURL + Bearer Token
req.interceptors.request.use((config) => {
    // 从内存同步读取服务器地址（拦截器同步执行，不能 await）
    const serverUrl = getServerUrl();
    if (serverUrl) {
        // 拼接 baseURL，避免双斜杠（serverUrl 已保证末尾无 /）
        config.baseURL = serverUrl;
    }

    // 注入 Bearer Token
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 响应拦截器：统一捕获网络层异常，转成与后端一致的 { code, msg, data } 结构
// 业务码（code: 200 / -1000）仍由各调用方判断
req.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        // 网络层错误统一转成后端响应格式，便于前端按 msg 翻译
        let msg = "network.error";
        if (error.code === "ECONNABORTED") {
            msg = "network.timeout";
        } else if (!error.response) {
            // 无 response：断网 / DNS 失败 / 服务器地址不可达
            msg = "network.disconnected";
        }
        return Promise.reject({
            code: -1000,
            msg,
            data: null,
        });
    }
);

export default req;
