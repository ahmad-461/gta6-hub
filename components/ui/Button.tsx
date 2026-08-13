import React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "destructive" | "cyan"
  size?: "sm" | "md" | "lg"
  fullWidth?: boolean
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-mono font-bold uppercase tracking-wider rounded transition-all duration-200 outline-none focus:ring-2 focus:ring-cyan focus:ring-offset-2 focus:ring-offset-ink active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none motion-reduce:transition-none motion-reduce:active:scale-100"

  const variantStyles = {
    primary: "bg-magenta hover:bg-magenta/90 text-white shadow-[0_2px_10px_rgba(255,46,136,0.2)] hover:shadow-[0_4px_15px_rgba(255,46,136,0.4)]",
    ghost: "bg-transparent hover:bg-white/[0.06] border border-[rgba(245,240,250,0.14)] hover:border-magenta text-paper",
    cyan: "bg-transparent hover:bg-[#00E5FF]/[0.06] border border-cyan text-cyan hover:shadow-[0_0_12px_rgba(0,229,255,0.2)]",
    destructive: "bg-red-600/20 hover:bg-red-600/40 border border-red-500 text-red-400 hover:shadow-[0_0_12px_rgba(239,68,68,0.2)]",
  }

  const sizeStyles = {
    sm: "px-3 py-1.5 text-[10px]",
    md: "px-5 py-2.5 text-xs",
    lg: "px-8 py-3.5 text-sm",
  }

  const widthStyle = fullWidth ? "w-full" : ""

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
