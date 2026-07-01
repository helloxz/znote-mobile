export default {
    // 应用名
    "app.name": "ZNote",

    // 底部 Tab 标签
    "tabs.notes": "笔记",
    "tabs.shares": "我的分享",
	    "tabs.trash": "回收站",
	    "tabs.about": "关于",

    // 占位提示文案
    "placeholder.me": "个人中心开发中",

    // 笔记页
    "note.title": "ZNote",
    "note.searchPlaceholder": "输入至少3个字符进行搜索",
    "note.notebooks": "笔记本",
    "note.switchNotebook": "切换笔记本",
    "note.categories": "分类",
    "note.empty": "暂无内容",
    "note.loading": "加载中...",
    "note.untitled": "无标题",
    // 搜索
    "note.search.empty": "未找到相关笔记",
    // 笔记列表操作菜单
    "note.list.pin": "置顶",
    "note.list.unpin": "取消置顶",
    "note.list.share": "创建分享",
    "note.list.move": "移动笔记",
    "note.list.trash": "移入回收站",
    "note.list.cancel": "取消",
    "note.list.pin.success": "已置顶",
    "note.list.unpin.success": "已取消置顶",
    "note.list.sort.success": "排序成功",
    "note.list.sort.failed": "排序失败，请重试",
    "note.list.trash.success": "已移入回收站",
    "note.list.feature.comingSoon": "功能开发中",
    // 设置菜单项
    "note.menu.changePassword": "修改密码",
    "note.menu.logout": "退出登录",
    // 设置面板（底部滑出）
    "note.settings.cancel": "取消",
    "note.settings.logoutConfirm": "确定退出登录吗？",
    "note.settings.logoutConfirmOk": "退出",
    // 修改密码页
    "note.password.title": "修改密码",
    "note.password.old": "旧密码",
    "note.password.new": "新密码",
    "note.password.repeat": "确认新密码",
    "note.password.placeholder.old": "输入旧密码",
    "note.password.placeholder.new": "输入新密码",
    "note.password.placeholder.repeat": "再次输入新密码",
    "note.password.submit": "确认修改",
    "note.password.success": "密码修改成功",
    "note.password.fieldsRequired": "请填写所有密码字段",
    "note.password.notMatch": "两次输入的新密码不一致",
    "note.password.logoutCountdown": "密码修改成功，{seconds} 秒后自动退出登录",
    // 分类操作菜单
    "note.category.renameText": "重命名",
    "note.category.moveText": "移动分类",
    "note.category.deleteText": "删除分类",
    "note.category.cancel": "取消",
    "note.category.rename.title": "重命名分类",
    "note.category.rename.placeholder": "请输入新名称",
    "note.category.rename.success": "重命名成功",
    "note.category.delete.title": "删除分类",
    "note.category.delete.warning": "「{title}」删除后不可恢复，其下笔记将放入回收站",
    "note.category.delete.hint": "请输入分类名称确认",
    "note.category.delete.confirmText": "确认删除",
    "note.category.delete.success": "删除成功",
    // 移动分类弹窗
    "note.category.move.title": "移动分类",
    "note.category.move.source": "正在移动",
    "note.category.move.selectTarget": "请选择目标分类",
    "note.category.move.current": "当前位置",
    "note.category.move.toHere": "移动到此处",
    "note.category.move.topLevel": "移动到顶层",
    "note.category.move.success": "移动成功",
    // 移动笔记弹窗（复用移动分类弹窗组件）
    "note.move.title_note": "移动笔记",
    "note.move.success": "移动成功",
    // 通用对话框按钮
    "note.dialog.confirm": "确定",

    // 笔记详情页
    "note.detail.edit": "编辑",
    "note.detail.preview": "预览",
    "note.detail.save": "保存",
    "note.detail.titlePlaceholder": "输入笔记标题",
    "note.detail.editPlaceholder": "开始编写...",
    "note.detail.saveSuccess": "已保存",
    "note.detail.saveFailed": "保存失败，请重试",
    "note.detail.loadFailed": "笔记加载失败",

    // 登录页
    "login.title": "ZNote",
    "login.subtitle": "登录你的笔记账号",
    "login.server": "服务器地址",
    "login.serverPlaceholder": "https://www.example.com",
    "login.username": "用户名 / 邮箱",
    "login.usernamePlaceholder": "输入用户名或邮箱",
    "login.password": "密码",
    "login.passwordPlaceholder": "输入密码",
    "login.submit": "登录",
    "login.logging": "登录中...",

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

    // ========== 分享 ==========
    "shares.title": "我的分享",
    "shares.search_placeholder": "输入至少2个字符筛选",
    "shares.empty": "暂无分享",
    "shares.no_results": "未找到匹配的分享",
    "shares.never_expire": "永不过期",
    "shares.copy_link": "复制分享链接",
    "shares.delete": "删除分享",
    "shares.delete_confirm": "确定删除该分享吗？",
    "shares.delete.success": "删除成功",
    "shares.copy.success": "已复制到剪贴板",
    "shares.status.active": "有效",
    "shares.status.revoked": "已撤销",
    "shares.result.url": "访问地址",
    "shares.result.password": "密码",

    // ========== 创建分享弹窗 ==========
    "share.create.title": "创建分享",
    "share.create.noteTitle": "笔记标题",
    "share.create.passwordLabel": "分享密码",
    "share.create.passwordHint": "设置密码后，访问者需要输入密码才能查看",
    "share.create.passwordPlaceholder": "输入密码",
    "share.create.expireLabel": "有效天数",
    "share.create.expireHint": "设置分享的有效期，留空表示永久有效",
    "share.create.expirePlaceholder": "输入天数（可选，留空永久有效）",
    "share.create.confirm": "创建分享",
    "share.create.creating": "创建中...",
    "share.create.success": "分享创建成功",
    "share.create.failed": "创建失败，请重试",
    "share.create.link": "分享链接",
    "share.create.passwordResult": "访问密码",
    "share.create.copied": "已复制到剪贴板",
    "share.create.done": "完成",

    // ========== 回收站 ==========
    "trash.title": "回收站",
    "trash.empty": "回收站为空",
    "trash.empty.button": "清空",
    "trash.empty.confirm": "确定清空回收站吗？此操作不可恢复",
    "trash.empty.success": "回收站已清空",
    "trash.permanent_delete": "彻底删除",
    "trash.permanent_delete.confirm": "确定彻底删除该笔记吗？此操作不可恢复",
    "trash.permanent_delete.success": "已彻底删除",
	    "trash.move": "移动笔记",

	    // ========== 关于 ==========
	    "about.title": "关于",
	    "about.feedback": "问题反馈",
	    "about.community": "交流群",
	    "about.checkUpdate": "检测更新",
		    "about.source": "开源地址",
		    "about.updateToast": "已是最新版本",
		    "about.update.checking": "正在检查更新...",
		    "about.update.newVersion": "发现新版本 v{version}",
		    "about.update.goDownload": "前往下载",
		};