<script setup lang="ts">
/**
 * Markdown 编辑器组件（移动端自研方案）
 *
 * ion-textarea + 自定义精简工具栏，原生移动端输入体验，无第三方编辑器依赖。
 * 8 个格式按钮：B I H ❝ • <> 🔗 📷
 * 图片上传：走后端 /api/user/file/upload
 */
import { ref, watch } from "vue";
import { IonTextarea, IonIcon } from "@ionic/vue";
import { linkOutline, imageOutline } from "ionicons/icons";
import req from "@/utils/req";
import { getServerUrl } from "@/services/storage";
import type { ApiResponse } from "@/api/user";
import { useToast } from "@/composables/useToast";

const { showToast } = useToast();

const props = defineProps<{
    modelValue: string;
    placeholder?: string;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
}>();

/** 编辑器内容 */
const content = ref(props.modelValue);

/** 双向同步（带值相等守卫，避免循环） */
watch(
    () => props.modelValue,
    (v) => { if (v !== content.value) content.value = v; }
);
watch(content, (v) => {
    if (v !== props.modelValue) emit("update:modelValue", v);
});

/** ion-textarea 组件引用 */
const textareaRef = ref<InstanceType<typeof IonTextarea> | null>(null);

/** 获取原生 textarea 元素 */
const getNativeTextarea = async (): Promise<HTMLTextAreaElement | null> => {
    const el = textareaRef.value?.$el as HTMLElement | undefined;
    return el?.querySelector("textarea") ?? null;
};

/**
 * 在光标处插入/包裹文字
 * @param before  光标前插入的文本
 * @param after   光标后插入的文本（可选，默认同 before 用于包裹）
 * @param placeholder 无选中时的占位文字
 */
const insertAtCursor = async (
    before: string,
    after?: string,
    placeholder?: string,
) => {
    const ta = await getNativeTextarea();
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    const hasSelection = start !== end;

    const insertText = hasSelection
        ? before + selected + (after ?? before)
        : before + (placeholder ?? "") + (after ?? before);

    content.value =
        ta.value.substring(0, start) + insertText + ta.value.substring(end);

    // 恢复焦点和光标位置
    await ta.focus();
    const newCursor = hasSelection
        ? start + before.length + selected.length + (after ?? before).length
        : start + before.length + (placeholder?.length ?? 0);
    ta.setSelectionRange(newCursor, newCursor);
};

// ========== 工具栏按钮 ==========

const doBold = () => insertAtCursor("**", "**", "加粗文字");
const doItalic = () => insertAtCursor("*", "*", "斜体文字");
const doHeading = () => insertAtCursor("## ", ""); // 行首
const doQuote = () => insertAtCursor("> ", ""); // 行首
const doList = () => insertAtCursor("- ", ""); // 行首
const doCode = () => insertAtCursor("`", "`", "代码");
const doLink = () => insertAtCursor("[", "](url)", "链接文字");

/** 图片上传 → 插入 ![](url) */
const doImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
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
                const baseUrl = getServerUrl() || "";
                const ta = await getNativeTextarea();
                if (!ta) return;
                const start = ta.selectionStart;
                const imgs = body.data
                    .map((item) => `![](${baseUrl}${item.url})`)
                    .join("\n");
                content.value =
                    ta.value.substring(0, start) + imgs + "\n" + ta.value.substring(start);
                const newPos = start + imgs.length + 1;
                await ta.focus();
                ta.setSelectionRange(newPos, newPos);
            }
        } catch {
            showToast("图片上传失败");
        }
    };
    input.click();
};

/** 工具栏配置 */
const toolbarButtons = [
    { label: "B", action: doBold },
    { label: "I", action: doItalic },
    { label: "H", action: doHeading },
    { label: "❝", action: doQuote },
    { label: "•", action: doList },
    { label: "<>", action: doCode },
    { icon: linkOutline, action: doLink },
    { icon: imageOutline, action: doImage },
] as Array<{ label?: string; icon?: string; action: () => void }>;
</script>

<template>
  <div class="md-editor-root">
    <!-- 工具栏 -->
    <div class="toolbar">
      <button
        v-for="btn in toolbarButtons"
        :key="btn.label || 'icon'"
        class="tool-btn"
        @click="btn.action"
      >
        <template v-if="btn.label">{{ btn.label }}</template>
        <ion-icon v-if="btn.icon" :icon="btn.icon" />
      </button>
    </div>

    <!-- 编辑区（可滚动 wrapper，textarea 在内自由撑高） -->
    <div class="textarea-scroll">
      <IonTextarea
        ref="textareaRef"
        v-model="content"
        :auto-grow="true"
        :placeholder="props.placeholder"
        class="editor-textarea"
      />
    </div>
  </div>
</template>

<style scoped>
.md-editor-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

/* 工具栏：单行横向滚动 */
.toolbar {
  flex-shrink: 0;
  display: flex;
  gap: 4px;
  padding: 6px var(--z-space-sm);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-bottom: 1px solid var(--z-border);
  background: #fff;
}
.toolbar::-webkit-scrollbar {
  display: none;
}

/* 工具栏按钮 */
.tool-btn {
  flex-shrink: 0;
  min-width: 36px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  border: 1px solid var(--z-border);
  border-radius: 6px;
  background: var(--z-bg-surface);
  color: var(--z-text-primary);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
.tool-btn:active {
  background: var(--z-primary);
  color: #fff;
  border-color: var(--z-primary);
}
/* 图标按钮：ion-icon 尺寸 */
.tool-btn ion-icon {
  font-size: 18px;
}

/* 可滚动 wrapper：撑满工具栏下方剩余空间，内容溢出时滚动 */
.textarea-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 编辑区 */
.editor-textarea {
  --padding-start: var(--z-space-md);
  --padding-end: var(--z-space-md);
  --padding-top: var(--z-space-sm);
  --padding-bottom: var(--z-space-sm);
  --background: #fff;
  --color: var(--z-text-primary);
  --placeholder-color: var(--z-text-disabled);
  --highlight-color-focused: transparent;
  font-size: 15px;
  line-height: 1.6;
  font-family: ui-monospace, "SF Mono", "Menlo", monospace;
}

/* 穿透 Shadow DOM 给原生 textarea 设置光标颜色 */
.editor-textarea::part(native) {
  caret-color: #ff6900;
}
</style>