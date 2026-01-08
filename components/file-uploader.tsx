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

  const validateFile = (file: File): string | null => {
    if (allowedTypes.length > 0 && !allowedTypes.some((type) => file.type.match(type.replace('*', '.*')))) {
      return `不支持的文件类型: ${file.type}`;
    }
    if (file.size > maxSizeBytes) return `文件大小不能超过 ${maxSizeMB}MB`;
    return null;
  };

  const formatFileSize = (bytes: number): string =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setError(null);
    const remainingSlots = maxFiles - files.length;
    const filesToProcess = multiple
      ? Array.from(selectedFiles).slice(0, remainingSlots)
      : [selectedFiles[0]];

    const newFiles = filesToProcess.filter(file => {
      const validationError = validateFile(file);
      if (validationError) setError(validationError);
      return !validationError;
    });

    if (newFiles.length > 0) {
      onChange(multiple ? [...files, ...newFiles] : newFiles);
    }
    fileInputRef.current && (fileInputRef.current.value = '');
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
    e.dataTransfer.files.length > 0 && handleFileSelect(e.dataTransfer.files);
  };

  const handleRemove = (index: number) => {
    URL.revokeObjectURL(URL.createObjectURL(files[index]));
    onChange(files.filter((_, i) => i !== index));
    setError(null);
  };

  const renderPreview = (file: File, index: number) => {
    if (previewType === 'none') return null;
    const previewUrl = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(previewUrl);

    if (previewType === 'video') {
      return <video key={index} src={previewUrl} controls className="w-full h-full object-contain" onEnded={cleanup} />;
    }
    return <img key={index} src={previewUrl} alt={file.name} className="w-full h-full object-cover" onLoad={cleanup} />;
  };

  const renderSinglePreview = () => (
    <Card>
      <CardContent className="pt-6">
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {renderPreview(files[0], 0)}
          <div className="absolute top-2 right-2">
            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleRemove(0)} disabled={disabled}>
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-sm font-medium truncate max-w-[200px]">{files[0].name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(files[0].size)}</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderMultiplePreviews = () => (
    <div className="grid grid-cols-3 gap-3">
      {files.map((file, index) => (
        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border">
          {previewType !== 'none' && renderPreview(file, index)}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleRemove(index)} disabled={disabled}>
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <p className="text-xs text-white truncate">{formatFileSize(file.size)}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {files.length > 0 && previewType !== 'none' && (
        !multiple ? renderSinglePreview() : renderMultiplePreviews()
      )}

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
