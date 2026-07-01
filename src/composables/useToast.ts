import { ref } from "vue";

export interface ToastItem {
  id: number;
  message: string;
  color: "success" | "danger";
}

/** 全局 toast 列表（响应式，所有 useToast 调用共享同一份数据） */
const toasts = ref<ToastItem[]>([]);
let nextId = 0;

/**
 * 全局 Toast 的 Composable。
 *
 * 用法：
 * ```ts
 * const { showToast } = useToast();
 * showToast("操作成功", "success");
 * showToast("操作失败"); // 默认 danger
 * ```
 */
export function useToast() {
  /**
   * 显示一条 toast 提示
   * @param message 提示文字
   * @param color 颜色：success（绿）或 danger（红），默认 danger
   */
  const showToast = (message: string, color: "success" | "danger" = "danger") => {
    const id = nextId++;
    const toast: ToastItem = { id, message, color };

    // 加入列表
    toasts.value = [...toasts.value, toast];

    // 2 秒后自动移除
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, 2000);
  };

  return { showToast, toasts };
}