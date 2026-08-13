import React, { useEffect } from "react"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div
        className={`relative w-full ${sizeClasses[size]} bg-ink-2 border border-[rgba(245,240,250,0.14)] rounded-xl shadow-2xl overflow-hidden z-10 transition-all duration-300 animate-in fade-in zoom-in-95 duration-150`}
        role="dialog"
        aria-modal="true"
      >
        {/* Subtle top indicator line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-magenta via-violet to-cyan" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[rgba(245,240,250,0.08)] bg-ink/40">
          {title ? (
            <h3 className="text-sm font-bold font-mono text-paper uppercase tracking-widest">
              {title}
            </h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-paper-dim/60 hover:text-white hover:bg-white/5 transition-all outline-none focus:ring-1 focus:ring-cyan"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[80vh] text-paper-dim text-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
