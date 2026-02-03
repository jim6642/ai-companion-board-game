/**
 * 分享工具函数
 */

import type { GameAnalysisData } from "@/types/analysis";

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
}

export async function shareViaWebAPI(options: ShareOptions): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }

  try {
    await navigator.share({
      title: options.title || "狼人杀复盘",
      text: options.text || "来看看我的狼人杀战绩！",
      url: options.url || window.location.href,
    });
    return true;
  } catch (error) {
    if ((error as Error).name !== "AbortError") {
      console.error("Share failed:", error);
    }
    return false;
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Copy failed:", error);
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

export function generateShareText(data: GameAnalysisData): string {
  const resultText = data.result === "wolf_win" ? "狼人获胜" : "好人获胜";
  const roleText = data.personalStats.role;
  const tag = data.personalStats.tags[0] || "";
  const score = data.personalStats.totalScore;

  return `【狼人杀复盘】
🎮 对局结果：${resultText}
👤 我的角色：${roleText}
🏷️ 获得称号：${tag}
📊 综合评分：${score}分

${data.personalStats.highlightQuote ? `💬 金句：「${data.personalStats.highlightQuote}」` : ""}

来和我一起玩狼人杀吧！`;
}

export function generateShareUrl(gameId: string): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  return `${baseUrl}/analysis/${gameId}`;
}

export interface ShareResult {
  success: boolean;
  method: "webshare" | "clipboard" | "none";
  message: string;
}

export async function shareAnalysis(data: GameAnalysisData): Promise<ShareResult> {
  const shareText = generateShareText(data);
  const shareUrl = generateShareUrl(data.gameId);

  const webShareSuccess = await shareViaWebAPI({
    title: "狼人杀复盘",
    text: shareText,
    url: shareUrl,
  });

  if (webShareSuccess) {
    return {
      success: true,
      method: "webshare",
      message: "分享成功",
    };
  }

  const clipboardSuccess = await copyToClipboard(`${shareText}\n\n${shareUrl}`);

  if (clipboardSuccess) {
    return {
      success: true,
      method: "clipboard",
      message: "已复制到剪贴板",
    };
  }

  return {
    success: false,
    method: "none",
    message: "分享失败，请手动复制",
  };
}
