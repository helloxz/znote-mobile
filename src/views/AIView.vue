<script setup lang="ts">
/**
 * AI 对话视图（移动端）
 *
 * 顶部固定栏：左返回 + 中标题"与AI对话吧" + 右[汉堡菜单 + 新对话]
 * 主体：消息区 + 输入区。会话列表以左侧抽屉形式展示。
 * SSE 流式对话，支持多轮对话和会话管理（参考 web 端 AIView.vue，适配移动端）。
 *
 * 与 web 端核心差异：
 * - 地址拼接用 getServerUrl()（非 VITE_API_URL）
 * - Token 用 getToken()（非 localStorage）
 * - 默认笔记本用 getActiveNotebookId()（非 localStorage）
 * - 提示用 useToast()（非 naive-ui useMessage）
 * - 抽屉用 Teleport + Transition（非 naive-ui NDrawer）
 * - 图标用 ion-icon + ionicons（非 ZIcon）
 * - 样式用 scoped CSS + --z-* 变量（非 Tailwind）
 */
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { IonPage, IonIcon, IonSpinner } from "@ionic/vue";
import { IncremarkContent, ThemeProvider } from "@incremark/vue";
import type { DesignTokens } from "@incremark/theme";
import "@incremark/theme/styles.css";
import {
  chevronBack,
  menuOutline,
  addOutline,
  sparklesOutline,
  trashOutline,
  arrowDownOutline,
  arrowUpOutline,
  bookOutline,
  chevronDownOutline,
  checkmarkOutline,
  stopCircleOutline,
  sendOutline,
  reloadOutline,
} from "ionicons/icons";
import {
  fetchThreads,
  fetchThreadDetail,
  deleteThread,
  fetchAIStatus,
  fetchTopNotebooks,
} from "@/api/ai";
import type { AIThread } from "@/api/ai";
import type { Notebook } from "@/types/note";
import { getToken, getServerUrl, getActiveNotebookId } from "@/services/storage";
import { useToast } from "@/composables/useToast";

const router = useRouter();
const { t } = useI18n();
const { showToast } = useToast();

/** 代码块主题：深色背景 + 亮色文字（与 MarkdownViewer.vue 一致） */
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

/** 工具调用信息 */
interface ToolCall {
  id: string;
  name: string;
  input?: any;
  inputText?: string;
  result?: any;
  status: "running" | "completed";
  _expanded?: boolean;
}

/** 对话消息 */
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
}

// ==================== 状态 ====================

const threads = ref<AIThread[]>([]);
const selectedThreadId = ref<string | null>(null);
const messages = ref<ChatMessage[]>([]);
const notebooks = ref<Notebook[]>([]);
const notebookId = ref<number | null>(null);
const inputMessage = ref("");
const isStreaming = ref(false);
const isSidebarOpen = ref(false);
const loadingThreads = ref(false);
const loadingMessages = ref(false);
const abortController = ref<AbortController | null>(null);

/** AI 功能启用状态：默认 true（避免首屏闪烁），请求完毕后按接口结果调整 */
const aiEnabled = ref(true);

/** 检查 AI 状态：失败静默降级，保持默认 true 不阻塞用户 */
const checkAIStatus = async () => {
  try {
    aiEnabled.value = await fetchAIStatus();
  } catch {
    aiEnabled.value = true;
  }
};

/** 返回上一页 */
const onBack = () => {
  router.back();
};

// ==================== 滚动控制 ====================

const messageContainer = ref<HTMLElement | null>(null);

/** 滚动到消息底部 */
const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
};

/** 滚动按钮可见性：顶部/底部按钮分别在不处于对应位置时显示 */
const showScrollToTop = ref(false);
const showScrollToBottom = ref(false);

const handleScroll = () => {
  if (!messageContainer.value) return;
  const { scrollTop, scrollHeight, clientHeight } = messageContainer.value;
  const hasOverflow = scrollHeight > clientHeight + 1;
  const distFromBottom = scrollHeight - scrollTop - clientHeight;
  // 不在顶部时显示「滚动到顶部」按钮
  showScrollToTop.value = hasOverflow && scrollTop > 50;
  // 不在底部时显示「滚动到底部」按钮
  showScrollToBottom.value = hasOverflow && distFromBottom > 50;
};

/** 平滑滚动到消息顶部 */
const onScrollToTop = () => {
  messageContainer.value?.scrollTo({ top: 0, behavior: "smooth" });
};

/** 平滑滚动到消息底部 */
const onScrollToBottom = () => {
  messageContainer.value?.scrollTo({
    top: messageContainer.value.scrollHeight,
    behavior: "smooth",
  });
};

// ==================== 笔记本选择器 ====================

/** 当前选中笔记本的标题（供 trigger 按钮展示） */
const currentNotebookTitle = computed(() => {
  const nb = notebooks.value.find((n) => n.id === notebookId.value);
  return nb?.title ?? "";
});

/** 笔记本下拉菜单：开合控制 + 点击外部关闭 + 选中即关闭 */
const showNotebookMenu = ref(false);
const notebookButtonRef = ref<HTMLElement | null>(null);
const notebookMenuRef = ref<HTMLElement | null>(null);

