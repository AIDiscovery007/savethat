"use client"

import * as React from "react"
import { TriangleAlert } from "@lobehub/icons"
import type { LucideIcon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ConfirmDialogProps {
  /** Trigger element (only used when not controlling open state manually) */
  trigger?: React.ReactNode
  /** Controlled open state */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Dialog title */
  title: string
  /** Dialog description */
  description: string
  /** Confirm button label */
  confirmLabel?: string
  /** Cancel button label */
  cancelLabel?: string
  /** Icon to display (default: warning icon for destructive) */
  icon?: React.ReactNode
  /** Icon shown on the left side */
  iconNode?: React.ReactNode
  /** Variant for confirm button */
  confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  /** Size for confirm button */
  confirmSize?: React.ComponentProps<typeof Button>["size"]
  /** Size for cancel button */
  cancelSize?: React.ComponentProps<typeof Button>["size"]
  /** Additional className for content */
  className?: string
  /** Callback when confirmed */
  onConfirm?: () => void
  /** Destructive mode (shows warning icon by default) */
  destructive?: boolean
}

export interface ConfirmDialogSimpleProps extends Omit<ConfirmDialogProps, "open" | "onOpenChange"> {
  /** Trigger element */
  trigger: React.ReactNode
}

function ConfirmDialogContentInner({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  icon,
  iconNode,
  confirmVariant = "default",
  confirmSize = "default",
  cancelSize = "default",
  className,
  onConfirm,
}: Omit<ConfirmDialogProps, "open" | "onOpenChange" | "trigger" | "destructive">) {
  return (
    <AlertDialogContent className={className}>
      <AlertDialogMedia className="bg-destructive/10 border-destructive/20 [&_svg]:text-destructive">
        {icon}
      </AlertDialogMedia>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel asChild>
          <Button variant="outline" size={cancelSize}>
            {cancelLabel}
          </Button>
        </AlertDialogCancel>
        <AlertDialogAction asChild>
          <Button
            variant={confirmVariant}
            size={confirmSize}
            onClick={(e) => {
              onConfirm?.()
              // Let the dialog close naturally via AlertDialog
            }}
          >
            {confirmLabel}
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}

/**
 * ConfirmDialog - 可复用的确认弹窗组件
 *
 * 支持两种使用模式：
 * 1. 手动控制模式：通过 open/onOpenChange 控制显隐
 * 2. 触发器模式：通过 trigger 自动管理状态
 */
export function ConfirmDialog({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  icon,
  iconNode,
  confirmVariant = "default",
  confirmSize = "default",
  cancelSize = "default",
  className,
  onConfirm,
  destructive = false,
}: ConfirmDialogProps) {
  const defaultIcon = destructive ? (
    <TriangleAlert className="size-6" />
  ) : null

  // Trigger 模式：自动管理内部状态
  if (trigger !== undefined && open === undefined) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
        <ConfirmDialogContentInner
          title={title}
          description={description}
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
          icon={icon ?? (destructive ? defaultIcon : null)}
          iconNode={iconNode}
          confirmVariant={confirmVariant}
          confirmSize={confirmSize}
          cancelSize={cancelSize}
          className={className}
          onConfirm={onConfirm}
        />
      </AlertDialog>
    )
  }

  // 手动控制模式
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <ConfirmDialogContentInner
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        icon={icon ?? (destructive ? defaultIcon : null)}
        iconNode={iconNode}
        confirmVariant={confirmVariant}
        confirmSize={confirmSize}
        cancelSize={cancelSize}
        className={className}
        onConfirm={onConfirm}
      />
    </AlertDialog>
  )
}

/**
 * 简化的确认弹窗 - 只支持触发器模式
 *
 * @example
 * ```tsx
 * <ConfirmDialogSimple
 *   trigger={<Button variant="destructive">删除</Button>}
 *   title="确认删除"
 *   description="此操作无法撤销"
 *   onConfirm={handleDelete}
 * />
 * ```
 */
export function ConfirmDialogSimple(props: ConfirmDialogSimpleProps) {
  const { trigger, ...rest } = props
  return <ConfirmDialog trigger={trigger} {...rest} />
}

export { AlertDialog, AlertDialogAction, AlertDialogCancel }
