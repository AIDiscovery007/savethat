'use client';

import * as React from 'react';
import { UploadIcon, XIcon, WarningCircleIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  accept?: string;
  maxSizeMB?: number;
  maxFiles?: number;
  files?: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  previewType?: 'image' | 'video' | 'none';
  multiple?: boolean;
}

type ValidationResult = { valid: true } | { valid: false; error: string };

const formatFileSize = (bytes: number): string =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const FilePreviewItem = ({
  file,
  previewType,
  multiple,
  disabled,
  onRemove,
}: {
  file: File;
  previewType: string;
  multiple: boolean;
  disabled: boolean;
  onRemove: () => void;
}) => {
  const previewUrl = React.useMemo(() => URL.createObjectURL(file), [file]);
  const cleanup = () => URL.revokeObjectURL(previewUrl);

  const previewContent = React.useMemo(() => {
    if (previewType === 'none') return null;
    if (previewType === 'video') {
      return <video src={previewUrl} controls className="w-full h-full object-contain" onEnded={cleanup} />;
    }
    return <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" onLoad={cleanup} />;
  }, [previewType, previewUrl, file.name]);

  const containerClass = multiple
    ? 'relative group aspect-square rounded-lg overflow-hidden border'
    : 'relative aspect-video bg-black rounded-lg overflow-hidden';

  return (
    <div className={containerClass}>
      {previewContent}
      <div className={cn('absolute top-2 right-2', !multiple && 'inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity')}>
        <Button
          variant="destructive"
          size="icon"
          className="h-8 w-8"
          onClick={onRemove}
          disabled={disabled}
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
      {!multiple && (
        <div className="flex items-center justify-between mt-3">
          <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
        </div>
      )}
      {multiple && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <p className="text-xs text-white truncate">{formatFileSize(file.size)}</p>
        </div>
      )}
    </div>
  );
};

export function FileUploader({
  accept,
  maxSizeMB = 10,
  maxFiles = 5,
  files = [],
  onChange,
  disabled = false,
  previewType = 'image',
  multiple = false,
}: FileUploaderProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const allowedTypes = accept?.split(',').map((t) => t.trim()) || [];
  const canAddMore = files.length < maxFiles;

  const validateFile = (file: File): ValidationResult => {
    if (allowedTypes.length > 0 && !allowedTypes.some((type) => file.type.match(type.replace('*', '.*')))) {
      return { valid: false, error: `不支持的文件类型: ${file.type}` };
    }
    if (file.size > maxSizeBytes) {
      return { valid: false, error: `文件大小不能超过 ${maxSizeMB}MB` };
    }
    return { valid: true };
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    setError(null);
    const remainingSlots = maxFiles - files.length;
    const filesToProcess = multiple
      ? Array.from(selectedFiles).slice(0, remainingSlots)
      : [selectedFiles[0]];

    const newFiles: File[] = [];
    for (const file of filesToProcess) {
      const result = validateFile(file);
      if (!result.valid) {
        setError(result.error);
        break;
      }
      newFiles.push(file);
    }

    if (newFiles.length > 0) {
      onChange(multiple ? [...files, ...newFiles] : newFiles);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files);
  };

  const handleRemove = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
    setError(null);
  };

  const previewContainer = (
    <div className={cn(!multiple && 'grid grid-cols-3 gap-3')}>
      {files.map((file, index) => (
        <FilePreviewItem
          key={index}
          file={file}
          previewType={previewType}
          multiple={multiple}
          disabled={disabled}
          onRemove={() => handleRemove(index)}
        />
      ))}
    </div>
  );

  const singlePreview = files[0] && (
    <Card>
      <CardContent className="pt-6">
        <FilePreviewItem
          file={files[0]}
          previewType={previewType}
          multiple={false}
          disabled={disabled}
          onRemove={() => handleRemove(0)}
        />
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {files.length > 0 && previewType !== 'none' && (multiple ? previewContainer : singlePreview)}

      {(canAddMore || files.length === 0) && (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors',
            dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={disabled || !canAddMore}
          />
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <UploadIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">拖拽文件到此处或点击上传</p>
              <p className="text-xs text-muted-foreground mt-1">
                {accept ? `支持格式: ${accept.replace(/,/g, ', ')}` : '点击选择文件'}
              </p>
            </div>
            {maxSizeMB > 0 && <p className="text-xs text-muted-foreground">最大 {maxSizeMB}MB</p>}
          </div>
        </div>
      )}

      {files.length > 0 && canAddMore && multiple && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircleIcon className="h-3 w-3 text-green-500" />
          已选择 {files.length} 个文件 / 最多 {maxFiles}
        </div>
      )}

      {!canAddMore && multiple && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircleIcon className="h-3 w-3 text-green-500" />
          已达到最大文件数量限制 ({maxFiles})
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <WarningCircleIcon className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