/** 点击外部关闭菜单（trigger 和 menu 内部的点击不触发） */
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as Node;
  if (notebookMenuRef.value?.contains(target)) return;
  if (notebookButtonRef.value?.contains(target)) return;
  showNotebookMenu.value = false;
};

/** 选中笔记本并关闭菜单 */
const handleSelectNotebook = (id: number) => {
  notebookId.value = id;
  showNotebookMenu.value = false;
};

// ==================== textarea 自动撑高 ====================

/** textarea 最大高度（约 3 行） */
const TEXTAREA_MAX_HEIGHT = 88;
const textareaRef = ref<HTMLTextAreaElement | null>(null);

/** 单一职责：设置 textarea 高度 */
const growTextarea = (el: HTMLTextAreaElement) => {
  el.style.height = "auto";
  const h = Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT);
  el.style.height = `${h}px`;
  el.style.overflowY = el.scrollHeight > TEXTAREA_MAX_HEIGHT ? "auto" : "hidden";
};

const autoGrow = (e: Event) => {
  growTextarea(e.target as HTMLTextAreaElement);
};

/** 监听 inputMessage 变化，程序化修改（如 send 后清空）时同步高度 */
watch(inputMessage, () => {
  if (textareaRef.value) growTextarea(textareaRef.value);
});

// ==================== 会话管理 ====================

/** 当前选中线程 */
const currentThread = computed(() =>
  threads.value.find((th) => th.id === selectedThreadId.value),
);

/** 是否有消息 */
const hasMessages = computed(() => messages.value.length > 0);

/** 加载会话列表 */
const loadThreads = async () => {
  loadingThreads.value = true;
  try {
    threads.value = await fetchThreads();
    threads.value.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    );
  } finally {
    loadingThreads.value = false;
  }
};

/** 加载笔记本列表 */
const loadNotebooks = async () => {
  notebooks.value = await fetchTopNotebooks();
};

