'use client';

import { IconProps } from '@phosphor-icons/react';
import { ReactNode } from 'react';
import { Button } from './button';

interface EmptyProps {
  /**
   * 图标组件（来自 @phosphor-icons/react）
   */
  icon?: React.ComponentType<IconProps>;
  /**
   * 标题文字
   */
  title?: string;
  /**
   * 描述文字
   */
  description?: string;
  /**
   * 操作按钮配置
   */
  action?: {
    label: string;
    onClick: () => void;
  };
  /**
   * 自定义类名
   */
  className?: string;
}

export function Empty({
  icon: Icon,
  title = '暂无数据',
  description,
  action,
  className,
}: EmptyProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      {Icon && (
        <div className="rounded-full bg-muted/50 p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-2 max-w-sm">
        {title && (
          <h3 className="text-lg font-medium">{title}</h3>
        )}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {action && (
          <Button
            variant="default"
            onClick={action.onClick}
            className="mt-4"
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
