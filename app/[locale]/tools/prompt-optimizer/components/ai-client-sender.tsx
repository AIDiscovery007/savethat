'use client';

/**
 * AI客户端发送面板组件
 * 允许用户将优化后的提示词发送到其他AI客户端
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AI_CLIENTS } from '@/lib/config/ai-clients';
import { sendPromptToAI } from '@/lib/utils/clipboard';
import { Claude, Gemini, DeepSeek, OpenAI } from '@lobehub/icons';
import { CheckCircle, XCircle } from 'lucide-react';

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
    <div className={cn('space-y-3', className)}>
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t('title')}</span>
        {result && (
          <span
            className={cn(
              'text-xs flex items-center gap-1',
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

      {/* 客户端列表 */}
      <div className="grid grid-cols-2 gap-2">
        {AI_CLIENTS.map((client) => {
          const Icon = ICON_MAP[client.iconName] || Claude;
          const isSending = sendingId === client.id;

          return (
            <Button
              key={client.id}
              variant="outline"
              disabled={isSending}
              onClick={() => handleSend(client)}
              className="justify-start gap-2 h-9"
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{client.name}</span>
              {isSending ? (
                <span className="text-xs animate-pulse">{t('sending')}</span>
              ) : null}
            </Button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">{t('instruction')}</p>
    </div>
  );
}