/** 获取线程标题（首条消息截断或时间） */
const getThreadTitle = (thread: AIThread) => {
  if (thread.title) return thread.title;
  const d = new Date(thread.createdAt);
  return `${d.getMonth() + 1}/${d.getDate()} ${d
    .getHours()
    .toString()
    .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

/** 从 Mastra Memory 的结构化 content 中提取纯文本 */
const extractMessageContent = (
  content: string | { content?: string; parts?: { type: string; text?: string }[] },
): string => {
  if (typeof content === "string") return content;
  if (content?.content) return content.content;
  // format: 2 格式：parts 数组中 type:"text" 的条目拼接
  if (Array.isArray(content?.parts)) {
    return content.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text || "")
      .join("");
  }
  return "";
};

/** 新建对话：生成 16 位随机 thread_id */
const startNewThread = () => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  selectedThreadId.value = id;
  messages.value = [];
  isSidebarOpen.value = false;
};

/** 选中历史会话：拉取详情 → 填充消息列表 */
const selectThread = async (threadId: string) => {
  selectedThreadId.value = threadId;
  messages.value = [];
  loadingMessages.value = true;
  isSidebarOpen.value = false;

  try {
    const detail = await fetchThreadDetail(threadId);
    if (detail) {
      messages.value = detail.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: extractMessageContent(m.content),
        isStreaming: false,
      }));
    }
  } finally {
    loadingMessages.value = false;
    scrollToBottom();
  }
};

/** 删除会话 */
const handleDeleteThread = async (threadId: string, event: Event) => {
  event.stopPropagation();
  const ok = await deleteThread(threadId);
  if (ok) {
    threads.value = threads.value.filter((th) => th.id !== threadId);
    if (selectedThreadId.value === threadId) {
      selectedThreadId.value = null;
      messages.value = [];
    }
  }
};

// ==================== SSE 流式对话 ====================

/** 发送消息（内联 SSE 处理，直接操作 messages.value[index] 确保 Vue 响应式） */
const sendMessage = async () => {
  const text = inputMessage.value.trim();
  if (!text || isStreaming.value) return;
  if (!notebookId.value) return;

  // 隐式创建：首次发送时若无 thread 则自动生成
  if (!selectedThreadId.value) {
    startNewThread();
  }

  inputMessage.value = "";
  isStreaming.value = true;

  // 添加用户消息
  messages.value.push({
    id: `user-${Date.now()}`,
    role: "user",
    content: text,
  });

  // 添加 AI 消息占位
  messages.value.push({
    id: `ai-${Date.now()}`,
    role: "assistant",
    content: "",
    isStreaming: true,
  });
  const aiIndex = messages.value.length - 1;

  const controller = new AbortController();
  abortController.value = controller;

  // 移动端：从内存缓存同步读取服务器地址和 token（拦截器同步执行）
  const token = getToken();
  const BASE_URL = (getServerUrl() || "").replace(/\/+$/, "");

  try {
    const response = await fetch(`${BASE_URL}/api/user/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({
        notebook_id: notebookId.value,
        thread_id: selectedThreadId.value,
        message: text,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      let errMsg = `HTTP ${response.status}`;
      try {
        errMsg = JSON.parse(body).msg || errMsg;
      } catch {
        /* ignore */
      }
      messages.value[aiIndex].content = `❌ ${errMsg}`;
      messages.value[aiIndex].isStreaming = false;
      isStreaming.value = false;
      showToast(errMsg);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      messages.value[aiIndex].content = `❌ ${t("ai.error.stream_failed")}`;
      messages.value[aiIndex].isStreaming = false;
      isStreaming.value = false;
      showToast(t("ai.error.stream_failed"));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6);
        if (raw === "[DONE]") continue;

        try {
          const chunk = JSON.parse(raw);

          // 工具调用开始（参数流式输入）
          if (chunk.type === "tool-call-input-streaming-start") {
            const msgRef = messages.value[aiIndex];
            if (!msgRef.toolCalls) msgRef.toolCalls = [];
            msgRef.toolCalls.push({
              id: chunk.payload?.toolCallId || "",
              name: chunk.payload?.toolName || "unknown",
              inputText: "",
              status: "running",
            });
            scrollToBottom();
          }
          // 工具调用参数增量
          else if (chunk.type === "tool-call-delta") {
            const tc = messages.value[aiIndex].toolCalls?.find(
              (tcItem: ToolCall) => tcItem.id === chunk.payload?.toolCallId,
            );
            if (tc) {
              tc.inputText =
                (tc.inputText || "") + (chunk.payload?.argsTextDelta || "");
            }
          }
          // 工具调用参数完整
          else if (chunk.type === "tool-call") {
            const tc = messages.value[aiIndex].toolCalls?.find(
              (tcItem: ToolCall) => tcItem.id === chunk.payload?.toolCallId,
            );
            if (tc && chunk.payload?.args) {
              tc.input = chunk.payload.args;
            }
          }
          // 工具执行结果
          else if (chunk.type === "tool-result") {
            const tc = messages.value[aiIndex].toolCalls?.find(
              (tcItem: ToolCall) => tcItem.id === chunk.payload?.toolCallId,
            );
            if (tc) {
              tc.status = "completed";
              tc.result = chunk.payload?.result || chunk.payload;
            }
            scrollToBottom();
          }
          // 文本增量
          else if (chunk.type === "text-delta" && chunk.payload?.text) {
            messages.value[aiIndex].content += chunk.payload.text;
            scrollToBottom();
          }
          // 对话结束
          else if (chunk.type === "finish") {
            messages.value[aiIndex].isStreaming = false;
            isStreaming.value = false;
            scrollToBottom();
            loadThreads();
            return;
          }
          // 错误事件
          else if (chunk.type === "error") {
            if (messages.value[aiIndex].content === "") {
              messages.value[aiIndex].content = `❌ ${chunk.error || t("ai.error.network")}`;
            }
            messages.value[aiIndex].isStreaming = false;
            isStreaming.value = false;
            return;
          }
        } catch {
          /* 忽略非 JSON 行 */
        }
      }
    }
  } catch (err: any) {
    if (err.name !== "AbortError") {
      if (messages.value[aiIndex].content === "") {
        messages.value[aiIndex].content = `❌ ${err.message || t("ai.error.network")}`;
      }
      messages.value[aiIndex].isStreaming = false;
      isStreaming.value = false;
      showToast(t("ai.error.network"));
    }
  } finally {
    messages.value[aiIndex].isStreaming = false;
    isStreaming.value = false;
    scrollToBottom();
  }
};

/** 停止生成 */
const stopStreaming = () => {
  abortController.value?.abort();
  const lastMsg = messages.value[messages.value.length - 1];
  if (lastMsg?.isStreaming) {
    lastMsg.isStreaming = false;
  }
  isStreaming.value = false;
};

/** 键盘事件：Enter 发送，Shift+Enter 换行 */
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

/** 格式化工具结果（截断过长内容） */
const formatToolResult = (result: any): string => {
  if (typeof result === "string") {
    return result.length > 500 ? result.slice(0, 500) + "..." : result;
  }
  const str = JSON.stringify(result, null, 2);
  return str.length > 500 ? str.slice(0, 500) + "..." : str;
};

// ==================== 生命周期 ====================

/** 监听线程切换，自动滚动 */
watch(selectedThreadId, () => {
  scrollToBottom();
});

onMounted(async () => {
  document.addEventListener("click", handleClickOutside);

  // 异步检查 AI 启用状态（不 await，不阻塞其他初始化）
  checkAIStatus();

  await Promise.all([loadThreads(), loadNotebooks()]);

  // 从内存缓存读取当前激活的笔记本 id（移动端持久化在 preferences）
  const savedId = getActiveNotebookId();
  if (savedId !== null && notebooks.value.some((nb) => nb.id === savedId)) {
    notebookId.value = savedId;
  } else if (notebooks.value.length > 0) {
    notebookId.value = notebooks.value[0].id;
  }

  // 绑定消息区滚动事件（被动监听，不阻塞滚动）
  messageContainer.value?.addEventListener("scroll", handleScroll, {
    passive: true,
  });
  handleScroll();
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  messageContainer.value?.removeEventListener("scroll", handleScroll);
  // 离开页面时中止未完成的流式请求
  abortController.value?.abort();
});
</script>

