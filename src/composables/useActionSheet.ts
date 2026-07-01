import { ref } from "vue";
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
   * 强制清理 Ionic overlay dismiss 后可能残留的滚动锁。
   *
   * 根因（@ionic/core 8.8 源码确认）：
   * actionSheet present 时给 document.body 加 class "backdrop-no-scroll"，
   * 对应 CSS `body.backdrop-no-scroll{overflow:hidden}`。dismiss 时只有当
   * "当前 overlay 是最后一个锁根 overlay"才 remove 该 class；长按手势在 touch
   * 序列中途弹 overlay 的场景容易触发条件不满足，导致 class 残留 → body 永远
   * overflow:hidden → 笔记列表无法滚动。
   *
   * 此函数作为安全兜底，确保 Ionic 内部 cleanup 先执行后再清理残留。
   */
  const restoreScroll = () => {
    requestAnimationFrame(() => {
      // 1. body 上的 backdrop-no-scroll（最关键，actionSheet 的真正锁）
      document.body.classList.remove("backdrop-no-scroll");
      document.body.style.removeProperty("overflow");

      // 2. view container 的 aria-hidden（present 时 setRootAriaHidden(true) 的残留）
      const appRoot = document.querySelector("ion-app") || document.body;
      const viewContainer = appRoot.querySelector(
        "ion-router-outlet, #ion-view-container-root"
      );
      if (viewContainer) {
        viewContainer.removeAttribute("aria-hidden");
        viewContainer.removeAttribute("inert");
      }

      // 3. ion-content scrollEl 的 inline overflow（保险清理）
      const ionContentEl = document.querySelector("ion-content") as
        | (HTMLElement & { getScrollElement?: () => Promise<HTMLElement> })
        | null;
      void ionContentEl?.getScrollElement?.().then((scrollEl) => {
        scrollEl.style.removeProperty("overflow");
        scrollEl.style.removeProperty("overflow-y");
        scrollEl.style.removeProperty("touch-action");
        scrollEl.style.removeProperty("pointer-events");
      });

      // 触发重排，恢复 iOS 的滚动惯性
      window.dispatchEvent(new Event("resize"));
    });

    // 二次兜底：100ms 后再清理一次，防止 Ionic 异步重新加锁
    setTimeout(() => {
      document.body.classList.remove("backdrop-no-scroll");
      document.body.style.removeProperty("overflow");
    }, 100);
  };

  return {
    show,
    options,
    showActionSheet,
    onSelect,
    onClose,
  };
}