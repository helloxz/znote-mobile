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
        search: "搜索功能开发中",
        me: "个人中心开发中",
    },

    // 笔记页
    note: {
        title: "ZNote",
        searchPlaceholder: "搜索笔记",
        notebooks: "笔记本",
        switchNotebook: "切换笔记本",
        categories: "分类",
        empty: "暂无内容",
        loading: "加载中...",
        untitled: "无标题",
        // 笔记列表操作菜单
        list: {
            pin: "置顶",
            unpin: "取消置顶",
            share: "创建分享",
            move: "移动笔记",
            trash: "移入回收站",
            cancel: "取消",
            "pin.success": "已置顶",
            "unpin.success": "已取消置顶",
            "sort.success": "排序成功",
            "sort.failed": "排序失败，请重试",
            feature: {
                comingSoon: "功能开发中",
            },
        },
        // 设置菜单项
        menu: {
            changePassword: "修改密码",
            logout: "退出登录",
        },
        // 修改密码页
        password: {
            title: "修改密码",
            old: "旧密码",
            new: "新密码",
            repeat: "确认新密码",
            placeholder: {
                old: "输入旧密码",
                new: "输入新密码",
                repeat: "再次输入新密码",
            },
            submit: "确认修改",
            success: "密码修改成功",
            fieldsRequired: "请填写所有密码字段",
            notMatch: "两次输入的新密码不一致",
            logoutCountdown: "密码修改成功，{seconds} 秒后自动退出登录",
        },
        // 分类操作菜单
        category: {
            renameText: "重命名",
            deleteText: "删除分类",
            cancel: "取消",
            rename: {
                title: "重命名分类",
                placeholder: "请输入新名称",
                success: "重命名成功",
            },
            delete: {
                title: "删除分类",
                warning: "「{title}」删除后不可恢复，其下笔记将放入回收站",
                hint: "请输入分类名称确认",
                confirmText: "确认删除",
                success: "删除成功",
            },
        },
        // 通用对话框按钮
        dialog: {
            confirm: "确定",
        },
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
    "invalid.password": "密码格式无效，请输入 6-18 位密码，支持字母、数字或特殊字符",
    "invalid.username": "用户名格式无效",
    "invalid.email": "邮箱格式无效",
    "invalid.username.or.password": "用户名或密码错误",

    // 修改密码相关（后端返回的 msg）
    "user.old_password.invalid": "旧密码错误",
    "user.password.repeat.not_match": "两次输入的新密码不一致",
    "user.password.update.success": "密码修改成功",

    // 前端自定义校验错误
    "invalid.server.url": "服务器地址格式错误，应为 http(s)://域名 且末尾无斜杠",
    "invalid.input": "请填写完整信息",

    // 网络层错误（前端自定义，非后端返回）
    "network.timeout": "请求超时，请检查网络",
    "network.disconnected": "网络连接失败，请检查网络或服务器地址",
    "network.error": "网络异常，请稍后重试",

    // 后端 logout 成功返回的 msg（兜底用，实际不弹 toast）
    success: "操作成功",

    // 兜底：未知 msg
    unknown: "操作失败，请稍后重试",
};
