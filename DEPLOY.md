# Cloudflare Pages 部署指南

本文档说明如何将 znote-mobile PWA 部署到 Cloudflare Pages。

## 前置条件

1. GitHub 账号（代码托管）
2. Cloudflare 账号（免费）
3. 域名 `xphub.dev` 已托管在 Cloudflare（或可添加）

## 部署步骤

### 1. 推送代码到 GitHub

```bash
cd /Users/xiaoz/MyProject/znote/znote-mobile

# 初始化 git 仓库（如果还没有）
git init
git add .
git commit -m "feat: PWA support ready for deployment"

# 添加远程仓库并推送
git remote add origin https://github.com/xiaoz/znote-mobile.git
git push -u origin main
```

### 2. 登录 Cloudflare Pages

1. 访问 https://dash.cloudflare.com/
2. 左侧菜单选择 **Workers & Pages**
3. 点击 **Create Application**
4. 选择 **Pages** 标签
5. 点击 **Connect to Git**

### 3. 连接 GitHub 仓库

1. 授权 Cloudflare 访问你的 GitHub 账号
2. 选择 `znote-mobile` 仓库
3. 点击 **Begin setup**

### 4. 配置构建设置

填写以下配置：

| 配置项 | 值 |
|--------|-----|
| **Project name** | `znote-app`（或你喜欢的名字） |
| **Production branch** | `main` |
| **Framework preset** | `Vite`（或选择 `None`） |
| **Build command** | `npm install && npm run build` |
| **Build output directory** | `dist` |

**Environment Variables**（点击 Add variable）：

| Variable | Value |
|----------|-------|
| `NODE_VERSION` | `22` |

**说明**：
- 使用 npm 构建，兼容性最好
- 指定 Node.js 22 版本，避免版本问题

### 5. 开始部署

1. 点击 **Save and Deploy**
2. 等待构建完成（约 2-5 分钟）
3. 构建成功后会获得一个默认域名：`znote-app.pages.dev`

### 6. 绑定自定义域名

1. 进入项目 → **Settings** → **Domains**
2. 点击 **Set up a custom domain**
3. 输入域名：`app.znote.xphub.dev`
4. 点击 **Continue**
5. Cloudflare 会自动添加 DNS 记录（CNAME）
6. 等待 SSL 证书自动签发（通常 1-5 分钟）

**如果域名不在 Cloudflare**：

需要手动添加 DNS 记录：
```
类型：CNAME
名称：app.znote
目标：znote-app.pages.dev
代理状态：已代理（橙色云朵开启）
```

### 7. 验证部署

访问 https://app.znote.xphub.dev，检查：

- ✅ 页面正常加载
- ✅ HTTPS 正常（地址栏有锁图标）
- ✅ DevTools → Application → Manifest 显示完整信息
- ✅ DevTools → Application → Service Workers 显示 sw.js 已激活
- ✅ 浏览器地址栏右侧出现"安装"图标
- ✅ Network → Offline → 刷新页面，应用外壳可加载

## 自动部署

Cloudflare Pages 会自动监听 GitHub 仓库的 push 事件：

```
代码推送到 main 分支 → 自动触发构建 → 部署到生产环境
```

## Preview Deployments

每次创建 Pull Request 时，Cloudflare Pages 会自动生成预览 URL：

```
PR #123 → https://abc123.znote-app.pages.dev
```

方便测试分支功能。

## 常见问题

### 1. 构建失败

**检查 Build log**：
- 进入项目 → **Deployments** → 点击最近的部署 → 查看 **Build log**

**常见原因**：
- 依赖安装失败：检查 `package.json` 是否正确
- 构建命令错误：确保是 `npm install && npm run build`
- Node.js 版本问题：确保环境变量 `NODE_VERSION=22`

### 2. PWA 无法安装

- 确认域名使用 HTTPS
- 确认 `manifest.webmanifest` 可访问
- 确认 `sw.js` 可访问
- 清除浏览器缓存后重试

### 3. 图标不显示

检查 `dist/icons/` 目录是否存在且包含所有图标文件。

### 4. 自定义域名 SSL 证书未签发

- 确认 DNS 记录正确（CNAME 指向 `znote-app.pages.dev`）
- 确认代理状态已开启（橙色云朵）
- 等待 5-10 分钟后刷新

## 更新部署

后续更新只需推送代码：

```bash
git add .
git commit -m "fix: some bug"
git push
```

Cloudflare Pages 会自动触发构建和部署。

## 回滚

在 Cloudflare Pages 控制台：

1. 进入项目 → **Deployments**
2. 找到想要回滚的版本
3. 点击 **...** → **Rollback to this deployment**

## 费用说明

Cloudflare Pages 免费额度：

| 资源 | 免费额度 |
|------|---------|
| 构建次数 | 500 次/月 |
| 带宽 | 无限 |
| 请求次数 | 无限 |
| 自定义域名 | 无限 |
| SSL 证书 | 免费 |

对于个人项目完全够用。

## 相关链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html#cloudflare-pages)
- [znote-mobile PWA 配置](./README.md)