<template>
  <ion-page>
    <!-- ============ 顶部栏：左[返回+汉堡] + 中标题 + 右新对话 ============ -->
    <div class="custom-header">
      <div class="title-row">
        <div class="action-btns">
          <button class="icon-btn" @click="onBack">
            <ion-icon :icon="chevronBack" />
          </button>
          <button class="icon-btn" @click="isSidebarOpen = true">
            <ion-icon :icon="menuOutline" />
          </button>
        </div>
        <span class="title-text">{{ t("ai.chat.title") }}</span>
        <button class="icon-btn" @click="startNewThread">
          <ion-icon :icon="addOutline" />
        </button>
      </div>
    </div>

    <!-- ============ 主体 ============ -->
    <!-- AI 未启用：完全替换内容，只显示禁用提示 -->
    <div v-if="!aiEnabled" class="disabled-wrap">
      <ion-icon :icon="sparklesOutline" class="disabled-icon" />
      <div class="disabled-title">{{ t("ai.disabled.title") }}</div>
      <div class="disabled-desc">{{ t("ai.disabled.description") }}</div>
    </div>

    <!-- AI 启用：消息区 + 输入区（flex 三段式：header 占位 + 消息区 + 输入区） -->
    <template v-else>
      <div class="ai-main">
        <!-- 消息区（flex:1，自身滚动，scrollToBottom 与 scroll 事件直接操作此容器） -->
        <div ref="messageContainer" class="message-area">
          <div class="message-inner">
            <!-- 加载历史消息 -->
            <div v-if="loadingMessages" class="state-wrap">
              <ion-spinner name="crescent" class="spinner" />
            </div>

            <!-- 欢迎引导 -->
            <div v-else-if="!hasMessages" class="welcome-wrap">
              <ion-icon :icon="sparklesOutline" class="welcome-icon" />
              <div class="welcome-title">{{ t("ai.chat.title") }}</div>
              <div class="welcome-desc">{{ t("ai.chat.empty") }}</div>
            </div>

            <!-- 消息列表 -->
            <div v-else class="message-list">
              <div
                v-for="msg in messages"
                :key="msg.id"
                class="message-row"
                :class="msg.role === 'user' ? 'is-user' : 'is-ai'"
              >
                <!-- 用户消息 -->
                <div v-if="msg.role === 'user'" class="user-bubble">
                  {{ msg.content }}
                </div>

                <!-- AI 消息 -->
                <div v-else class="ai-bubble">
                  <!-- 工具调用展示 -->
                  <div
                    v-if="msg.toolCalls && msg.toolCalls.length > 0"
                    class="tool-list"
                  >
                    <div
                      v-for="tool in msg.toolCalls"
                      :key="tool.id"
                      class="tool-item"
                    >
                      <div
                        class="tool-header"
                        @click="tool._expanded = !tool._expanded"
                      >
                        <ion-icon
                          :icon="tool.status === 'running' ? reloadOutline : checkmarkOutline"
                          class="tool-status-icon"
                          :class="tool.status === 'running' ? 'spin' : 'tool-done'"
                        />
                        <span class="tool-name">{{ tool.name }}</span>
                        <span class="tool-status-text">
                          {{
                            tool.status === "running"
                              ? t("ai.tool.running")
                              : t("ai.tool.completed")
                          }}
                        </span>
                        <ion-icon
                          :icon="chevronDownOutline"
                          class="tool-arrow"
                          :class="{ rotated: tool._expanded }"
                        />
                      </div>
                      <!-- 工具详情（可折叠） -->
                      <div v-if="tool._expanded" class="tool-detail">
                        <!-- 输入参数 -->
                        <div v-if="tool.input || tool.inputText" class="tool-section">
                          <div class="tool-section-label">
                            {{ t("ai.tool.input") }}
                          </div>
                          <pre class="tool-pre">{{
                            tool.input
                              ? JSON.stringify(tool.input, null, 2)
                              : tool.inputText
                          }}</pre>
                        </div>
                        <!-- 执行结果 -->
                        <div v-if="tool.result" class="tool-section">
                          <div class="tool-section-label">
                            {{ t("ai.tool.result") }}
                          </div>
                          <!-- 标准格式：{ context, sources } → context 用 Incremark 渲染 -->
                          <template v-if="tool.result.context">
                            <div class="ai-markdown">
                              <ThemeProvider :theme="codeTheme">
                                <IncremarkContent
                                  :content="tool.result.context"
                                  :is-finished="true"
                                />
                              </ThemeProvider>
                            </div>
                            <div
                              v-if="tool.result.sources?.length"
                              class="tool-sources"
                            >
                              <div class="tool-sources-label">Sources</div>
                              <ul class="tool-sources-list">
                                <li
                                  v-for="s in tool.result.sources"
                                  :key="s.id"
                                >
                                  {{ s.title }}
                                  <span class="tool-source-id">#{{ s.id }}</span>
                                </li>
                              </ul>
                            </div>
                          </template>
                          <!-- 非标准格式兼容 -->
                          <pre v-else class="tool-pre">{{
                            formatToolResult(tool.result)
                          }}</pre>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 消息内容（IncremarkContent 实时渲染） -->
                  <template v-if="msg.content">
                    <div class="ai-markdown">
                      <ThemeProvider :theme="codeTheme">
                        <IncremarkContent
                          :content="msg.content"
                          :is-finished="!msg.isStreaming"
                          :incremark-options="{
                            typewriter: { enabled: msg.isStreaming },
                          }"
                        />
                      </ThemeProvider>
                    </div>
                  </template>
                  <!-- 流式占位动画（无内容时） -->
                  <template v-else-if="msg.isStreaming">
                    <div class="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </template>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <!-- ============ 滚动控制按钮（输入框上方右侧，垂直叠放） ============ -->
      <Transition name="scroll-nav-fade">
        <div v-if="showScrollToTop || showScrollToBottom" class="scroll-nav">
          <button
            v-if="showScrollToTop"
            class="scroll-nav-btn"
            :title="t('ai.scroll_to_top')"
            @click="onScrollToTop"
          >
            <ion-icon :icon="arrowUpOutline" />
          </button>
          <button
            v-if="showScrollToBottom"
            class="scroll-nav-btn"
            :title="t('ai.scroll_to_bottom')"
            @click="onScrollToBottom"
          >
            <ion-icon :icon="arrowDownOutline" />
          </button>
        </div>
      </Transition>

      <!-- ============ 输入区（固定底部，脱离文档流，键盘友好） ============ -->
      <div class="input-area">
        <div class="input-box">
          <!-- textarea -->
          <textarea
            ref="textareaRef"
            v-model="inputMessage"
            :placeholder="t('ai.chat.input_placeholder')"
            :disabled="!notebookId"
            rows="1"
            class="input-textarea"
            @input="autoGrow"
            @keydown="handleKeydown"
          ></textarea>

          <!-- 下排操作按钮 -->
          <div class="input-actions">
            <!-- 笔记本选择器 -->
            <div ref="notebookButtonRef" class="notebook-selector">
              <button
                type="button"
                class="notebook-trigger"
                :class="{ 'is-empty': !notebookId }"
                @click.stop="showNotebookMenu = !showNotebookMenu"
              >
                <ion-icon :icon="bookOutline" />
                <span class="notebook-trigger-text">
                  {{ currentNotebookTitle || t("ai.chat.select_notebook") }}
                </span>
                <ion-icon
                  :icon="chevronDownOutline"
                  class="notebook-trigger-arrow"
                  :class="{ rotated: showNotebookMenu }"
                />
              </button>

              <Transition name="ai-menu">
                <div
                  v-if="showNotebookMenu"
                  ref="notebookMenuRef"
                  class="notebook-menu"
                >
                  <button
                    v-for="nb in notebooks"
                    :key="nb.id"
                    type="button"
                    class="notebook-option"
                    :class="{ 'is-active': notebookId === nb.id }"
                    @click="handleSelectNotebook(nb.id)"
                  >
                    <ion-icon :icon="bookOutline" />
                    <span class="notebook-option-text">{{ nb.title }}</span>
                    <ion-icon
                      v-if="notebookId === nb.id"
                      :icon="checkmarkOutline"
                      class="notebook-option-check"
                    />
                  </button>
                </div>
              </Transition>
            </div>

            <!-- 发送/停止按钮 -->
            <button
              v-if="isStreaming"
              class="send-btn is-stop"
              :title="t('ai.stop')"
              @click="stopStreaming"
            >
              <ion-icon :icon="stopCircleOutline" />
            </button>
            <button
              v-else
              class="send-btn"
              :class="{ 'is-active': notebookId && inputMessage.trim().length >= 2 }"
              :disabled="!notebookId || inputMessage.trim().length < 2"
              @click="sendMessage"
            >
              <ion-icon :icon="sendOutline" />
            </button>
          </div>
        </div>
        <!-- 免责声明 -->
        <p class="disclaimer">{{ t("ai.chat.disclaimer") }}</p>
      </div>
    </template>

    <!-- ============ 会话列表抽屉（左侧滑出） ============ -->
    <Teleport to="body">
      <!-- 遮罩层 -->
      <Transition name="drawer-fade">
        <div v-if="isSidebarOpen" class="drawer-overlay" @click="isSidebarOpen = false" />
      </Transition>
      <!-- 抽屉面板 -->
      <Transition name="drawer-slide">
        <div v-if="isSidebarOpen" class="drawer-panel">
          <div class="drawer-header">
            <span class="drawer-title">{{ t("ai.chat.title") }}</span>
            <button class="drawer-close" @click="isSidebarOpen = false">
              <ion-icon :icon="chevronBack" />
            </button>
          </div>
          <div class="drawer-body">
            <div v-if="loadingThreads" class="drawer-loading">
              <ion-spinner name="crescent" class="spinner" />
            </div>
            <div v-else-if="threads.length === 0" class="drawer-empty">
              {{ t("ai.chat.no_threads") }}
            </div>
            <div v-else class="thread-list">
              <div
                v-for="thread in threads"
                :key="thread.id"
                class="thread-item"
                :class="{ 'is-active': selectedThreadId === thread.id }"
                @click="selectThread(thread.id)"
              >
                <span class="thread-title">{{ getThreadTitle(thread) }}</span>
                <button
                  class="thread-delete"
                  :title="t('ai.chat.delete_thread')"
                  @click="handleDeleteThread(thread.id, $event)"
                >
                  <ion-icon :icon="trashOutline" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ion-page>
