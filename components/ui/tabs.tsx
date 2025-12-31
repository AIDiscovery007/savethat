"use client"

import * as React from "react"
import { Tabs } from "@base-ui/react/tabs"

import { cn } from "@/lib/utils"

function TabsRoot({
  className,
  ...props
}: React.ComponentProps<typeof Tabs.Root>) {
  return <Tabs.Root data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props} />
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof Tabs.List>) {
  return (
    <Tabs.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-none p-0.5 *:data-[selected]:bg-background *:data-[selected]:shadow-sm *:data-[selected]:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsTab({
  className,
  ...props
}: React.ComponentProps<typeof Tabs.Tab>) {
  return (
    <Tabs.Tab
      data-slot="tabs-trigger"
      className={cn(
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:focus-visible:ring-offset-background/20 dark:focus-visible:ring-offset-background/10 aria-disabled:pointer-events-none aria-disabled:opacity-50 text-foreground shadow-xs inline-flex h-full items-center justify-center whitespace-nowrap rounded-none px-3 text-xs font-medium transition-[color,box-shadow] focus-visible:ring-1 focus-visible:outline-1 data-[selected]:shadow-sm disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsPanel({
  className,
  ...props
}: React.ComponentProps<typeof Tabs.Panel>) {
  return (
    <Tabs.Panel
      data-slot="tabs-content"
      className={cn("focus-visible:ring-ring/50 dark:focus-visible:ring-offset-background/20 dark:focus-visible:ring-offset-background/10 outline-ring/50 dark:outline-ring/20 flex focus-visible:ring-1 focus-visible:outline-1", className)}
      {...props}
    />
  )
}

export { TabsRoot, TabsList, TabsTab, TabsPanel }
