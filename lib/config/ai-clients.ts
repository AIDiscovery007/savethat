/**
 * AI客户端配置
 * 定义支持的AI客户端列表，用于提示词发送功能
 */

export interface AIClient {
  id: string;
  name: string;
  url: string;
  iconName: string;
}

export const AI_CLIENTS: AIClient[] = [
  {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai/new',
    iconName: 'Claude',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com/',
    iconName: 'OpenAI',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com/app',
    iconName: 'Gemini',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    url: 'https://chat.deepseek.com/',
    iconName: 'DeepSeek',
  },
];