</template>

<style scoped>
/* ============ 顶部栏（复用 NoteDetailView 模式） ============ */
.custom-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  background: var(--z-bg-page);
  border-bottom: 1px solid var(--z-border);
  padding-top: var(--z-safe-area-top);
}

.title-row {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 var(--z-space-xs);
}

.title-text {
  flex: 1;
  text-align: center;
  font-size: var(--z-fs-body);
  font-weight: 600;
  color: var(--z-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-btn {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0;
  color: var(--z-text-primary);
}

.icon-btn ion-icon {
  font-size: 22px;
}

.icon-btn:active {
  opacity: 0.5;
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* ============ 主体容器（flex 三段式：header 下方占满，输入区 fixed） ============ */
/* 用 fixed 定位撑满 header 下方区域，内部 flex column 让消息区可独立滚动 */
.ai-main {
  position: fixed;
  top: calc(48px + var(--z-safe-area-top));
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: var(--z-bg-page);
}

/* ============ AI 未启用提示页 ============ */
.disabled-wrap {
  position: fixed;
  top: calc(48px + var(--z-safe-area-top));
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 var(--z-space-lg);
  text-align: center;
  background: var(--z-bg-page);
}

.disabled-icon {
  font-size: 72px;
  color: var(--z-text-disabled);
  margin-bottom: var(--z-space-md);
}

.disabled-title {
  font-size: var(--z-fs-body-lg);
  font-weight: 500;
  color: var(--z-text-primary);
}

.disabled-desc {
  margin-top: var(--z-space-xs);
  max-width: 18rem;
  font-size: var(--z-fs-caption);
  color: var(--z-text-tertiary);
  line-height: 1.5;
}

/* ============ 消息区（flex:1，自身滚动） ============ */
.message-area {
  position: relative;
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-top: var(--z-space-md);
}

.message-inner {
  max-width: 100%;
  margin: 0 auto;
  padding: 0 var(--z-space-md);
  display: flex;
  flex-direction: column;
  /* 至少撑满消息区高度，让欢迎引导在无消息时垂直居中 */
  min-height: 100%;
}

/* 加载/状态占位 */
.state-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 4rem 0;
}

.spinner {
  color: var(--z-primary);
}

/* 欢迎引导 */
.welcome-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  padding: 2rem 0;
}

.welcome-icon {
  font-size: 72px;
  color: var(--z-primary);
  margin-bottom: var(--z-space-md);
}

.welcome-title {
  font-size: var(--z-fs-body-lg);
  font-weight: 500;
  color: var(--z-text-primary);
}

.welcome-desc {
  margin-top: var(--z-space-xs);
  font-size: var(--z-fs-caption);
  color: var(--z-text-tertiary);
}

/* 消息列表 */
.message-list {
  display: flex;
  flex-direction: column;
  gap: var(--z-space-md);
  /* 底部留白：避免最后一条消息被 fixed 输入区遮挡（输入区高度约 140px + 安全区） */
  padding-bottom: calc(140px + env(safe-area-inset-bottom));
}

.message-row {
  display: flex;
}

.message-row.is-user {
  justify-content: flex-end;
}

.message-row.is-ai {
  justify-content: flex-start;
}

/* 用户消息气泡 */
.user-bubble {
  max-width: 85%;
  padding: var(--z-space-sm) var(--z-space-md);
  border-radius: 1rem;
  border-bottom-right-radius: 0.375rem;
  background: var(--ion-color-primary, #3b82f6);
  color: #fff;
  font-size: var(--z-fs-body);
  line-height: 1.6;
  word-break: break-word;
}

/* AI 消息气泡 */
.ai-bubble {
  width: 100%;
  margin-bottom: 2rem;
  padding: var(--z-space-sm) var(--z-space-md);
  border-radius: 1rem;
  border: 1px solid var(--z-border);
  background: var(--z-bg-surface);
  font-size: var(--z-fs-body);
  line-height: 1.6;
  color: var(--z-text-primary);
  box-shadow: var(--z-shadow-xs);
}

/* ============ 工具调用展示 ============ */
.tool-list {
  margin-bottom: var(--z-space-sm);
}

.tool-item {
  margin-bottom: var(--z-space-xs);
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--z-space-xs) var(--z-space-sm);
  border-radius: var(--z-radius-sm);
  background: var(--z-bg-page);
  font-size: var(--z-fs-caption);
  cursor: pointer;
}

.tool-status-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.tool-status-icon.tool-done {
  color: #22c55e;
}

.tool-status-icon.spin {
  color: var(--ion-color-primary, #3b82f6);
  animation: z-spin 0.8s linear infinite;
}

@keyframes z-spin {
  to {
    transform: rotate(360deg);
  }
}

.tool-name {
  font-weight: 500;
  color: var(--z-text-secondary);
}

.tool-status-text {
  color: var(--z-text-tertiary);
}

.tool-arrow {
  margin-left: auto;
  font-size: 14px;
  color: var(--z-text-tertiary);
  transition: transform 0.2s;
}

.tool-arrow.rotated {
  transform: rotate(180deg);
}

.tool-detail {
  margin-top: 4px;
  padding: var(--z-space-sm);
  border-radius: var(--z-radius-sm);
  background: var(--z-bg-page);
  max-height: 15rem;
  overflow: auto;
  font-size: var(--z-fs-caption);
}

.tool-section {
  margin-bottom: var(--z-space-xs);
}

.tool-section:last-child {
  margin-bottom: 0;
}

.tool-section-label {
  margin-bottom: 4px;
  font-weight: 500;
  color: var(--z-text-tertiary);
}

.tool-pre {
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--z-text-secondary);
  font-family: monospace;
  font-size: var(--z-fs-caption);
}

/* 工具结果来源列表 */
.tool-sources {
  margin-top: var(--z-space-xs);
}

.tool-sources-label {
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--z-text-tertiary);
  text-transform: uppercase;
}

