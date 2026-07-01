<script setup lang="ts">
/**
 * Markdown 编辑器组件（bytemd 方案）
 *
 * 基于 @bytemd/vue-next 的 Editor，与现有 MarkdownEditor.vue 接口一致。
 * 移动端 mode="tab"，窄屏只显示编辑区或预览区，不双栏。
 */
import { computed } from "vue";
import { Editor } from "@bytemd/vue-next";
import "bytemd/dist/index.css";
import gfm from "@bytemd/plugin-gfm";
import zhHans from "bytemd/locales/zh_Hans.json";
import req from "@/utils/req";
import { getServerUrl } from "@/services/storage";
import type { ApiResponse } from "@/api/user";

const props = defineProps<{
    modelValue: string;
    placeholder?: string;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
}>();

/** 插件：GFM（表格/删除线/任务列表） */
const plugins = [gfm()];

/** bytemd 的 v-model 用 :value + @change（e.value） */
const value = computed(() => props.modelValue);

const onChange = (value: string) => {
    emit("update:modelValue", value);
};

/** 图片上传：调后端 multipart 接口，返回 {url} 数组 */
const uploadImages = async (
    files: File[]
): Promise<{ url: string }[]> => {
    const formData = new FormData();
    for (const file of files) {
        formData.append("file[]", file);
    }
    try {
        const res = await req.post<ApiResponse<
            Array<{ file_id: string; original_name: string; url: string }>
        >>("/api/user/file/upload", formData);
        const body = res.data;
        if (body?.code === 200 && Array.isArray(body.data)) {
            const baseUrl = getServerUrl() || "";
            return body.data.map((item) => ({ url: baseUrl + item.url }));
        }
    } catch { /* fall through */ }
    return [];
};
</script>

<template>
  <Editor
    :value="value"
    :plugins="plugins"
    :locale="zhHans"
    :upload-images="uploadImages"
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

/* 隐藏左侧不需要的按钮：3=斜体 / 7=行内代码 / 13=分割线 */
.bytemd-toolbar-left > .bytemd-toolbar-icon:nth-child(3) { display: none; }
.bytemd-toolbar-left > .bytemd-toolbar-icon:nth-child(7) { display: none; }
.bytemd-toolbar-left > .bytemd-toolbar-icon:nth-child(8) { display: none; }
.bytemd-toolbar-left > .bytemd-toolbar-icon:nth-child(13) { display: none; }

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