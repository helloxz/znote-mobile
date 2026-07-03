/**
 * Markdown 图片域名处理工具
 *
 * 笔记内容中的图片可能是相对路径（如 `/files/xxx.jpg`，由后端上传接口返回），
 * 渲染时需要补上服务器域名。已带 http(s) 协议的完整 URL 不做处理。
 *
 * 适用于 Markdown `![](url)` 语法与 HTML `<img src="url">` 标签两种情况。
 */

/**
 * 判断 URL 是否已是完整 http(s) 地址
 * @param url 待检测的字符串
 * @returns true 表示已带 http/https 协议，无需拼接
 */
export function isAbsoluteUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
}

/**
 * 将 Markdown 内容中的相对路径图片 URL 补全为绝对路径
 * - 匹配 Markdown 图片语法 `![alt](url)`
 * - 匹配 HTML img 标签 `<img src="url" ...>`
 * - 已有协议（http/https）的 URL 不做处理
 * - baseUrl 为空时原样返回（无法补全，交给上游处理）
 *
 * @param content Markdown 原文
 * @param baseUrl 服务器地址（如 `https://www.example.com`），末尾斜杠会被自动去除
 * @returns 处理后的 Markdown 内容
 */
export function prependImageDomain(content: string, baseUrl: string): string {
    if (!baseUrl) return content;
    // 去掉末尾斜杠，避免拼接出双斜杠
    const cleanBase = baseUrl.replace(/\/$/, "");

    // 处理 Markdown 图片: ![alt](url)
    let result = content.replace(
        /(!\[[^\]]*\])\(([^)]+)\)/g,
        (match, alt, url) => {
            if (isAbsoluteUrl(url)) return match; // 已是完整 URL 跳过
            const normalized = url.startsWith("/") ? url : "/" + url;
            return `${alt}(${cleanBase}${normalized})`;
        }
    );

    // 处理 HTML img 标签: <img src="url" ...>
    result = result.replace(
        /(<img[^>]*\ssrc=")([^"]+)("[^>]*>)/g,
        (match, prefix, url, suffix) => {
            if (isAbsoluteUrl(url)) return match;
            const normalized = url.startsWith("/") ? url : "/" + url;
            return `${prefix}${cleanBase}${normalized}${suffix}`;
        }
    );

    return result;
}