.tool-sources-list {
  list-style: disc inside;
  color: var(--z-text-tertiary);
  font-size: var(--z-fs-caption);
}

.tool-sources-list li {
  margin-bottom: 2px;
}

.tool-source-id {
  color: var(--z-text-disabled);
}

/* ============ 流式占位动画 ============ */
.typing-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--z-text-tertiary);
}

.typing-dots span {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--z-text-tertiary);
  animation: z-dot 1.2s infinite ease-in-out;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes z-dot {
  0%,
  80%,
  100% {
    opacity: 0.3;
  }
  40% {
    opacity: 1;
  }
}

/* ============ 滚动控制按钮（输入框上方右侧，垂直叠放） ============ */
.scroll-nav {
  position: fixed;
  bottom: calc(140px + env(safe-area-inset-bottom));
  right: 20px;
  z-index: 15;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.scroll-nav-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--z-border);
  background: var(--z-bg-surface);
  color: var(--z-text-secondary);
  box-shadow: var(--z-shadow-sm);
  padding: 0;
}

.scroll-nav-btn ion-icon {
  font-size: 18px;
}

.scroll-nav-btn:active {
  opacity: 0.6;
}

/* 滚动按钮整体淡入淡出 */
.scroll-nav-fade-enter-active,
.scroll-nav-fade-leave-active {
  transition: opacity 0.2s ease;
}

