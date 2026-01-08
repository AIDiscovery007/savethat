import type React from "react"
import { cn } from "@/lib/utils"

interface LegoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: "yellow" | "black" | "white" | "blue"
  size?: "sm" | "md" | "lg"
  children: React.ReactNode
}

export function LegoButton({ color = "black", size = "md", className, children, ...props }: LegoButtonProps) {
  const styles = {
    yellow:
      "bg-[#FFCF00] text-black border-[#cca700] hover:bg-[#ffdb4d] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-0 active:mt-[4px]",
    black:
      "bg-[#111] text-white border-[#000] hover:bg-[#222] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-0 active:mt-[4px]",
    white:
      "bg-white text-black border-neutral-300 hover:bg-neutral-50 hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-0 active:mt-[4px]",
    blue: "bg-[#0055BF] text-white border-[#003d8c] hover:bg-[#0066CC] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-0 active:mt-[4px]",
  }

  const sizes = {
    sm: "px-4 py-2 text-xs border-b-[3px]",
    md: "px-6 py-3 text-sm border-b-[4px]",
    lg: "px-8 py-4 text-base border-b-[6px]",
  }

  return (
    <button
      className={cn(
        "relative font-bold tracking-wide uppercase transition-all rounded-lg shadow-sm",
        styles[color],
        sizes[size],
        className,
      )}
      {...props}
    >
      {/* Studs effect on top for subtle texture */}
      <div className="absolute top-0.5 left-1 right-1 flex justify-between opacity-20 pointer-events-none">
        <div className="w-full h-[1px] bg-white/30" />
      </div>
      <span className="flex items-center gap-2 relative z-10">{children}</span>
    </button>
  )
}
