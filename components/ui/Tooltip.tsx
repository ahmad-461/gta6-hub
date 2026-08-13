import React, { useState } from "react"

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  position?: "top" | "bottom" | "left" | "right"
}

export default function Tooltip({
  content,
  children,
  position = "top",
}: TooltipProps) {
  const [visible, setVisible] = useState(false)

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`absolute z-50 px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-white bg-ink border border-[rgba(245,240,250,0.14)] rounded shadow-xl whitespace-nowrap pointer-events-none transition-all duration-150 animate-in fade-in duration-100 ${positionClasses[position]}`}
        >
          {content}
        </div>
      )}
    </div>
  )
}
