import { createI18n } from "vue-i18n";
import zh from "./locales/zh";
import en from "./locales/en";

// 自动检测浏览器语言：zh 开头用中文，否则英文
const detectLocale = (): string => {
    const lang = navigator.language?.toLowerCase() || "en";
    return lang.startsWith("zh") ? "zh" : "en";
};

const i18n = createI18n({
    legacy: false, // 使用 Composition API 模式
    locale: detectLocale(),
    fallbackLocale: "en",
    messages: {
        zh,
        en,
    },
});

export default i18n;
