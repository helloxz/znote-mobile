import req from "@/utils/req";

/** 登录请求参数 */
export interface LoginParams {
    username: string;
    password: string;
}

/** 登录成功返回的用户数据 */
export interface LoginResult {
    id: number;
    username: string;
    email: string;
    role: "admin" | "user";
    token: string;
    redirect: string;
}

/** 后端统一响应格式 */
export interface ApiResponse<T = unknown> {
    code: number;
    msg: string;
    data: T;
}

/**
 * 调用后端登录接口
 * 路由：POST /api/login（publicRouter，无需认证）
 */
export function login(params: LoginParams) {
    return req.post<ApiResponse<LoginResult>>("/api/login", {
        username: params.username,
        password: params.password,
    });
}

/**
 * 调用后端登出接口
 * 路由：POST /api/user/logout（userRouter，需 Bearer token）
 * 无需 body，token 由请求拦截器自动注入 Authorization 头
 */
export function logout() {
    return req.post<ApiResponse<null>>("/api/user/logout");
}

/** 修改密码请求参数 */
export interface ChangePasswordParams {
    old_password: string;
    new_password: string;
    repeat_password: string;
}

/**
 * 调用后端修改密码接口
 * 路由：POST /api/user/change_password（userRouter，需 Bearer token）
 * 成功后后端会撤销该用户所有 session（含当前 token），前端需清登录态跳登录页
 */
export function changePassword(params: ChangePasswordParams) {
    return req.post<ApiResponse<null>>("/api/user/change_password", {
        old_password: params.old_password,
        new_password: params.new_password,
        repeat_password: params.repeat_password,
    });
}
