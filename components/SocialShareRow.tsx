"use client"

import React, { useState, useEffect } from "react"
import { Twitter, HelpCircle, PhoneCall, Copy, Check } from "lucide-react"

interface SocialShareRowProps {
  title: string
}

export default function SocialShareRow({ title }: SocialShareRowProps) {
  const [url, setUrl] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(window.location.href)
    }
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy URL:", err)
    }
  }

  const shareText = encodeURIComponent(`Check out this GTA 6 Hub article: ${title}`)
  const shareUrl = encodeURIComponent(url)

  return (
    <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-card-border">
      <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider mr-2">Share:</span>

      {/* Twitter / X */}
      <a
        href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 bg-card-bg hover:bg-neon-pink/10 border border-card-border hover:border-neon-pink px-3 py-1.5 rounded text-xs font-semibold text-foreground/80 hover:text-white transition-all duration-200"
      >
        <Twitter className="w-3.5 h-3.5 text-neon-pink" />
        X (Twitter)
      </a>

      {/* Reddit */}
      <a
        href={`https://www.reddit.com/submit?title=${encodeURIComponent(title)}&url=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 bg-card-bg hover:bg-neon-purple/10 border border-card-border hover:border-neon-purple px-3 py-1.5 rounded text-xs font-semibold text-foreground/80 hover:text-white transition-all duration-200"
      >
        <HelpCircle className="w-3.5 h-3.5 text-neon-purple" />
        Reddit
      </a>

      {/* WhatsApp */}
      <a
        href={`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 bg-card-bg hover:bg-emerald-500/10 border border-card-border hover:border-emerald-500 px-3 py-1.5 rounded text-xs font-semibold text-foreground/80 hover:text-white transition-all duration-200"
      >
        <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
        WhatsApp
      </a>

      {/* Copy Link */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 bg-card-bg hover:bg-neon-blue/10 border border-card-border hover:border-neon-blue px-3 py-1.5 rounded text-xs font-semibold text-foreground/80 hover:text-white transition-all duration-200"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 text-neon-blue" />
            Copy Link
          </>
        )}
      </button>
    </div>
  )
}
