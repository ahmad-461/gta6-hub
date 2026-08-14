"use client"

import React, { useState } from "react"
import { Share2, Check, Copy } from "lucide-react"
import { toast } from "sonner"

interface DossierShareButtonProps {
  slug: string
  characterName: string
}

export default function DossierShareButton({ slug, characterName }: DossierShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    // Determine target URL to share
    const shareUrl = `${window.location.origin}/characters/${slug}`
    const shareTitle = `${characterName} - Classified Dossier | GTA VI Hub`
    const shareText = `Check out the declassified intel dossier for ${characterName} on GTA VI Hub!`

    // 1. Try Navigator Share API first (highly interactive for mobile/modern devices)
    if (navigator.share && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
        toast.success("Dossier shared successfully!")
        return
      } catch (err: any) {
        // AbortError means user cancelled the share, don't show error toast
        if (err.name !== "AbortError") {
          console.warn("Navigator share failed, falling back to copy:", err)
        } else {
          return // User closed it
        }
      }
    }

    // 2. Fallback to copying the link
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success("Dossier link copied to clipboard!")
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      toast.error("Failed to copy dossier link.")
      console.error("Clipboard copy failed:", err)
    }
  }

  return (
    <button
      onClick={handleShare}
      type="button"
      className={`inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all duration-300 border ${
        copied
          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
          : "bg-[#0B0B0F] border-[#FF2D8D]/40 text-[#FF2D8D] hover:bg-[#FF2D8D] hover:text-white hover:shadow-[0_0_15px_rgba(255,45,141,0.4)]"
      }`}
      title="Share Profile / Export Dossier"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 animate-pulse" />
          <span>DOSSIER COPIED!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          <span>SHARE DOSSIER</span>
        </>
      )}
    </button>
  )
}
