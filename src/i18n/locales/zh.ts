export default {
    // 应用名
    app: {
        name: "ZNote",
    },

    // 底部 Tab 标签
    tabs: {
        notes: "笔记",
        search: "搜索",
        me: "我的",
    },

    // 占位提示文案
    placeholder: {
        notes: "笔记功能开发中",
        search: "搜索功能开发中",
        me: "个人中心开发中",
    },

    // 登录页
    login: {
        title: "ZNote",
        subtitle: "登录你的笔记账号",
        server: "服务器地址",
        serverPlaceholder: "https://www.example.com",
        username: "用户名 / 邮箱",
        usernamePlaceholder: "输入用户名或邮箱",
        password: "密码",
        passwordPlaceholder: "输入密码",
        submit: "登录",
        logging: "登录中...",
    },

    // ========== msg key 映射 ==========
    // 后端返回的 msg 直接作为 i18n key（点分段式命名），调用方 t(msg) 即可翻译
    // 命名规则：模块.功能.结果，与后端 routers.ts 返回值对齐

    // 登录相关
    "login.success": "登录成功",
    "invalid.password": "密码格式无效",
    "invalid.username": "用户名格式无效",
    "invalid.email": "邮箱格式无效",
    "invalid.username.or.password": "用户名或密码错误",

    // 前端自定义校验错误
    "invalid.server.url": "服务器地址格式错误，应为 http(s)://域名 且末尾无斜杠",
    "invalid.input": "请填写完整信息",

    // 网络层错误（前端自定义，非后端返回）
    "network.timeout": "请求超时，请检查网络",
    "network.disconnected": "网络连接失败，请检查网络或服务器地址",
    "network.error": "网络异常，请稍后重试",

    // 兜底：未知 msg
    unknown: "操作失败，请稍后重试",
};
