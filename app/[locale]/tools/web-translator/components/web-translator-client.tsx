'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LoadingPlaceholder } from '@/components/loading-placeholder';
import { CopyButton } from '@/components/copy-button';
import { Separator } from '@/components/ui/separator';
import {
  TrashIcon,
  StarIcon,
  GlobeIcon,
  ClockIcon,
  LinkIcon,
  SpinnerIcon
} from '@phosphor-icons/react';
import { Star } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import { webTranslationStorage, createTranslationRecord } from '@/lib/storage/web-translation-storage';
import type { WebTranslationRecord } from '@/lib/storage/web-translation-types';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AI_CLIENTS } from '@/lib/config/ai-clients';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { Claude, Gemini, DeepSeek, OpenAI } from '@lobehub/icons';
import { ChatCircleIcon } from '@phosphor-icons/react';
import { CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// API 响应类型
interface TranslateResponse {
  success: boolean;
  data?: {
    originalTitle: string;
    originalLanguage: string;
    translatedTitle: string;
    translatedContent: string;
    images: Array<{ src: string; alt?: string }>;
    modelId: string;
    tokens: { prompt: number; completion: number; total: number };
  };
  error?: string;
}

// 格式化时间
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString('zh-CN');
}

// 提取域名
function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function WebTranslatorClient() {
  const t = useTranslations('WebTranslator');
  const searchParams = useSearchParams();

  const [url, setUrl] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<TranslateResponse['data'] | null>(null);
  const [history, setHistory] = React.useState<WebTranslationRecord[]>([]);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    open: boolean;
    id: string | null;
    title: string;
  }>({ open: false, id: null, title: '' });

  // Talk with AI 状态
  const [talkWithAIOpen, setTalkWithAIOpen] = React.useState(false);
  const [sendingToAI, setSendingToAI] = React.useState<string | null>(null);
  const [talkWithAIResult, setTalkWithAIResult] = React.useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // 加载历史记录
  const loadHistory = React.useCallback(async () => {
    const records = await webTranslationStorage.getAllTranslations();
    setHistory(records);
  }, []);

  // 翻译函数（需要在 useEffect 之前定义）
  const handleTranslate = React.useCallback(async () => {
    if (!url.trim()) {
      setError('请输入网址');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/web-translator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '翻译失败');
      }

      const data: TranslateResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || '翻译失败');
      }

      if (data.data) {
        setResult(data.data);

        // 保存到历史记录
        const record = createTranslationRecord({
          originalUrl: url.trim(),
          originalTitle: data.data.originalTitle,
          originalLanguage: data.data.originalLanguage,
          translatedTitle: data.data.translatedTitle,
          translatedContent: data.data.translatedContent,
          images: data.data.images,
          modelId: data.data.modelId,
          modelName: 'Gemini 3 Flash',
          tokens: data.data.tokens,
        });

        await webTranslationStorage.saveTranslation(record);
        await loadHistory();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '翻译过程中发生错误');
    } finally {
      setLoading(false);
    }
  }, [url, loadHistory]);

  // 存储 handleTranslate 的 ref，用于在 useEffect 中调用
  const handleTranslateRef = React.useRef(handleTranslate);
  handleTranslateRef.current = handleTranslate;

  // 首次加载
  React.useEffect(() => {
    loadHistory();

    // 检查 URL 参数，自动翻译
    const urlParam = searchParams.get('url');
    if (urlParam && !loading && !result) {
      setUrl(urlParam);
      // 延迟触发翻译，确保组件完全挂载
      setTimeout(() => {
        handleTranslateRef.current();
      }, 100);
    }

    // 监听跨标签页同步
    const unsubscribe = webTranslationStorage.addEventListener('*', loadHistory);
    return unsubscribe;
  }, [loadHistory, searchParams, loading, result]);

  // 切换收藏
  const handleToggleFavorite = React.useCallback(async (id: string) => {
    await webTranslationStorage.toggleFavorite(id);
    await loadHistory();
  }, [loadHistory]);

  // 加载历史记录到结果
  const handleLoadRecord = React.useCallback((record: WebTranslationRecord) => {
    setResult({
      originalTitle: record.originalTitle,
      originalLanguage: record.originalLanguage,
      translatedTitle: record.translatedTitle,
      translatedContent: record.translatedContent,
      images: record.images,
      modelId: record.modelId,
      tokens: record.tokens || { prompt: 0, completion: 0, total: 0 },
    });
    setUrl(record.originalUrl);
  }, []);

  // 按 Enter 提交
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  // 打开 Talk with AI 对话框
  const handleOpenTalkWithAI = React.useCallback(() => {
    setTalkWithAIOpen(true);
    setTalkWithAIResult(null);
  }, []);

  // 发送到 AI 客户端
  const handleSendToAI = React.useCallback(async (client: typeof AI_CLIENTS[0]) => {
    if (!result) return;

    setSendingToAI(client.id);
    setTalkWithAIResult(null);

    // 生成讨论提示词
    const prompt = generateDiscussionPrompt(result.translatedTitle, result.translatedContent);

    // 复制到剪贴板
    const copied = await copyToClipboard(prompt);

    if (!copied) {
      setTalkWithAIResult({
        success: false,
        message: t('copyFailed'),
      });
      setSendingToAI(null);
      return;
    }

    // 打开新标签页
    const newWindow = window.open(client.url, '_blank', 'noopener,noreferrer');

    if (!newWindow) {
      setTalkWithAIResult({
        success: false,
        message: t('openTabFailed'),
      });
      setSendingToAI(null);
      return;
    }

    setTalkWithAIResult({
      success: true,
      message: t('talkWithAIInstruction'),
    });
    setSendingToAI(null);

    // 3秒后清除结果
    setTimeout(() => setTalkWithAIResult(null), 3000);
  }, [result, t]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左侧: 输入和历史 */}
      <div className="lg:col-span-1 space-y-4">
        {/* URL 输入 */}
        <Card className="rounded-xl">
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">{t('urlLabel')}</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  onClick={handleTranslate}
                  disabled={loading || !url.trim()}
                  size="default"
                >
                  {loading ? (
                    <>
                      <SpinnerIcon className="h-4 w-4 mr-2 animate-spin" />
                      {t('translating')}
                    </>
                  ) : (
                    t('translateBtn')
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t('urlHint')}</p>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 历史记录 */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                {t('historyTitle')}
              </CardTitle>
              <Badge variant="secondary">{history.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[400px] overflow-y-auto pr-2">
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {t('noHistory')}
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((record) => (
                    <div
                      key={record.id}
                      className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => handleLoadRecord(record)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">
                            {record.translatedTitle || t('untitled')}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {extractDomain(record.originalUrl)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {record.originalLanguage}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(record.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(record.id);
                            }}
                          >
                            {record.isFavorite ? (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            ) : (
                              <StarIcon className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({
                                open: true,
                                id: record.id,
                                title: record.translatedTitle || t('untitled'),
                              });
                            }}
                          >
                            <TrashIcon className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 右侧: 翻译结果 */}
      <div className="lg:col-span-2">
        <Card className="rounded-xl min-h-[600px]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {result ? t('resultTitle') : t('resultEmpty')}
              </CardTitle>
              {result && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {result.originalLanguage} → 中文
                  </Badge>
                  <CopyButton
                    value={`# ${result.translatedTitle}\n\n${result.translatedContent}`}
                    variant="ghost"
                    size="icon-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleOpenTalkWithAI}
                    title={t('talkWithAI')}
                  >
                    <ChatCircleIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* 加载状态 */}
            {loading && (
              <LoadingPlaceholder
                message={t('loadingMessage')}
                icon={<SpinnerIcon className="h-8 w-8 animate-spin text-muted-foreground" />}
              />
            )}

            {/* 空状态 */}
            {!loading && !result && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <GlobeIcon className="h-12 w-12 mb-4 opacity-50" />
                <p>{t('emptyState')}</p>
              </div>
            )}

            {/* 翻译结果 */}
            {result && (
              <div className="space-y-4">
                {/* 标题 */}
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">{result.translatedTitle}</h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      {extractDomain(url)}
                      <LinkIcon className="h-3 w-3" />
                    </a>
                    <Separator orientation="vertical" className="h-3" />
                    <span>
                      {t('tokens', { count: result.tokens.total })}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* 内容 */}
                <article className="prose prose-neutral max-w-none prose-img:rounded-lg prose-img:max-w-full prose-headings:font-semibold prose-p:leading-relaxed">
                  <ReactMarkdown
                    components={{
                      // 图片组件 - 避免使用 figure 包装以防止 HTML 嵌套错误
                      img: ({ node, src, alt, ...props }) => (
                        <span className="block my-4 text-center">
                          <img
                            src={src}
                            alt={alt}
                            className="rounded-lg max-w-full h-auto inline-block"
                            loading="lazy"
                            {...props}
                          />
                          {alt && alt !== src && (
                            <span className="block text-xs text-muted-foreground mt-1">
                              {alt}
                            </span>
                          )}
                        </span>
                      ),
                      // 链接样式
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          className="text-primary hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      ),
                    }}
                  >
                    {result.translatedContent}
                  </ReactMarkdown>
                </article>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 删除确认弹窗 */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deleteConfirm.title}」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteConfirm.id) {
                  await webTranslationStorage.deleteTranslation(deleteConfirm.id);
                  await loadHistory();
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Talk with AI Dialog */}
      <Dialog open={talkWithAIOpen} onOpenChange={setTalkWithAIOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('talkWithAITitle')}</DialogTitle>
          </DialogHeader>
          {result && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {AI_CLIENTS.map((client) => {
                  const Icon = ICON_MAP[client.iconName] || Claude;
                  const isSending = sendingToAI === client.id;

                  return (
                    <Button
                      key={client.id}
                      variant="outline"
                      disabled={isSending}
                      onClick={() => handleSendToAI(client)}
                      className="justify-start gap-2 h-10"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{client.name}</span>
                      {isSending && (
                        <span className="text-xs animate-pulse">{t('sending')}</span>
                      )}
                    </Button>
                  );
                })}
              </div>
              {talkWithAIResult && (
                <div
                  className={`flex items-center gap-2 text-sm ${
                    talkWithAIResult.success ? 'text-green-600' : 'text-destructive'
                  }`}
                >
                  {talkWithAIResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {talkWithAIResult.message}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 图标映射
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Claude,
  OpenAI,
  Gemini,
  DeepSeek,
};

// 生成讨论提示词
function generateDiscussionPrompt(title: string, content: string): string {
  return `以下是网页翻译的内容，请帮我：

1. 深入解读文章的核心观点和论证逻辑
2. 分析作者的表达技巧和写作风格
3. 探讨文章中提到的概念在实际场景中的应用
4. 如果有不清楚的地方，请帮我进一步解释

--- 原文标题 ---
${title}

--- 翻译内容 ---
${content}`;
}
