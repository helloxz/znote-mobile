export default {
    // 应用名
    app: {
        name: "ZNote",
    },

    // 底部 Tab 标签
    tabs: {
        notes: "Notes",
        shares: "My Shares",
        me: "Me",
    },

    // 占位提示文案
    placeholder: {
        me: "Profile coming soon",
    },

    // 笔记页
    note: {
        title: "ZNote",
        searchPlaceholder: "Type at least 3 characters to search",
        notebooks: "Notebooks",
        switchNotebook: "Switch notebook",
        categories: "Categories",
        empty: "No content yet",
        loading: "Loading...",
        untitled: "Untitled",
        // 搜索
        search: {
            empty: "No notes found",
        },
        // 笔记列表操作菜单
        list: {
            pin: "Pin",
            unpin: "Unpin",
            share: "Create Share",
            move: "Move Note",
            trash: "Move to Trash",
            cancel: "Cancel",
            "pin.success": "Pinned",
            "unpin.success": "Unpinned",
            "sort.success": "Sorted successfully",
            "sort.failed": "Sort failed, please retry",
            "trash.success": "Moved to trash",
            feature: {
                comingSoon: "Feature coming soon",
            },
        },
        // 设置菜单项
        menu: {
            changePassword: "Change Password",
            logout: "Log Out",
        },
        // 修改密码页
        password: {
            title: "Change Password",
            old: "Old Password",
            new: "New Password",
            repeat: "Confirm New Password",
            placeholder: {
                old: "Enter old password",
                new: "Enter new password",
                repeat: "Re-enter new password",
            },
            submit: "Confirm Change",
            success: "Password changed successfully",
            fieldsRequired: "Please fill in all password fields",
            notMatch: "The two new passwords do not match",
            logoutCountdown: "Password changed, logging out in {seconds} seconds",
        },
        // 分类操作菜单
        category: {
            renameText: "Rename",
            deleteText: "Delete category",
            cancel: "Cancel",
            rename: {
                title: "Rename Category",
                placeholder: "Enter new name",
                success: "Renamed successfully",
            },
            delete: {
                title: "Delete Category",
                warning: "\"{title}\" cannot be restored after deletion, notes under it will be moved to trash",
                hint: "Type the category name to confirm",
                confirmText: "Confirm Delete",
                success: "Deleted successfully",
            },
        },
        // 通用对话框按钮
        dialog: {
            confirm: "Confirm",
        },
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
    "invalid.password": "Invalid password format, 6-18 chars with letters, digits or special chars",
    "invalid.username": "Invalid username format",
    "invalid.email": "Invalid email format",
    "invalid.username.or.password": "Incorrect username or password",

    // 修改密码相关（后端返回的 msg）
    "user.old_password.invalid": "Old password is incorrect",
    "user.password.repeat.not_match": "The two new passwords do not match",
    "user.password.update.success": "Password updated successfully",

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

    // ========== 分享 ==========
    shares: {
        title: "My Shares",
        search_placeholder: "Type at least 2 chars to filter",
        empty: "No shares yet",
        no_results: "No matching shares",
        never_expire: "Never expires",
        copy_link: "Copy Share Link",
        delete: "Delete Share",
        delete_confirm: "Delete this share?",
        "delete.success": "Share deleted",
        "copy.success": "Copied to clipboard",
        status: {
            active: "Active",
            revoked: "Revoked",
        },
        result: {
            url: "URL",
            password: "Password",
        },
    },
};
