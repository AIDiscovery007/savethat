/**
 * 剪贴板工具函数
 * 提供安全的剪贴板操作功能
 */

/**
 * 将文本复制到系统剪贴板
 * @param text 要复制的文本
 * @returns Promise<boolean> 复制是否成功
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard) {
    console.warn('Clipboard API not available');
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * 将优化后的提示词发送到指定AI客户端
 * @param prompt 提示词内容
 * @param targetUrl 目标AI客户端URL
 * @returns Promise<{ success: boolean; message: string }>
 */
export async function sendPromptToAI(prompt: string, targetUrl: string): Promise<{
  success: boolean;
  message: string;
}> {
  // 首先复制到剪贴板
  const copied = await copyToClipboard(prompt);

  if (!copied) {
    return {
      success: false,
      message: 'Failed to copy to clipboard. Please copy manually.',
    };
  }

  // 打开新标签页
  const newWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer');

  if (!newWindow) {
    return {
      success: false,
      message: 'Failed to open new tab. Please allow popups and try again.',
    };
  }

  return {
    success: true,
    message: 'Copied to clipboard! Press Ctrl+V / Cmd+V to paste.',
  };
}
