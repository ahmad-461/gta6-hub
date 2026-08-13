import React from "react"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg"
  variant?: "standard" | "console" | "transparent"
  hoverGlow?: "none" | "magenta" | "cyan" | "violet"
  interactive?: boolean
  showCornerBrackets?: boolean
}

export default function Card({
  padding = "md",
  variant = "standard",
  hoverGlow = "none",
  interactive = false,
  showCornerBrackets = false,
  className = "",
  children,
  ...props
}: CardProps) {
  const baseStyles = "relative border rounded text-paper transition-all duration-300 overflow-hidden"

  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  }

  const variantStyles = {
    standard: "bg-ink-2 border-[rgba(245,240,250,0.14)] shadow-lg",
    console: "bg-ink/85 border-[rgba(245,240,250,0.14)] backdrop-blur-md shadow-2xl",
    transparent: "bg-transparent border-[rgba(245,240,250,0.08)]",
  }

  const glowStyles = {
    none: "",
    magenta: "hover:border-magenta hover:shadow-[0_4px_20px_rgba(255,46,136,0.15)]",
    cyan: "hover:border-cyan hover:shadow-[0_4px_20px_rgba(0,229,255,0.15)]",
    violet: "hover:border-violet hover:shadow-[0_4px_20px_rgba(108,31,181,0.15)]",
  }

  const interactiveStyles = interactive
    ? "hover:-translate-y-1 cursor-pointer motion-reduce:hover:translate-y-0"
    : ""

  return (
    <div
      className={`${baseStyles} ${paddingStyles[padding]} ${variantStyles[variant]} ${glowStyles[hoverGlow]} ${interactiveStyles} ${className}`}
      {...props}
    >
      {/* Corner Bracket Reticles (if enabled) */}
      {showCornerBrackets && (
        <>
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan z-20 pointer-events-none" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan z-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan z-20 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan z-20 pointer-events-none" />
        </>
      )}
      {children}
    </div>
  )
}
