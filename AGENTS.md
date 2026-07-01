# znote-mobile 技术选型说明

> 本文档记录 znote-mobile 移动端 APP 的技术选型与关键设计决策，供后续开发复用。
> 项目位置：`znote-mobile/`（与 web 端 `frontend/`、后端 `backend/` 同级）。

---

## 一、项目概述

| 项目 | 说明 |
|------|------|
| 基础脚手架 | Ionic Vue 8 + Vite 5 + Capacitor 8（官方 Tabs starter 模板，已初始化） |
| 与 web 端关系 | 与 `frontend/` 共用同一套 Hono 后端 API + Bearer Token 认证 |
| 当前状态 | 依赖已安装；`src/` 仍为模板默认内容，无业务代码；未添加 android/ios 原生平台 |

---

## 二、技术选型速查表

| 模块 | 选型 | 说明 |
|------|------|------|
| 运行时框架 | Vue 3 + Ionic Vue 8 | `@ionic/vue` + `@ionic/vue-router` + `ionicons` |
| 原生容器 | Capacitor 8 | `@capacitor/core` + app/haptics/keyboard/status-bar 插件 |
| 网络请求 | **axios** | 沿用 web 端 `frontend/src/utils/req.ts` 封装，只改 baseURL |
| 数据存储 | **`@capacitor/preferences`** | 统一存所有 KV（token / userInfo / 列表缓存等） |
| 状态管理 | **Pinia** | Options API 风格，沿用 web 端 store 设计 |

---

## 三、网络请求：axios

### 设计要点

- `axios.create({ baseURL, timeout: 120000 })` 创建单例实例
- 请求拦截器自动注入 `Authorization: Bearer <token>`
- `baseURL` 通过 Vite 环境变量 `VITE_API_URL` 配置，dev/生产分别指向不同后端地址
- 后端为 Hono `bearerAuth` 中间件，标准 Bearer Token 认证，移动端接入方式与 web 端完全一致

### 与 web 端的差异

仅 `baseURL` 不同：web 端默认同源 `/`，移动端需显式指向后端地址（APP 无同源概念）。

---

## 四、数据存储：@capacitor/preferences（重点）

### 1. 为什么不用 localStorage / sessionStorage

| 方案 | 问题 |
|------|------|
| `localStorage` | iOS WKWebView 在内存紧张时可能清空 localStorage，持久性不可靠 |
| `sessionStorage` | "关标签页即失" 语义在 APP 里不成立（没有标签页概念，APP 退出后行为依赖 WebView 实现，不稳定） |

> 结论：web 端「localStorage 存 token / sessionStorage 存 userInfo」的混用方案**不建议原样搬到移动端**。

### 2. 为什么不用 @ionic/storage

在 **Capacitor 原生环境**下，`@ionic/storage` 的默认后端**就是 `@capacitor/preferences`**（除非额外配置 SQLite driver）。

- 在纯 web 环境它才默认用 IndexedDB
- 在原生 APP 上，它只是多包一层抽象 + 自动 JSON 序列化，无额外收益
- 当前场景「数据都从 API 实时拉、无大量离线缓存」，这层抽象纯属多余

> 结论：不引入 `@ionic/storage`，所有 KV 统一用 `@capacitor/preferences`。

### 3. 统一存储方案

`@capacitor/preferences` 底层实现：

| 平台 | 后端 |
|------|------|
| iOS | NSUserDefaults |
| Android | SharedPreferences |

**值只能是字符串**，存对象需自行 `JSON.stringify/parse`，建议包一层极薄工具：

```typescript
// 伪代码示意，约 10 行
import { Preferences } from '@capacitor/preferences';

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const { value } = await Preferences.get({ key });
  return value ? (JSON.parse(value) as T) : fallback;
}

async function setJson(key: string, val: unknown): Promise<void> {
  await Preferences.set({ key, value: JSON.stringify(val) });
}
```

适用数据：token、userInfo、用户设置、笔记列表缓存（几百条元数据序列化后通常几十 KB~几百 KB，preferences 完全 hold 得住）。

### 4. ⚠️ 关键坑：异步存储 vs 同步拦截器

`@capacitor/preferences` 是**异步 API**，但 axios 请求拦截器是**同步执行**的，不能在拦截器里 `await Preferences.get()`。

**正确做法**：维护内存中的 token 缓存，拦截器只读内存。

- 模块级变量持有当前 token（内存缓存）
- `getToken()` —— 同步，读内存
- `setToken(v)` —— 异步写 preferences + 同步更新内存
- `clearToken()` —— 同步清内存 + 异步删 preferences
- APP 启动时 `await initToken()` 把 preferences 里的 token 预加载到内存，**再 mount Vue App**（保证首屏请求能拿到 token）

### 5. 会话级 UI 状态

当前选中分类、折叠状态等"当次会话有效"的数据，直接放 Pinia store 内存，**不持久化**（替代 web 端 sessionStorage 语义）。

### 6. 边界提醒（仅未来需要时）

只有当**未来要做笔记正文离线缓存**时才需要换方案：

