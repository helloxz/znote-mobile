/**
 * 清理 Ionic overlay（alert/modal/action sheet 等）dismiss 后可能残留的布局/滚动锁。
 *
 * 背景：在 iOS PWA 下，Ionic overlay present 时会给 body / ion-content 滚动元素
 * 加上一些临时样式或 class，dismiss 时偶尔清理不彻底，导致后续页面（如笔记列表、
 * 分享列表）的 ion-content 顶部偏移计算出错，首条卡片被 fixed header 遮挡。
 * 调用此方法可强制恢复干净状态，并触发 resize 让 Ionic 与 useFixedHeader 重新布局。
 */
export function restoreAppScroll() {
  requestAnimationFrame(() => {
    // 1. body 上的滚动锁 class / 内联样式
    document.body.classList.remove("backdrop-no-scroll", "ion-disable-scroll");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-right");

    // 2. view container 上的 aria-hidden / inert（Ionic setRootAriaHidden 残留）
    const appRoot = document.querySelector("ion-app") || document.body;
    const viewContainer = appRoot.querySelector(
      "ion-router-outlet, #ion-view-container-root"
    );
    if (viewContainer) {
      viewContainer.removeAttribute("aria-hidden");
      viewContainer.removeAttribute("inert");
    }

    // 3. 所有 ion-content 滚动元素上的内联样式（保险清理）
    document.querySelectorAll("ion-content").forEach((el) => {
      const ionContent = el as HTMLElement & {
        getScrollElement?: () => Promise<HTMLElement>;
      };
      void ionContent.getScrollElement?.().then((scrollEl) => {
        scrollEl.style.removeProperty("overflow");
        scrollEl.style.removeProperty("overflow-y");
        scrollEl.style.removeProperty("touch-action");
        scrollEl.style.removeProperty("pointer-events");
      });
    });

    // 4. 触发重排：让 useFixedHeader 重新测量，Ionic 重新计算 content insets
    window.dispatchEvent(new Event("resize"));
  });

  // 二次兜底：100ms 后再清一次，防止 Ionic 异步重新加锁
  setTimeout(() => {
    document.body.classList.remove("backdrop-no-scroll", "ion-disable-scroll");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-right");
  }, 100);
}
