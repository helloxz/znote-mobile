<template>
  <ion-page>
    <!-- 自定义固定 header，遵循项目统一命名规范 -->
    <div class="custom-header">
      <div class="title-row">
        <button class="icon-btn" @click="onBack">
          <ion-icon :icon="chevronBack" />
        </button>
        <span class="title-text">{{ t("about.title") }}</span>
        <span class="icon-btn placeholder"></span>
      </div>
    </div>

    <ion-content :fullscreen="true" class="about-content">
      <div class="header-placeholder"></div>

      <!-- 品牌展示区 -->
      <div class="brand">
        <div class="brand-logo">Z</div>
        <h2 class="brand-name">{{ t("app.name") }}</h2>
        <p class="brand-version">v{{ version }}</p>
      </div>

      <!-- 设置列表卡片 -->
      <div class="settings-card">
        <!-- 问题反馈 -->
        <div class="setting-item" @click="openFeedback">
          <div class="setting-left">
            <ion-icon :icon="chatbubbleEllipsesOutline" class="setting-icon setting-icon-brand" />
            <span class="setting-text">{{ t("about.feedback") }}</span>
          </div>
          <ion-icon :icon="chevronForwardOutline" class="setting-arrow" />
        </div>

        <!-- 交流群 -->
        <div class="setting-item" @click="openCommunity">
          <div class="setting-left">
            <ion-icon :icon="peopleOutline" class="setting-icon setting-icon-success" />
            <span class="setting-text">{{ t("about.community") }}</span>
          </div>
          <ion-icon :icon="chevronForwardOutline" class="setting-arrow" />
        </div>

        <!-- 开源地址 -->
        <div class="setting-item" @click="openSourceRepo">
          <div class="setting-left">
            <ion-icon :icon="codeSlashOutline" class="setting-icon setting-icon-default" />
            <span class="setting-text">{{ t("about.source") }}</span>
          </div>
          <ion-icon :icon="chevronForwardOutline" class="setting-arrow" />
        </div>

        <!-- 检测更新（占位，放最下方） -->
        <div class="setting-item" @click="checkUpdate">
          <div class="setting-left">
            <ion-icon :icon="syncOutline" class="setting-icon setting-icon-info" />
            <span class="setting-text">{{ t("about.checkUpdate") }}</span>
          </div>
          <ion-icon :icon="chevronForwardOutline" class="setting-arrow" />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import {
  IonPage,
  IonIcon,
  IonContent,
  alertController,
} from "@ionic/vue";
import {
  chatbubbleEllipsesOutline,
  peopleOutline,
  syncOutline,
  codeSlashOutline,
  chevronForwardOutline,
  chevronBack,
} from "ionicons/icons";
import { useToast } from "@/composables/useToast";
import axios from "axios";
import pkg from "../../package.json";

const router = useRouter();
const { t } = useI18n();

/** 返回上一页 */
const onBack = () => {
  router.back();
};

/** 应用版本号（从 package.json 读取） */
const version = pkg.version;

/** 外部链接 */
const FEEDBACK_URL = "https://github.com/helloxz/znote-mobile/issues";
const COMMUNITY_URL = "https://znote.xphub.dev/doc/guide/note-325";
const SOURCE_REPO_URL = "https://github.com/helloxz/znote";

const { showToast } = useToast();

/** 打开问题反馈（系统浏览器） */
const openFeedback = () => {
  window.open(FEEDBACK_URL, "_system");
};

/** 打开交流群（系统浏览器） */
const openCommunity = () => {
  window.open(COMMUNITY_URL, "_system");
};

/** 打开开源仓库（系统浏览器） */
const openSourceRepo = () => {
  window.open(SOURCE_REPO_URL, "_system");
};

/** 检测更新远程 JSON 地址 */
const UPDATE_JSON_URL = "https://soft.xiaoz.org/source/znote/app/latest.json";

/**
 * 比较两个语义化版本号
 * @returns -1 表示 a < b，0 表示相等，1 表示 a > b
 */
const compareVersion = (a: string, b: string): number => {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
};

/**
 * 检测更新
 * 请求远程 latest.json，与本地版本比较：
 * - 相同 → toast 提示已是最新
 * - 远程更新 → alert 弹窗，用户确认后浏览器打开下载页
 */
const checkUpdate = async () => {
  showToast(t("about.update.checking"));

  try {
    const { data } = await axios.get(UPDATE_JSON_URL, { timeout: 10000 });
    const remoteVersion: string = data.version;
    const pageUrl: string = data.page;

    // 版本比较
    const cmp = compareVersion(version, remoteVersion);

    if (cmp >= 0) {
      // 本地版本 >= 远程版本：已是最新
      await showToast(t("about.updateToast"), "success");
    } else {
      // 本地版本 < 远程版本：有新版本
      const alert = await alertController.create({
        header: t("about.update.newVersion", { version: remoteVersion }),
        buttons: [
          { text: t("note.list.cancel"), role: "cancel" },
          {
            text: t("about.update.goDownload"),
            handler: () => {
              window.open(pageUrl, "_system");
            },
          },
        ],
      });
      await alert.present();
    }
  } catch {
    showToast(t("network.error"));
  }
};
</script>

<style scoped>
.about-content {
  --background: var(--z-bg-page);
}

/* 自定义固定 header */
.custom-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: var(--z-bg-page);
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
  font-size: var(--z-fs-body-lg);
  font-weight: 600;
  color: var(--z-text-primary);
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

.icon-btn.placeholder {
  visibility: hidden;
}

.header-placeholder {
  height: calc(48px + var(--z-safe-area-top));
}

/* 品牌展示区 */
.brand {
  text-align: center;
  padding: 40px 0 32px;
}

.brand-logo {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  border-radius: var(--z-radius-lg);
  background: var(--z-primary);
  color: var(--z-primary-contrast);
  font-size: 36px;
  font-weight: 700;
  line-height: 72px;
  box-shadow: var(--z-shadow-md);
}

.brand-name {
  margin: 0;
  font-size: var(--z-fs-subtitle);
  font-weight: 600;
  color: var(--z-text-primary);
}

.brand-version {
  margin: 6px 0 0;
  font-size: var(--z-fs-body-sm);
  color: var(--z-text-tertiary);
}

/* 设置列表卡片 */
.settings-card {
  margin: 0 var(--z-space-lg);
  background: var(--z-bg-surface);
  border-radius: var(--z-radius-md);
  box-shadow: var(--z-shadow-xs);
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px var(--z-space-lg);
  cursor: pointer;
  transition: background 0.15s;
}

.setting-item:active {
  background: var(--z-bg-subtle);
}

/* 非最后一项加底部分割线 */
.setting-item:not(:last-child) {
  border-bottom: 1px solid var(--z-border-light);
}

.setting-left {
  display: flex;
  align-items: center;
  gap: var(--z-space-md);
}

.setting-icon {
  font-size: 22px;
  flex-shrink: 0;
}

/* 图标颜色区分 */
.setting-icon-brand {
  color: var(--z-primary);
}

.setting-icon-success {
  color: var(--z-success);
}

.setting-icon-info {
  color: var(--ion-color-warning);
}

.setting-icon-default {
  color: var(--z-icon-default);
}

.setting-text {
  font-size: var(--z-fs-body);
  color: var(--z-text-primary);
}

.setting-arrow {
  font-size: 18px;
  color: var(--z-text-disabled);
  flex-shrink: 0;
}
</style>
