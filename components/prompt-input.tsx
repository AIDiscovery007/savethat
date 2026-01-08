'use client';

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PaperclipIcon, X } from '@phosphor-icons/react';

export interface ReferenceImage {
  id: string;
  file: File;
  preview: string;
  base64: string;
}

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
  rows?: number;
  showCount?: boolean;
  submitOnCtrlEnter?: boolean;
  autoResize?: boolean; // 控制是否自动调整高度
  // 图片附件相关
  images?: ReferenceImage[];
  onImagesChange?: (images: ReferenceImage[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
  className,
  maxLength = 2000,
  rows = 4,
  showCount = true,
  submitOnCtrlEnter = false,
  autoResize = true,
  images = [],
  onImagesChange,
  maxImages = 5,
  maxSizeMB = 4,
}: PromptInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-resize height
  React.useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, autoResize]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (submitOnCtrlEnter && onSubmit && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  const charCount = value.length;
  const isNearMax = charCount >= maxLength * 0.9;
  const canAddMore = images.length < maxImages;

  // 验证文件
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return '不支持的图片格式，请上传 JPG、PNG、WebP 或 GIF';
    }
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `图片过大，最大支持 ${maxSizeMB}MB`;
    }
    return null;
  };

  // 将文件转换为 base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // 处理文件选择
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || !onImagesChange) return;

    const remainingSlots = maxImages - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    const newImages: ReferenceImage[] = [];

    for (const file of filesToProcess) {
      const validationError = validateFile(file);
      if (validationError) {
        alert(validationError);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        const newImage: ReferenceImage = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          preview: URL.createObjectURL(file),
          base64,
        };
        newImages.push(newImage);
      } catch (err) {
        console.error('Failed to read file:', err);
        alert('读取文件失败');
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 移除图片
  const handleRemove = (id: string) => {
    const imageToRemove = images.find((img) => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    onImagesChange?.(images.filter((img) => img.id !== id));
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative rounded-lg border transition-colors',
          isFocused ? 'border-primary ring-1 ring-primary' : 'border-input',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* 图片预览区域 */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-0">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group w-10 h-10 rounded-md overflow-hidden shrink-0"
              >
                <img
                  src={image.preview}
                  alt={image.file.name}
                  className="w-full h-full object-cover"
                />
                {/* 悬浮删除按钮 */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white hover:text-red-500 hover:bg-red-500/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(image.id);
                    }}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex items-end">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            maxLength={maxLength}
            className={cn(
              'border-0 p-3 shadow-none resize-none min-h-[60px]',
              'focus-visible:ring-0 focus-visible:ring-offset-0',
              disabled && 'cursor-not-allowed',
              autoResize === false && 'h-[240px] overflow-y-auto'
            )}
          />

          {/* 曲别针上传按钮 */}
          {canAddMore && (
            <label className="absolute bottom-2 right-3 cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="sr-only"
                disabled={disabled}
              />
              <PaperclipIcon className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            </label>
          )}

          {showCount && !images.length && (
            <div
              className={cn(
                'absolute bottom-2 right-10 text-xs transition-colors',
                isNearMax ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              {charCount}/{maxLength}
            </div>
          )}
        </div>
      </div>

      {submitOnCtrlEnter && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Enter</kbd>
          <span>提交</span>
        </div>
      )}
    </div>
  );
}
