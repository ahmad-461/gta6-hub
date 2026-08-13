import React from "react"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: "magenta" | "cyan" | "violet" | "green" | "yellow" | "gray"
  variant?: "filled" | "outline" | "subtle"
}

export default function Badge({
  color = "magenta",
  variant = "subtle",
  className = "",
  children,
  ...props
}: BadgeProps) {
  const baseStyles = "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border transition-all duration-150"

  const colorVariants = {
    magenta: {
      filled: "bg-magenta text-white border-magenta",
      outline: "bg-transparent text-magenta border-magenta",
      subtle: "bg-magenta/10 text-magenta border-magenta/20",
    },
    cyan: {
      filled: "bg-cyan text-ink border-cyan",
      outline: "bg-transparent text-cyan border-cyan",
      subtle: "bg-cyan/10 text-cyan border-cyan/20",
    },
    violet: {
      filled: "bg-violet text-white border-violet",
      outline: "bg-transparent text-violet border-violet",
      subtle: "bg-violet/10 text-violet border-violet/20",
    },
    green: {
      filled: "bg-emerald-600 text-white border-emerald-600",
      outline: "bg-transparent text-emerald-400 border-emerald-500/30",
      subtle: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    yellow: {
      filled: "bg-amber-500 text-ink border-amber-500",
      outline: "bg-transparent text-amber-400 border-amber-500/30",
      subtle: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    gray: {
      filled: "bg-paper-dim text-ink border-paper-dim",
      outline: "bg-transparent text-paper-dim border-[rgba(245,240,250,0.14)]",
      subtle: "bg-white/5 text-paper-dim border-[rgba(245,240,250,0.06)]",
    },
  }

  return (
    <span
      className={`${baseStyles} ${colorVariants[color][variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
