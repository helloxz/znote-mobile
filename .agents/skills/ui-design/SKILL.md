---
name: ui-design
description: znote-mobile 项目的 UI 设计规范与设计令牌使用指南，对齐小米笔记风格。涉及 znote-mobile 任何界面、样式、配色、字体、圆角、阴影、间距相关工作时使用——包括新增页面、编写或修改组件外观、调整颜色、设置字体大小、卡片/按钮样式等，即使没有明确说"设计规范"也要遵循。
---

# znote-mobile UI 设计规范

对齐小米笔记风格：干净、现代、克制，不花里胡哨。仅浅色模式，不做暗色。

所有设计令牌已定义在 `src/theme/variables.css`，自定义组件用 `var(--z-xxx)` 引用；Ionic 内置组件已通过 `--ion-*` 变量自动套用配色。

## 设计基调
- 主色：小米橙 `#FF6900`，仅在「主操作按钮、选中态、开关开启、激活图标、强调链接」等关键处点睛，不大面积铺色
- 背景：浅灰底 `#F7F8FA` + 白色卡片/工具栏，靠轻微阴影和分割线区分层级
- 文字：近黑主文字 + 多级灰阶次文字，保证移动端可读性
- 圆角：偏大圆角（卡片 14px），呼应 HyperOS 柔和感
- 留白：充足留白，不拥挤

## 色彩令牌

### 品牌主色（小米橙）
| Token | 色值 | 用途 |
|---|---|---|
| `--z-primary` | `#FF6900` | 主操作按钮、选中态、开关开启、强调链接 |
| `--z-primary-hover` | `#F56200` | 悬停态 |
| `--z-primary-pressed` | `#E55800` | 按下态 |
| `--z-primary-bg` | `#FFF1E5` | 选中行底色、标签底色（浅橙） |
| `--z-primary-contrast` | `#FFFFFF` | 主色上的文字/图标 |

### 中性色 - 文字（4 级灰阶）
| Token | 色值 | 用途 |
|---|---|---|
| `--z-text-primary` | `#1D2129` | 标题、正文 |
| `--z-text-secondary` | `#4E5969` | 描述、时间戳 |
| `--z-text-tertiary` | `#86909C` | 占位符、提示 |
| `--z-text-disabled` | `#C9CDD4` | 禁用 |
| `--z-text-inverse` | `#FFFFFF` | 深色/主色背景上的文字 |

### 中性色 - 背景（3 层）
| Token | 色值 | 用途 |
|---|---|---|
| `--z-bg-page` | `#F7F8FA` | 页面背景 |
| `--z-bg-surface` | `#FFFFFF` | 卡片 / 工具栏 / 弹层 |
| `--z-bg-subtle` | `#F2F3F5` | 次级背景：输入框底、分组块 |

### 边框 / 图标
| Token | 色值 | 用途 |
|---|---|---|
| `--z-border` | `#E5E6EB` | 边框、分割线 |
| `--z-border-light` | `#F2F3F5` | 轻量分割 |
| `--z-icon-default` | `#86909C` | 默认图标 |
| `--z-icon-active` | `#FF6900` | 激活图标（同主色） |

### 功能色
| Token | 色值 | 用途 |
|---|---|---|
| `--z-success` | `#00B42A` | 成功 |
| `--z-warning` | `#FF9F0A` | 警告（偏琥珀，与主橙区分） |
| `--z-danger` | `#F53F3F` | 危险 / 错误 / 删除 |
| `--z-info` | `#FF6900` | 信息（同主色，保持克制） |

## 字体
优先小米设备 MI Lan Pro，回退系统字体（已由 `--ion-font-family` 全局生效）。

| Token | 字号 | 行高 | 用途 |
|---|---|---|---|
| `--z-fs-caption` | 12px | 1.4 | 时间戳、辅助标注 |
| `--z-fs-body-sm` | 13px | 1.5 | 列表摘要 |
| `--z-fs-body` | 14px | 1.6 | 默认正文 |
| `--z-fs-body-lg` | 16px | 1.7 | 笔记内容正文 |
| `--z-fs-subtitle` | 17px | 1.5 | 副标题 |
| `--z-fs-title` | 20px | 1.4 | 页面标题 |
| `--z-fs-title-lg` | 24px | 1.3 | 大标题 |
| `--z-fs-headline` | 28px | 1.3 | 头部展示标题 |

## 圆角
| Token | 值 | 用途 |
|---|---|---|
| `--z-radius-xs` | 4px | 标签 |
| `--z-radius-sm` | 6px | 输入框、小标签 |
| `--z-radius-md` | 10px | 按钮、列表项 |
| `--z-radius-lg` | 14px | 卡片、弹层 |
| `--z-radius-xl` | 20px | 底部弹起 sheet |
| `--z-radius-pill` | 999px | 胶囊按钮、tag |

## 阴影（克制，低透明度）
| Token | 值 |
|---|---|
| `--z-shadow-xs` | `0 1px 2px rgba(0,0,0,0.03)` |
| `--z-shadow-sm` | `0 1px 4px rgba(0,0,0,0.05)` |
| `--z-shadow-md` | `0 2px 8px rgba(0,0,0,0.06)` |
| `--z-shadow-lg` | `0 4px 16px rgba(0,0,0,0.08)` |

## 间距
| Token | 值 |
|---|---|
| `--z-space-xs` / `sm` / `md` / `lg` / `xl` / `xxl` | 4 / 8 / 12 / 16 / 24 / 32px |

## 使用规范

### 自定义组件：直接引用令牌，不要硬编码色值
```vue
<style scoped>
.card {
  background: var(--z-bg-surface);
  border-radius: var(--z-radius-lg);
  box-shadow: var(--z-shadow-sm);
  padding: var(--z-space-lg);
}
.card__title { color: var(--z-text-primary); font-size: var(--z-fs-title); }
.card__desc { color: var(--z-text-secondary); font-size: var(--z-fs-body-sm); }
.btn-primary {
  background: var(--z-primary);
  color: var(--z-primary-contrast);
  border-radius: var(--z-radius-md);
}
</style>
```

### Ionic 内置组件：用 color 属性，配色已自动套用
```vue
<ion-button color="primary">主操作</ion-button>
<ion-button color="danger">删除</ion-button>
<ion-button color="success">保存</ion-button>
```

### 关键原则
- 不要硬编码色值（`#xxxxxx` / `rgb()`），一律走令牌
- 主色克制：小米橙仅用于点睛处，不大面积铺色
- 仅浅色模式：不写暗色适配；暗色 CSS 行在 `src/main.ts` 已注释保留备用
- 留白优先：宁可多留白，不要拥挤

## 相关文件
- 令牌定义：`src/theme/variables.css`
- 主题导入 / 暗色开关：`src/main.ts`
- 根组件 / 状态栏：`src/App.vue`