.scroll-nav-fade-enter-from,
.scroll-nav-fade-leave-to {
  opacity: 0;
}

/* ============ 输入区 ============ */
.input-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  border-top: 1px solid var(--z-border);
  background: var(--z-bg-page);
  padding: var(--z-space-sm) var(--z-space-md);
  padding-bottom: calc(var(--z-space-sm) + env(safe-area-inset-bottom));
}

.input-box {
  border: 1px solid var(--z-border);
  border-radius: var(--z-radius-lg);
  background: var(--z-bg-surface);
  padding: 6px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-box:focus-within {
  border-color: var(--z-primary);
  box-shadow: 0 0 0 1px var(--z-primary);
}

.input-textarea {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  padding: 4px 8px;
  font-size: var(--z-fs-body);
  line-height: 1.5;
  color: var(--z-text-primary);
  outline: none;
  resize: none;
  max-height: 88px;
}

.input-textarea::placeholder {
  color: var(--z-text-disabled);
}

.input-textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

/* 笔记本选择器 */
.notebook-selector {
  position: relative;
  flex-shrink: 0;
}

.notebook-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 var(--z-space-xs);
  background: transparent;
  border: none;
  font-size: var(--z-fs-caption);
  color: var(--z-text-primary);
}

.notebook-trigger.is-empty {
  color: #d97706;
}

.notebook-trigger ion-icon {
  font-size: 16px;
}

.notebook-trigger-text {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notebook-trigger-arrow {
  font-size: 14px;
  transition: transform 0.2s;
}

.notebook-trigger-arrow.rotated {
  transform: rotate(180deg);
}

/* 笔记本下拉菜单 */
.notebook-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  z-index: 50;
  margin-bottom: 4px;
  min-width: 180px;
  border-radius: var(--z-radius-md);
  border: 1px solid var(--z-border);
  background: var(--z-bg-surface);
  box-shadow: var(--z-shadow-sm);
  padding: 4px 0;
}

.notebook-option {
  display: flex;
  align-items: center;
  gap: var(--z-space-xs);
  width: 100%;
  padding: 6px var(--z-space-sm);
  text-align: left;
  background: transparent;
  border: none;
  font-size: var(--z-fs-caption);
  color: var(--z-text-primary);
}

.notebook-option.is-active {
  color: var(--z-primary);
}

.notebook-option ion-icon {
  font-size: 15px;
  flex-shrink: 0;
}

.notebook-option-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notebook-option-check {
  font-size: 14px;
  flex-shrink: 0;
}

.ai-menu-enter-active,
.ai-menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.ai-menu-enter-from,
.ai-menu-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* 发送/停止按钮 */
.send-btn {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: none;
  background: var(--z-bg-page);
  color: var(--z-text-disabled);
}

.send-btn ion-icon {
  font-size: 16px;
}

