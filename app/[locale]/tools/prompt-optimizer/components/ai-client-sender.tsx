'use client';

/**
 * AI客户端发送面板组件
 * 允许用户将优化后的提示词发送到其他AI客户端
 * 设计为扁平化面板，直接显示所有客户端选项
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AI_CLIENTS } from '@/lib/config/ai-clients';
import { sendPromptToAI } from '@/lib/utils/clipboard';
import { Claude, Gemini, DeepSeek, OpenAI } from '@lobehub/icons';
import { CheckCircle, XCircle, ShareNetwork } from '@phosphor-icons/react';

// 图标映射
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Claude,
  OpenAI,
  Gemini,
  DeepSeek,
};

interface AIClientSenderProps {
  prompt: string;
  className?: string;
}

export function AIClientSender({ prompt, className }: AIClientSenderProps) {
  const t = useTranslations('AIClientSender');
  const [sendingId, setSendingId] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{ success: boolean; message: string } | null>(null);

  const handleSend = async (client: typeof AI_CLIENTS[0]) => {
    setSendingId(client.id);
    setResult(null);

    const result = await sendPromptToAI(prompt, client.url);
    setResult(result);
    setSendingId(null);

    // 3秒后清除结果
    setTimeout(() => setResult(null), 3000);
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* 标题栏 */}
      <div className="flex items-center gap-2">
        <ShareNetwork className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{t('title')}</span>
        {result && (
          <span
            className={cn(
              'text-xs flex items-center gap-1 animate-fade-in',
              result.success ? 'text-green-600' : 'text-destructive'
            )}
          >
            {result.success ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {result.message}
          </span>
        )}
      </div>

      {/* 客户端按钮行 - 单行显示所有选项 */}
      <div className="flex flex-wrap gap-2">
        {AI_CLIENTS.map((client) => {
          const Icon = ICON_MAP[client.iconName] || Claude;
          const isSending = sendingId === client.id;

          return (
            <Button
              key={client.id}
              variant="default"
              size="sm"
              disabled={isSending}
              onClick={() => handleSend(client)}
              className={cn(
                'gap-1.5 h-8 px-3 transition-all duration-200',
                'hover:scale-[1.02] active:scale-[0.98]',
                isSending && 'animate-pulse'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{client.name}</span>
              {isSending && (
                <span className="text-xs opacity-70">{t('sending')}</span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
