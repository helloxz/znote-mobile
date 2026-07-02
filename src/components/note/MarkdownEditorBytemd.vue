<script setup lang="ts">
/**
 * Markdown 编辑器组件（bytemd 方案）
 *
 * 基于 @bytemd/vue-next 的 Editor，与现有 MarkdownEditor.vue 接口一致。
 * mode="split" 强制渲染格式化按钮，CSS 隐藏右侧预览区让编辑器独占全宽。
 */
import { computed } from "vue";
import { Editor } from "@bytemd/vue-next";
import "bytemd/dist/index.css";
import gfm from "@bytemd/plugin-gfm";
import zhHans from "bytemd/locales/zh_Hans.json";
import req from "@/utils/req";
import type { ApiResponse } from "@/api/user";

const props = defineProps<{
    modelValue: string;
    placeholder?: string;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
}>();

/**
 * 自定义图片上传插件
 * 用明确 MIME 类型触发相册而非直接调相机，上传后插入相对路径
 */
function imagePlugin() {
    return {
        actions: [
            {
                title: "插入图片",
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 48 48"><rect x="6" y="8" width="36" height="32" rx="4" stroke="currentColor" stroke-width="4"/><circle cx="17" cy="19" r="3" fill="currentColor"/><path d="M6 32l10-10 8 8 6-6 12 12" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>',
                handler: {
                    type: "action" as const,
                    click(ctx: any) {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/png,image/jpeg,image/gif,image/webp";
                        input.multiple = true;
                        input.onchange = async () => {
                            if (!input.files?.length) return;
                            const formData = new FormData();
                            for (const file of Array.from(input.files)) {
                                formData.append("file[]", file);
                            }
                            try {
                                const res = await req.post<ApiResponse<
                                    Array<{ file_id: string; original_name: string; url: string }>
                                >>("/api/user/file/upload", formData);
                                const body = res.data;
                                if (body?.code === 200 && Array.isArray(body.data)) {
                                    const imgs = body.data
                                        .map((item) => `![](${item.url})`)
                                        .join("\n\n");
                                    const { editor, appendBlock } = ctx;
                                    appendBlock(imgs);
                                    editor.focus();
                                }
                            } catch { /* ignore */ }
                        };
                        input.click();
                    },
                },
            },
        ],
    };
}

const plugins = [gfm(), imagePlugin()];

const value = computed(() => props.modelValue);

const onChange = (value: string) => {
    emit("update:modelValue", value);
};
</script>

<template>
  <Editor
    :value="value"
    :plugins="plugins"
    :locale="zhHans"
    :placeholder="props.placeholder"
    mode="split"
    class="bytemd-editor"
    @change="onChange"
  />
</template>

<style>
.bytemd{
    border:none !important;
}
.bytemd-toolbar{
    background-color: #ffffff !important;
    padding:4px 6px;
}

/* 编辑器撑满父容器（覆盖 bytemd 默认 height: 300px） */
.bytemd {
  height: 100% !important;
}

/* 隐藏底部状态栏（字数统计等），释放 25px */
.bytemd-status {
  display: none;
}

/* 调整 body 高度：减去工具栏 33px（状态栏已隐藏） */
.bytemd-body {
  height: calc(100% - 33px) !important;
}

/* 隐藏整个右侧工具栏 */
.bytemd-toolbar-right {
  display: none !important;
}

/* 隐藏左侧不需要的按钮：3=斜体 / 7=行内代码 / 8=代码块 / 13=分割线 */
.bytemd-toolbar-left > .bytemd-toolbar-icon:nth-child(3) { display: none; }
.bytemd-toolbar-left > .bytemd-toolbar-icon:nth-child(6) { display: none; }
.bytemd-toolbar-left > .bytemd-toolbar-icon:nth-child(7) { display: none; }
.bytemd-toolbar-left > .bytemd-toolbar-icon:nth-child(12) { display: none; }

/* 工具栏横向滚动（窄屏不裁剪按钮） */
.bytemd-toolbar {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.bytemd-toolbar::-webkit-scrollbar {
  display: none;
}

/* 隐藏右侧预览区，编辑器独占全宽 */
.bytemd-preview {
  display: none !important;
}
.bytemd-editor {
  width: 100% !important;
}
</style>