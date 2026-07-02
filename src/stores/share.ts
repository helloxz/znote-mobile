import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * 分享列表脏标记 store
 * 用于跨组件通知【我的分享】列表需要刷新：
 * - 创建分享 / 删除分享时调用 markDirty() 置脏
 * - ShareView 进入时通过 consumeDirty() 消费：脏则刷新一次并清标记
 * 避免每次切换 tab 都请求 API
 */
export const useShareStore = defineStore("share", () => {
    // 列表是否已过期，需要重新加载
    const dirty = ref(false);

    /** 标记列表已变更，下次进入页面时需重新加载 */
    const markDirty = () => {
        dirty.value = true;
    };

    /**
     * 消费脏标记：若为脏则清除并返回 true（调用方应刷新），否则返回 false
     * 保证一次变更只触发一次刷新
     */
    const consumeDirty = (): boolean => {
        if (dirty.value) {
            dirty.value = false;
            return true;
        }
        return false;
    };

    return { dirty, markDirty, consumeDirty };
});
