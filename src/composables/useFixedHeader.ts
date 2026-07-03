import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";

/**
 * 测量固定头部（.custom-header）的真实高度，并返回给占位元素使用。
 *
 * 背景：笔记页/分享页使用自定义 fixed header + ion-content 内部 placeholder
 * 来避免首条内容被遮挡。但 iOS/Android 下 ion-searchbar 高度不同，写死高度
 * 会导致 iOS 上占位不够，首条卡片被 header 裁切。
 *
 * 用法：
 *   const { headerRef, placeholderStyle } = useFixedHeader();
 *   <div ref="headerRef" class="custom-header">...</div>
 *   <div class="header-placeholder" :style="placeholderStyle"></div>
 */
export function useFixedHeader() {
  const headerRef = ref<HTMLElement>();
  // 初始 undefined：首屏使用 CSS fallback，测量后再用真实值覆盖
  const headerHeight = ref<number>();

  const update = () => {
    if (headerRef.value) {
      headerHeight.value = headerRef.value.offsetHeight;
    }
  };

  onMounted(() => {
    // 等当前帧 DOM 稳定后再测，避免首屏拿到 0 或不准确
    nextTick(() => {
      requestAnimationFrame(() => requestAnimationFrame(update));
    });
    window.addEventListener("resize", update);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", update);
  });

  const placeholderStyle = computed(() => {
    const h = headerHeight.value;
    // 测量值无效（0 或未就绪）时返回 undefined，让 CSS fallback 生效
    return h != null && h > 0 ? { height: `${h}px` } : undefined;
  });

  return { headerRef, headerHeight, placeholderStyle };
}
