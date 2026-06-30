export default {
    // 应用名
    app: {
        name: "ZNote",
    },

    // 底部 Tab 标签
    tabs: {
        notes: "Notes",
        search: "Search",
        me: "Me",
    },

    // 占位提示文案
    placeholder: {
        search: "Search feature coming soon",
        me: "Profile coming soon",
    },

    // 笔记页
    note: {
        title: "ZNote",
        searchPlaceholder: "Search notes",
        logout: "Log Out",
        notebooks: "Notebooks",
        switchNotebook: "Switch notebook",
        categories: "Categories",
        empty: "No content yet",
        loading: "Loading...",
        untitled: "Untitled",
    },

    // 登录页
    login: {
        title: "ZNote",
        subtitle: "Sign in to your note account",
        server: "Server URL",
        serverPlaceholder: "https://www.example.com",
        username: "Username / Email",
        usernamePlaceholder: "Enter username or email",
        password: "Password",
        passwordPlaceholder: "Enter password",
        submit: "Sign In",
        logging: "Signing in...",
    },

    // ========== msg key 映射 ==========
    // 后端返回的 msg 直接作为 i18n key（点分段式命名），调用方 t(msg) 即可翻译
    // 命名规则：模块.功能.结果，与后端 routers.ts 返回值对齐

    // 登录相关
    "login.success": "Signed in successfully",
    "invalid.password": "Invalid password format",
    "invalid.username": "Invalid username format",
    "invalid.email": "Invalid email format",
    "invalid.username.or.password": "Incorrect username or password",

    // 前端自定义校验错误
    "invalid.server.url": "Invalid server URL, expected http(s)://domain without trailing slash",
    "invalid.input": "Please fill in all fields",

    // 网络层错误（前端自定义，非后端返回）
    "network.timeout": "Request timed out, please check your network",
    "network.disconnected": "Network failed, please check network or server URL",
    "network.error": "Network error, please try again later",

    // 后端 logout 成功返回的 msg（兜底用，实际不弹 toast）
    success: "Operation successful",

    // 兜底：未知 msg
    unknown: "Operation failed, please try again later",
};
