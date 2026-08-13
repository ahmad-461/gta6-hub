import React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  textarea?: boolean
  rows?: number
  label?: string
  error?: string
}

export default React.forwardRef<HTMLInputElement & HTMLTextAreaElement, InputProps>(function Input(
  { textarea = false, rows = 4, label, error, className = "", ...props },
  ref
) {
  const inputStyles = `w-full bg-ink border border-[rgba(245,240,250,0.14)] focus:border-cyan focus:ring-1 focus:ring-cyan outline-none text-sm text-paper rounded px-4 py-2.5 transition-all placeholder:text-paper-dim/30 ${
    error ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : ""
  } ${className}`

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label className="block text-[10px] uppercase font-mono font-bold tracking-widest text-paper-dim">
          {label}
        </label>
      )}
      {textarea ? (
        <textarea
          ref={ref as any}
          rows={rows}
          className={inputStyles}
          {...(props as any)}
        />
      ) : (
        <input
          ref={ref as any}
          className={inputStyles}
          {...(props as any)}
        />
      )}
      {error && (
        <p className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">
          {error}
        </p>
      )}
    </div>
  )
})
