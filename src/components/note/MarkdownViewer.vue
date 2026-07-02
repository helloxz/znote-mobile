<script setup lang="ts">
/**
 * Markdown 只读渲染组件（移动端）
 *
 * 复用 web 端 Doc/Share 页的 incremark 渲染引擎，保证渲染结果跨端一致。
 * 内置深色代码块主题 + .doc-content 排版样式，移动端窄屏表格横向滚动。
 * 不做 TOC 提取（窄屏不需要目录）。
 */
import { IncremarkContent, ThemeProvider } from "@incremark/vue";
import type { DesignTokens } from "@incremark/theme";
import "@incremark/theme/styles.css";

defineProps<{
    /** Markdown 原文 */
    content: string;
}>();

/** 代码块主题：深色背景 + 亮色文字（与 web 端 DocNote.vue 一致） */
const codeTheme = {
    color: {
        code: {
            blockBackground: "#1e293b",
            blockText: "#e2e8f0",
            inlineBackground: "#334155",
            inlineText: "#e2e8f0",
            headerBackground: "#0f172a",
        },
    },
} as Partial<DesignTokens>;
</script>

<template>
  <!-- 包一层 doc-content 容器：承载 incremark 渲染后的 DOM 与排版样式 -->
  <div class="doc-content">
    <ThemeProvider :theme="codeTheme">
      <IncremarkContent :content="content" :is-finished="true" />
    </ThemeProvider>
  </div>
</template>

<style>
/* incremark 渲染内容排版样式（从 web 端 DocNote.vue 搬迁，保持跨端一致） */
.doc-content {
  line-height: 1.75;
  color: #334155;
  overflow-wrap: break-word;
  user-select: text;
  -webkit-user-select: text;
}
.doc-content h1 { font-size: 1.75rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.75rem; color: #0f172a; }
.doc-content h2 { font-size: 1.4rem; font-weight: 600; margin-top: 1.75rem; margin-bottom: 0.5rem; color: #1e293b; padding-bottom: 0.3rem; border-bottom: 1px solid #e2e8f0; }
.doc-content h3 { font-size: 1.15rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #334155; }
.doc-content h4 { font-size: 1rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #475569; }
.doc-content p { margin-bottom: 0.75rem; }
.doc-content ul, .doc-content ol { margin-bottom: 0.75rem; padding-left: 1.5rem; }
.doc-content ul { list-style-type: disc; }
.doc-content ul ul { list-style-type: circle; }
.doc-content ul ul ul { list-style-type: square; }
.doc-content ol { list-style-type: decimal; }
.doc-content li { margin-bottom: 0.25rem; }
.doc-content a { color: #2563eb; text-decoration: underline; }
.doc-content blockquote { padding-left: 1rem; margin: 1rem 0; color: #64748b; overflow-wrap: break-word; word-break: break-word; }
.doc-content table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 1rem 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}
.doc-content th, .doc-content td {
  border-bottom: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  padding: 0.5rem 0.75rem;
  text-align: left;
  background: transparent;
}
.doc-content th:last-child, .doc-content td:last-child { border-right: none; }
.doc-content tbody tr:last-child th,
.doc-content tbody tr:last-child td { border-bottom: none; }
.doc-content th { background: #f8fafc; font-weight: 600; }
.doc-content img { max-width: 100%; border-radius: 0.375rem; }

/* 手机端：表格横向滚动，不强制换行压缩 */
@media (max-width: 767px) {
  .doc-content table {
    display: block;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
  }
  .doc-content th, .doc-content td {
    white-space: nowrap;
  }
}
.doc-content .incremark-code .code-btn:hover:not(:disabled) { background-color: rgba(255, 255, 255, 0.1); }
</style>
