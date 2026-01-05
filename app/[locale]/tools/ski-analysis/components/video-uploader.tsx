'use client';

/**
 * 视频上传组件
 * 支持拖拽和点击上传，预览和验证功能
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Upload, X, Video, AlertCircle, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface VideoUploaderProps {
  onVideoSelect: (file: File, previewUrl: string) => void;
  onVideoRemove: () => void;
  selectedVideo: File | null;
  previewUrl: string | null;
  isAnalyzing: boolean;
}

export function VideoUploader({
  onVideoSelect,
  onVideoRemove,
  selectedVideo,
  previewUrl,
  isAnalyzing,
}: VideoUploaderProps) {
  const t = useTranslations('SkiAnalysis');
  const [dragActive, setDragActive] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 验证文件
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB

    if (!allowedTypes.includes(file.type)) {
      return t('invalidFormat');
    }
    if (file.size > maxSize) {
      return t('fileTooLarge');
    }
    return null;
  };

  // 处理文件选择
  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploadProgress(0);

    // 创建预览 URL
    const url = URL.createObjectURL(file);

    // 模拟上传进度
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 50);

    onVideoSelect(file, url);
  };

  // 处理拖拽
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onVideoRemove();
    setError(null);
    setUploadProgress(0);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="rounded-[var(--radius)]">
      <CardContent className="pt-6">
        {/* 已选择视频预览 */}
        {selectedVideo && previewUrl ? (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={previewUrl}
                controls
                className="w-full h-full object-contain"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                  <Progress value={uploadProgress} className="w-1/2 mb-4" />
                  <p className="text-white text-sm">{t('analyzing')}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedVideo.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedVideo.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={isAnalyzing}
              >
                <X className="h-4 w-4 mr-1" />
                {t('remove')}
              </Button>
            </div>
          </div>
        ) : (
          /* 上传区域 */
          <div
            className={clsx(
              'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isAnalyzing}
            />

            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{t('dragDrop')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('orClick')}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  MP4, WebM, MOV
                </span>
                <span>{t('maxSize')}</span>
              </div>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