- 笔记正文一篇可能几 KB~几百 KB，几百篇累计几十 MB
- preferences 单条 value 有大小限制，不适合存大文本
- 那时再上 `@capacitor-community/sqlite`（带索引查询能力，比 storage 更合适）

> 当前不做离线则无需预留，需要时再加。

---

## 五、状态管理：Pinia

- Vue 3 + Ionic Vue + Pinia 完全兼容
- 沿用 web 端 Options API 风格的 store 设计，可参考移植以下 store：

| Store | 职责 |
|------|------|
| `user` | 用户信息、登录态、token、登出 |
| `site` | 应用信息（版本/用户数） |
| `system` | 系统初始化状态、是否允许注册 |
| `note` | 笔记工作台（笔记本树、笔记列表、回收站等，待移动端页面需求明确后再做） |

**关键改动**：token 的读写从 web 端的 `localStorage` 改为上面第四节「内存 + preferences」方案。

**可选增强**：如后续要 store 自动持久化，可加 `pinia-plugin-persistedstate`，但要把默认 storage 换成 `@capacitor/preferences` 适配器（同样因异步需适配）。当前不引入。

---

## 六、与后端对接说明

| 项 | 说明 |
|----|------|
| 认证方式 | HTTP Bearer Token（Hono `bearerAuth` 中间件） |
| Token 格式 | 形如 `web-<28位随机字符>`，总长 32+ |
| Token 有效期 | 30 天 |
| Token 传递位置 | HTTP header `Authorization: Bearer <token>` |
| 登出 | 后端撤销 session（置为非 active 状态） |
| 改密码 | 后端会撤销该用户所有 active session，强制所有设备重登 |
| 密码加密 | PBKDF2（以 username 作盐） |
| API 返回格式 | `{ code, msg, data }`，`code: 200` 成功，其他失败 |

---

## 七、待办 / 未决项

| 项 | 当前状态 | 处理建议 |
|----|----------|----------|
| `capacitor.config.ts` 的 appId | 仍是模板默认 `io.ionic.starter` | 改为正式包名，如 `io.znote.app` |
| `index.html` 的 title | 仍是 `Ionic App` | 改为 `znote` |
| android/ios 原生平台 | 未添加 | 需本地执行 `npx cap add android` / `npx cap add ios`（需对应 SDK 环境） |
| `.env` 配置 | 未创建 | 新建 `.env` / `.env.example`，定义 `VITE_API_URL` |
| 网络请求封装 `src/utils/req.ts` | 未创建 | 参照 web 端 `frontend/src/utils/req.ts` 移植 |
| 存储服务 `src/services/storage.ts` | 未创建 | 按第四节方案封装内存缓存 + preferences |
| Pinia store | 未创建 | 按第五节方案移植 user/site/system，note 视需求而定 |

---

## 九、全局可复用组件 & Composable

以下组件/Composable 为全局通用，**新增同类交互时直接复用，不要重复造轮子**。

### 组件清单

| 组件 | 路径 | 用途 |
|------|------|------|
| `SettingsSheet` | `src/components/note/SettingsSheet.vue` | 底部滑出设置面板（用户信息 + 修改密码 + 退出登录），Props: `show` |
| `ActionSheet` | `src/components/note/ActionSheet.vue` | 底部操作面板（标题 + 操作按钮 + 取消），Props: `show`, `header?`, `buttons: {text, role, danger?}[]` |
| `ToastContainer` | `src/components/ToastContainer.vue` | 全局 Toast 容器，已挂载在 `App.vue`，无需手动引用 |
| `MoveCategoryModal` | `src/components/note/MoveCategoryModal.vue` | 移动分类/笔记弹窗，自定义 header（左取消 + 中标题 + 右确定），Props: `show`, `type?`, `sourceId`, `sourceName`, `categoryTree`, `excludeNodeIds?`, `currentCategoryId?` |

### Composable 清单

| Composable | 路径 | 用途 |
|------|------|------|
| `useActionSheet` | `src/composables/useActionSheet.ts` | `showActionSheet({header?, buttons, cancelText?})` → `Promise<role\|undefined>`，自动处理 restoreScroll |
| `useToast` | `src/composables/useToast.ts` | `showToast(message, color?)`，全局共享状态，`App.vue` 已挂载 `ToastContainer` |

### 使用示例

```ts
// 底部操作面板
const { showActionSheet } = useActionSheet();
const role = await showActionSheet({
  header: "笔记标题",
  buttons: [
    { text: "置顶", role: "pin" },
    { text: "删除", role: "delete", danger: true },
  ],
});

// Toast 提示
const { showToast } = useToast();
showToast("操作成功", "success");
showToast("操作失败"); // 默认 danger
```

### 设计规范

- **底部面板**（SettingsSheet / ActionSheet / MoveCategoryModal）：统一使用自定义 header，与 Ionic 默认 toolbar 风格一致（`--z-bg-page` 背景 + `--z-text-*` 文字）
- **Toast**：胶囊形卡片 + `--z-success`/`--z-danger` 背景色，顶部居中，2 秒自动消失
- **样式变量**：全部使用 `--z-*` 设计令牌（定义在 `src/theme/variables.css`），禁止硬编码颜色值
