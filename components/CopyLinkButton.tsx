"use client"

import React, { useState } from "react"
import { Link2, Check } from "lucide-react"

interface CopyLinkButtonProps {
  url: string
}

export default function CopyLinkButton({ url }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={`flex items-center gap-1 px-3 py-1.5 rounded bg-background border border-card-border hover:border-neon-pink/50 hover:bg-neon-pink/10 text-xs font-bold transition-all duration-200 ${
        copied ? "text-emerald-400 border-emerald-500/30" : "text-white"
      }`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          Copied!
        </>
      ) : (
        <>
          <Link2 className="w-3.5 h-3.5 text-neon-pink" />
          Copy Link
        </>
      )}
    </button>
  )
}
