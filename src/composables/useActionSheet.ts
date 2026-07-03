import { ref } from "vue";
import { restoreAppScroll } from "@/composables/useOverlayRestore";
import type { ActionSheetButton } from "@/components/note/ActionSheet.vue";

export interface ActionSheetOptions {
  /** 面板标题（可选，如笔记标题、分类名等） */
  header?: string;
  /** 操作按钮列表 */
  buttons: ActionSheetButton[];
  /** 取消按钮文案（可选，默认使用 i18n note.settings.cancel） */
  cancelText?: string;
}

/**
 * 全局 Action Sheet 的 Composable。
 *
 * 用法：
 * ```ts
 * const { showActionSheet } = useActionSheet();
 * const role = await showActionSheet({
 *   header: "笔记标题",
 *   buttons: [
 *     { text: "置顶", role: "pin" },
 *     { text: "删除", role: "delete", danger: true },
 *     { text: "取消", role: "cancel" },
 *   ],
 * });
 * // role 为选中按钮的 role，点击遮罩返回 undefined
 * ```
 */
export function useActionSheet() {
  const show = ref(false);
  const options = ref<ActionSheetOptions>({ buttons: [] });

  /** 当前等待的 Promise resolve */
  let resolvePromise: ((role: string | undefined) => void) | null = null;

  /**
   * 弹出底部操作面板
   * @returns 选中按钮的 role，或点击遮罩/取消时返回 undefined
   */
  const showActionSheet = (opts: ActionSheetOptions): Promise<string | undefined> => {
    return new Promise((resolve) => {
      resolvePromise = resolve;
      options.value = opts;
      show.value = true;
    });
  };

  /** 选中某个操作项 */
  const onSelect = (role: string) => {
    show.value = false;
    if (resolvePromise) {
      resolvePromise(role);
      resolvePromise = null;
    }
    restoreScroll();
  };

  /** 关闭面板（点击遮罩或取消按钮） */
  const onClose = () => {
    show.value = false;
    if (resolvePromise) {
      resolvePromise(undefined);
      resolvePromise = null;
    }
    restoreScroll();
  };

  /**
   * 强制清理 Ionic overlay dismiss 后可能残留的滚动锁/布局状态。
   *
   * 根因：Ionic overlay present 时会给 body 加 "backdrop-no-scroll" 等临时样式，
   * dismiss 时偶尔清理不彻底（特别是在 iOS PWA + touch 序列中途弹 overlay 的场景），
   * 导致后续页面滚动或 fixed header 占位计算出错。此处调用公共恢复函数兜底。
   */
  const restoreScroll = () => {
    restoreAppScroll();
  };

  return {
    show,
    options,
    showActionSheet,
    onSelect,
    onClose,
  };
}