.send-btn.is-active {
  background: var(--z-primary);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.send-btn.is-stop {
  background: #ef4444;
  color: #fff;
}

.send-btn:disabled {
  cursor: not-allowed;
}

/* 免责声明 */
.disclaimer {
  margin-top: var(--z-space-xs);
  text-align: center;
  font-size: 11px;
  color: var(--z-text-tertiary);
}

/* ============ 会话列表抽屉 ============ */
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.4);
}

.drawer-panel {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 101;
  width: 280px;
  max-width: 80vw;
  display: flex;
  flex-direction: column;
  background: var(--z-bg-page);
  box-shadow: var(--z-shadow-lg);
  padding-top: var(--z-safe-area-top);
}

.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.25s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.25s ease;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(-100%);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 var(--z-space-sm);
  border-bottom: 1px solid var(--z-border);
}

.drawer-title {
  font-size: var(--z-fs-body);
  font-weight: 600;
  color: var(--z-text-primary);
}

.drawer-close {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--z-text-primary);
}

.drawer-close ion-icon {
  font-size: 20px;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--z-space-sm);
}

.drawer-loading {
  display: flex;
  justify-content: center;
  padding: var(--z-space-lg) 0;
}

.drawer-empty {
  padding: var(--z-space-lg) 0;
  text-align: center;
  font-size: var(--z-fs-caption);
  color: var(--z-text-tertiary);
}

.thread-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.thread-item {
  display: flex;
  align-items: center;
  padding: var(--z-space-sm);
  border-radius: var(--z-radius-sm);
  cursor: pointer;
  transition: background 0.15s;
}

.thread-item.is-active {
  background: var(--z-bg-surface);
}

.thread-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--z-fs-caption);
  color: var(--z-text-primary);
}

.thread-delete {
  flex-shrink: 0;
  margin-left: 4px;
  padding: 4px;
  background: transparent;
  border: none;
  color: var(--z-text-tertiary);
}

.thread-delete ion-icon {
  font-size: 14px;
}
</style>

<!-- AI Markdown 内容排版样式（非 scoped，作用到 incremark 渲染的 DOM） -->
<style>
/* 复用 MarkdownViewer.vue 的 .doc-content 排版风格，保证跨端一致 */
.ai-markdown {
  line-height: 1.75;
  color: var(--z-text-primary, #334155);
  overflow-wrap: break-word;
  /* 允许长按选择文本（与笔记预览页 MarkdownViewer.vue 一致） */
  user-select: text;
  -webkit-user-select: text;
}

.ai-markdown h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  color: var(--z-text-primary, #0f172a);
}

.ai-markdown h2 {
  font-size: 1.4rem;
  font-weight: 600;
  margin-top: 1.75rem;
  margin-bottom: 0.5rem;
  color: var(--z-text-primary, #1e293b);
  padding-bottom: 0.3rem;
  border-bottom: 1px solid var(--z-border, #e2e8f0);
}

.ai-markdown h3 {
  font-size: 1.15rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--z-text-secondary, #334155);
}

.ai-markdown h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--z-text-secondary, #475569);
}

.ai-markdown p {
  margin-bottom: 0.75rem;
}

.ai-markdown ul,
.ai-markdown ol {
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
}

.ai-markdown ul {
  list-style-type: disc;
}

.ai-markdown ul ul {
  list-style-type: circle;
}

.ai-markdown ul ul ul {
  list-style-type: square;
}

.ai-markdown ol {
  list-style-type: decimal;
}

.ai-markdown li {
  margin-bottom: 0.25rem;
}

.ai-markdown a {
  color: #2563eb;
  text-decoration: underline;
}

.ai-markdown blockquote {
  padding-left: 1rem;
  margin: 1rem 0;
  color: var(--z-text-tertiary, #64748b);
  overflow-wrap: break-word;
  word-break: break-word;
}

.ai-markdown table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 1rem 0;
  border: 1px solid var(--z-border, #e2e8f0);
  border-radius: 8px;
  overflow: hidden;
}

.ai-markdown th,
.ai-markdown td {
  border-bottom: 1px solid var(--z-border, #e2e8f0);
  border-right: 1px solid var(--z-border, #e2e8f0);
  padding: 0.5rem 0.75rem;
  text-align: left;
  background: transparent;
}

.ai-markdown th:last-child,
.ai-markdown td:last-child {
  border-right: none;
}

.ai-markdown tbody tr:last-child th,
.ai-markdown tbody tr:last-child td {
  border-bottom: none;
}

.ai-markdown th {
  background: var(--z-bg-surface, #f8fafc);
  font-weight: 600;
}

.ai-markdown img {
  max-width: 100%;
  border-radius: 0.375rem;
}

/* 移动端：表格横向滚动 */
@media (max-width: 767px) {
  .ai-markdown table {
    display: block;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
  }
  .ai-markdown th,
  .ai-markdown td {
    white-space: nowrap;
  }
}

/* incremark 渲染内容图片自适应 */
.ai-markdown .incremark-content img {
  max-width: 100%;
  border-radius: 0.5rem;
}

/* 聊天区代码块复制按钮 hover 样式 */
.ai-markdown .incremark-code .code-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
