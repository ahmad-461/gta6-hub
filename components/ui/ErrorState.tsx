import React from "react"
import { AlertTriangle } from "lucide-react"
import Card from "./Card"

interface ErrorStateProps {
  icon?: React.ReactNode
  title?: string
  description: string
  action?: React.ReactNode
  className?: string
}

export default function ErrorState({
  icon = <AlertTriangle className="w-6 h-6 text-red-500" />,
  title = "Telemetry Error",
  description,
  action,
  className = "",
}: ErrorStateProps) {
  return (
    <Card
      variant="standard"
      padding="lg"
      className={`flex flex-col items-center justify-center text-center p-12 border border-red-500/20 bg-red-950/10 ${className}`}
    >
      {icon && (
        <div className="p-4 bg-red-500/10 rounded-full text-red-400 mb-4 border border-red-500/20">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-red-400 font-mono uppercase tracking-wider mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-paper-dim/70 max-w-sm leading-relaxed mb-6">
        {description}
      </p>
      {action && <div className="flex justify-center">{action}</div>}
    </Card>
  )
}
