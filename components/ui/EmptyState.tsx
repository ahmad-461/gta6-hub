import React from "react"
import Card from "./Card"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <Card
      variant="standard"
      padding="lg"
      className={`flex flex-col items-center justify-center text-center p-12 border-dashed border-2 border-[rgba(245,240,250,0.08)] bg-ink-2/40 ${className}`}
    >
      {icon && (
        <div className="p-4 bg-white/5 rounded-full text-paper-dim/40 mb-4 animate-pulse">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-paper font-mono uppercase tracking-wider mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-paper-dim/60 max-w-sm leading-relaxed mb-6">
        {description}
      </p>
      {action && <div className="flex justify-center">{action}</div>}
    </Card>
  )
}
