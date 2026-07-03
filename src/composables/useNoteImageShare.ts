import { ref, nextTick } from "vue";
import { domToPng } from "modern-screenshot";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { Note } from "@/types/note";

/**
 * 笔记转图片分享 Composable
 *
 * 流程：
 * 1. 字数拦截：内容超过 1 万字直接拒绝（避免超大 PNG 导致 OOM / 微信拒收）
 * 2. 渲染离屏快照卡片（NoteSnapshotCard）
 * 3. 用 modern-screenshot 把卡根 DOM 转 PNG dataURL
 * 4. 写入 Capacitor Cache 目录（不落相册）
 * 5. 调 @capacitor/share 唤起系统分享面板（微信/QQ 等已安装应用自动出现）
 * 6. 分享完毕删除缓存文件
 *
 * 使用方式：在 NoteView.vue 模板中挂载离屏容器（详见组件接入注释），
 * 调用方拿到 { snapshotNote, snapshotCardRef, shareAsImage } 用即可。
 */

/** 字数上限：超过此值不允许分享图片 */
const MAX_CONTENT_LENGTH = 10000;

/** 分享结果：ok=是否成功，msg=供 i18n 翻译的 message key */
export interface ShareResult {
    ok: boolean;
    msg: string;
}

export function useNoteImageShare() {
    /** 当前要生成图片的笔记：非空时模板渲染快照卡片 */
    const snapshotNote = ref<Note | null>(null);
    /** 快照卡片组件实例引用（用于拿卡根 DOM 节点） */
    const snapshotCardRef = ref<{ cardRef: HTMLElement | null } | null>(null);

    /**
     * 分享笔记为图片
     * @param note 待分享的笔记
     * @returns 分享结果（msg 为 i18n key）
     */
    async function shareAsImage(note: Note): Promise<ShareResult> {
        const content = note.content || "";
        if (content.length > MAX_CONTENT_LENGTH) {
            return { ok: false, msg: "note.list.shareImage.tooLong" };
        }
        if (!content.trim()) {
            return { ok: false, msg: "note.list.shareImage.empty" };
        }

        // 触发离屏卡片渲染
        snapshotNote.value = note;
        // 等 Vue 完成响应式渲染
        await nextTick();
        // 额外延迟：incremark 渲染与图片加载为异步，确保 DOM 稳定后再截图
        await new Promise((resolve) => setTimeout(resolve, 300));

        const el = snapshotCardRef.value?.cardRef ?? null;
        if (!el) {
            snapshotNote.value = null;
            return { ok: false, msg: "note.list.shareImage.failed" };
        }

        const fileName = `znote-share-${Date.now()}.png`;
        try {
            // 1) DOM → PNG dataURL（2 倍图保证清晰；白底兜底）
            const dataUrl = await domToPng(el, {
                width: 750,
                scale: 2,
                backgroundColor: "#ffffff",
            });

            // 2) dataURL → 写入应用缓存目录（base64 部分）
            const base64 = dataUrl.split(",")[1] || "";
            const writeRes = await Filesystem.writeFile({
                path: fileName,
                data: base64,
                directory: Directory.Cache,
                recursive: true,
            });

            // 3) 唤起系统分享面板（微信/QQ 等已安装应用自动出现）
            await Share.share({
                title: note.title || "ZNote",
                url: writeRes.uri,
                dialogTitle: "Share Note",
            });

            return { ok: true, msg: "note.list.shareImage.success" };
        } catch (err) {
            console.error("[shareAsImage] failed:", err);
            return { ok: false, msg: "note.list.shareImage.failed" };
        } finally {
            // 收尾：卸载离屏卡片 + 删除缓存文件
            snapshotNote.value = null;
            try {
                await Filesystem.deleteFile({
                    path: fileName,
                    directory: Directory.Cache,
                });
            } catch {
                /* 缓存清理失败可忽略 */
            }
        }
    }

    return { snapshotNote, snapshotCardRef, shareAsImage };
}