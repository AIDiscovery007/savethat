'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, FileText, Sparkles, BarChart3, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseFile, getFileType } from '@/lib/xiaohongshu/parser';
import { ANALYSIS_TEMPLATES, buildAnalysisPrompt } from '@/lib/xiaohongshu/prompts';
import type { NoteData, CSVParseResult, AnalysisResult } from '@/types/xiaohongshu';

export default function XiaohongshuAnalyticsPage() {
  const t = useTranslations('XiaohongshuAnalytics');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accumulatedTextRef = useRef('');

  // 状态管理
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [instruction, setInstruction] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('viral-features');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');

  // Debounced streaming text update (update at most every 200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (accumulatedTextRef.current !== streamingText) {
        setAnalysisResult((prev) => prev ? { ...prev, summary: accumulatedTextRef.current } : null);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [streamingText]);

  // 处理文件选择
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const fileType = getFileType(selectedFile);
    if (fileType !== 'csv' && fileType !== 'xlsx') {
      setError(t('errors.invalidFormat'));
      return;
    }

    setFile(selectedFile);
    setError(null);
    setAnalysisResult(null);

    // 解析文件
    try {
      const result = await parseFile(selectedFile);
      if (result.success) {
        setParseResult(result);
      } else {
        setError(t('errors.parseFailed', { message: result.error || 'Unknown error' }));
      }
    } catch (err) {
      setError(t('errors.parseFailed', { message: String(err) }));
    }
  }, [t]);

  // 处理模板选择
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = ANALYSIS_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setInstruction(template.prompt);
    }
  };

  // 开始分析
  const handleAnalyze = async () => {
    if (!parseResult?.data || parseResult.data.length === 0) {
      setError(t('errors.noData'));
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const prompt = buildAnalysisPrompt(parseResult.data, instruction);

      const response = await fetch('/api/xiaohongshu/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(t('errors.analyzeFailed'));
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      accumulatedTextRef.current = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          accumulatedTextRef.current += chunk;
          // Debounced update via useEffect
          setStreamingText(accumulatedTextRef.current);
        }
      }

      // 解析完整结果
      setAnalysisResult({
        summary: accumulatedTextRef.current,
        insights: extractInsights(accumulatedTextRef.current),
        recommendations: extractRecommendations(accumulatedTextRef.current),
        metrics: extractMetrics(parseResult.data),
      });
    } catch (err) {
      setError(t('errors.analyzeFailed', { message: String(err) }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-pink-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-sm text-gray-500">{t('subtitle')}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：数据上传和配置 */}
          <div className="space-y-6">
            {/* 文件上传区域 */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-pink-500" />
                {t('uploadSection.title')}
              </h2>

              <div
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                  file
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-pink-400 hover:bg-pink-50'
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {file ? (
                  <div className="space-y-2">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
                    <p className="font-medium text-gray-900">{file.name}</p>
                    {parseResult && (
                      <p className="text-sm text-gray-500">
                        {t('uploadSection.rowsCount', { count: parseResult.rowCount })}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FileText className="w-10 h-10 text-gray-400 mx-auto" />
                    <p className="text-gray-600">{t('uploadSection.dragDrop')}</p>
                    <p className="text-sm text-gray-400">{t('uploadSection.supportedFormats')}</p>
                  </div>
                )}
              </div>
            </section>

            {/* 数据预览 */}
            {parseResult && parseResult.data.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-pink-500" />
                  {t('previewSection.title')}
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-gray-500">#</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">{t('previewTable.title')}</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-500">{t('previewTable.likes')}</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-500">{t('previewTable.comments')}</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-500">{t('previewTable.views')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.data.slice(0, 5).map((note, index) => (
                        <tr key={note.id} className="border-b last:border-0">
                          <td className="py-2 px-3 text-gray-500">{index + 1}</td>
                          <td className="py-2 px-3 text-gray-900 truncate max-w-[200px]">
                            {String(note.title || note.content || '').slice(0, 30)}...
                          </td>
                          <td className="py-2 px-3 text-right text-gray-600">
                            {(note.likes || 0).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-600">
                            {(note.comments || 0).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-600">
                            {(note.views || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parseResult.data.length > 5 && (
                    <p className="text-sm text-gray-500 mt-3 text-center">
                      {t('previewTable.moreData', { count: parseResult.data.length - 5 })}
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* 分析配置 */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" />
                {t('analysisSection.title')}
              </h2>

              {/* 预设模板 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('analysisSection.templates')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ANALYSIS_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-all',
                        selectedTemplate === template.id
                          ? 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-gray-200 hover:border-pink-300'
                      )}
                    >
                      <p className="font-medium text-sm">{t(`templates.${template.id}.name`)}</p>
                      <p className="text-xs text-gray-500 mt-1">{t(`templates.${template.id}.description`)}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 自定义指令 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('analysisSection.customInstruction')}
                </label>
                <textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder={t('analysisSection.instructionPlaceholder')}
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {/* 分析按钮 */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !parseResult?.data}
                className={cn(
                  'w-full py-3 px-6 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all',
                  isAnalyzing || !parseResult?.data
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600'
                )}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('analysisSection.analyzing')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {t('analysisSection.startAnalysis')}
                  </>
                )}
              </button>
            </section>
          </div>

          {/* 右侧：分析结果 */}
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {!parseResult && (
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{t('resultSection.placeholder')}</p>
              </div>
            )}

            {analysisResult && (
              <section className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-pink-500" />
                  {t('resultSection.title')}
                </h2>

                <div className="prose prose-pink max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {analysisResult.summary}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// 辅助函数：提取列表（洞察或建议）
function extractListItems(text: string, startKeywords: string[], endKeywords?: string[]): string[] {
  const items: string[] = [];
  let inSection = false;

  for (const line of text.split('\n')) {
    // 检查是否进入目标区域
    if (!inSection && startKeywords.some((kw) => line.includes(kw))) {
      inSection = true;
      continue;
    }
    // 检查是否离开区域（仅用于洞察）
    if (inSection && endKeywords?.some((kw) => line.includes(kw))) {
      break;
    }
    // 提取列表项
    if (inSection && line.trim().startsWith('-')) {
      items.push(line.replace(/^-\s*/, '').trim());
    }
  }
  return items;
}

// 辅助函数：提取洞察
function extractInsights(text: string): string[] {
  return extractListItems(text, ['洞察', '发现'], ['建议', '行动']);
}

// 辅助函数：提取建议
function extractRecommendations(text: string): string[] {
  return extractListItems(text, ['建议', '策略']);
}

// 辅助函数：提取关键指标
function extractMetrics(data: NoteData[]): Record<string, string | number> {
  const totalViews = data.reduce((sum, n) => sum + (n.views || 0), 0);
  const totalLikes = data.reduce((sum, n) => sum + (n.likes || 0), 0);
  const totalComments = data.reduce((sum, n) => sum + (n.comments || 0), 0);

  return {
    totalNotes: data.length,
    totalViews: totalViews.toLocaleString(),
    totalLikes: totalLikes.toLocaleString(),
    avgLikes: Math.round(totalLikes / data.length).toLocaleString(),
    avgComments: Math.round(totalComments / data.length).toLocaleString(),
    engagementRate: totalViews > 0
      ? ((totalLikes + totalComments) / totalViews * 100).toFixed(2)
      : '0',
  };
}
