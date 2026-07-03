<script setup lang="ts">
/**
 * 笔记快照卡片（用于生成分享图片）
 *
 * 设计：把"标题 + Markdown 正文"渲染成一张白底卡片，供截图库（modern-screenshot）
 * 转 PNG 后走系统分享。不带日期/分类/水印，纯标题+正文，按内容自适应高度。
 *
 * - 图片域名拼接：将 `/files/xxx.jpg` 这类相对路径补上服务器域名；
 *   已是完整 https?:// URL 的不处理（复用 markdownImage.ts）。
 * - 卡片宽度固定 750px（手机逻辑像素 375 缩放 2 倍 = 750 设计宽，截图清晰），
 *   高度由内容撑开，截图前由截图库读取真实高度生成单张长图。
 */
import { computed, ref } from "vue";
import MarkdownViewer from "@/components/note/MarkdownViewer.vue";
import { prependImageDomain } from "@/utils/markdownImage";
import { getServerUrl } from "@/services/storage";
import type { Note } from "@/types/note";

const props = defineProps<{
    /** 待分享的笔记 */
    note: Note;
}>();

/** 卡片根节点：暴露给父级，供截图库直接对 DOM 转 PNG */
const cardRef = ref<HTMLElement | null>(null);
defineExpose({ cardRef });

/**
 * 渲染用内容：把相对路径图片补全为绝对路径
 * 服务器地址来源 getServerUrl()（内存缓存，登录时注入）
 */
const renderedContent = computed(() => {
    const serverUrl = getServerUrl();
    return prependImageDomain(props.note.content || "", serverUrl || "");
});

/** 标题：空标题留空，父级用 i18n 兜底提示 */
const title = computed(() => props.note.title || "");
</script>

<template>
    <!--
      快照卡片：固定宽度 750px（=2x 设计稿），白底，上下左右内边距。
      放在离屏容器中渲染，截图库据此 DOM 生成 PNG。
      不要用 display:none / visibility:hidden，否则截图拿不到布局尺寸。
    -->
    <div class="snapshot-card" ref="cardRef">
        <h1 v-if="title" class="snapshot-title">{{ title }}</h1>
        <div class="snapshot-content">
            <!-- 复用 MarkdownViewer 渲染，保证与正文阅读页排版一致 -->
            <MarkdownViewer :content="renderedContent" />
        </div>
    </div>
</template>

<style scoped>
/* 卡片固定宽度，白底，圆角与正文一致的内边距 */
.snapshot-card {
    width: 750px;
    background: #ffffff;
    padding: 48px 40px;
    box-sizing: border-box;
    color: #334155;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
        "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

/* 标题：与正文 h1 区分，单独样式 */
.snapshot-title {
    font-size: 40px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.3;
    margin: 0 0 32px 0;
    word-break: break-word;
}

/* 正文容器：继承 MarkdownViewer 的 .doc-content 排版 */
.snapshot-content {
    font-size: 30px;
    line-height: 1.75;
}
</style>