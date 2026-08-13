import React from "react"

interface LoadingSkeletonProps {
  type?: "card" | "table" | "text"
  rows?: number
  cols?: number
  className?: string
}

export default function LoadingSkeleton({
  type = "text",
  rows = 4,
  cols = 3,
  className = "",
}: LoadingSkeletonProps) {
  const baseStyle = "animate-pulse rounded bg-paper-dim/10 motion-reduce:animate-none"

  if (type === "card") {
    return (
      <div className={`border border-[rgba(245,240,250,0.14)] bg-ink-2 rounded-xl p-5 space-y-4 ${className}`}>
        <div className="flex justify-between items-center">
          <div className={`h-3 w-20 ${baseStyle}`} />
          <div className={`h-4 w-4 rounded-full ${baseStyle}`} />
        </div>
        <div className={`h-7 w-28 ${baseStyle}`} />
        <div className={`h-3 w-36 ${baseStyle}`} />
      </div>
    )
  }

  if (type === "table") {
    return (
      <div className={`border border-[rgba(245,240,250,0.14)] bg-ink-2 rounded-lg overflow-hidden ${className}`}>
        {/* Header Row */}
        <div className="flex items-center space-x-4 bg-ink/40 p-4 border-b border-[rgba(245,240,250,0.08)]">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div key={colIdx} className={`h-3.5 flex-1 ${baseStyle}`} />
          ))}
        </div>
        {/* Table Rows */}
        <div className="divide-y divide-[rgba(245,240,250,0.06)] p-4 space-y-4">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex items-center space-x-4 pt-4 first:pt-0">
              {Array.from({ length: cols }).map((_, colIdx) => (
                <div key={colIdx} className={`h-3 flex-1 ${baseStyle}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Text variant
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className={`h-3 ${baseStyle}`}
          style={{ width: idx === rows - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  )
}
