"use client"

import React, { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function Loading() {
  const [tip, setTip] = useState("")

  useEffect(() => {
    const tips = [
      // Real site tips
      "Tip: Tap the retro phone icon in the bottom-right corner for quick access to all tools.",
      "Tip: Save news and walkthroughs to 'Save Slots' to resume reading on your return.",
      "Tip: Explore articles, complete character matchmaking, and track missions to increase your Wanted Level.",
      "Tip: Use the interactive Lore Map to trace character relationships and storyline connections.",
      "Tip: Read approved community comments at the footer of articles to stay on top of the hype.",
      // Lore / trivia flavor lines (speculative/fan tone)
      "Rumor: Dynamic tropical storms in Leonida are rumored to trigger temporary vehicle hydroplaning and low visibility.",
      "Speculation: Lucia and Jason's partnership is rumor-tracked to feature dynamic weapon trunks and shared inventories.",
      "Theory: The industrial sector of Port Gellhorn is rumored to contain crucial setup gear for high-stakes bank heists.",
      "Clue: Mud Club gatherings in the Grasslands are rumored to host coordinates for highly lucrative contraband caches.",
      "Speculation: Retro beach parties in Vice City’s neon strip are rumored to recruit drivers for midnight street racing.",
      "Clue: Rumored drug shipments along the keys can be monitored by keeping a close watch on local scanner frequencies."
    ]

    // Select random tip on load
    const randomIndex = Math.floor(Math.random() * tips.length)
    setTip(tips[randomIndex])
  }, [])

  return (
    <>
      {/* Inline styles for delay transition to preserve PageSpeed performance budget */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes delayedShow {
          0% { opacity: 0; visibility: hidden; }
          99% { opacity: 0; visibility: hidden; }
          100% { opacity: 1; visibility: visible; }
        }
        .animate-delay-load {
          opacity: 0;
          visibility: hidden;
          animation: delayedShow 0s linear 400ms forwards;
        }
      `}} />

      {/* Full-bleed dark background loading view */}
      <div className="fixed inset-0 bg-[#0B0710] z-[999] flex flex-col items-center justify-center p-6 animate-delay-load select-none font-mono text-[#F5F0FA]">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(245,240,250,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(245,240,250,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />

        {/* Outer classic bordered tip container */}
        <div className="relative max-w-xl w-full bg-[#150C1F]/90 border border-[rgba(245,240,250,0.14)] p-8 rounded shadow-2xl flex flex-col space-y-4">

          {/* HUD targeting corner accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#FF2E88]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#FF2E88]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#FF2E88]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#FF2E88]" />

          {/* Title and Loader header */}
          <div className="flex justify-between items-center border-b border-[rgba(245,240,250,0.1)] pb-3">
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E5FF]"></span>
              </span>
              <span className="text-[10px] font-black uppercase text-[#00E5FF] tracking-widest">
                SYSTEM TELEMETRY LOADING
              </span>
            </div>
            <Loader2 className="w-4 h-4 text-[#FF2E88] animate-spin" />
          </div>

          {/* Tip content block */}
          <div className="py-2 flex items-start space-x-4">
            {/* Spinning/pulsing targeting reticle or compass SVG */}
            <div className="flex-shrink-0 pt-1">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FF2E88"
                strokeWidth="2.5"
                className="animate-spin"
                style={{ animationDuration: "3s" }}
              >
                <circle cx="12" cy="12" r="10" strokeDasharray="6 6" />
                <path d="M12 2V6M12 18V22M2 12H6M18 12H22" />
              </svg>
            </div>

            {/* Tip text */}
            <div className="space-y-1">
              <span className="text-[9px] font-black text-[#9C8FAE] tracking-widest uppercase block">
                LEONIDA INTEL REPORT:
              </span>
              <p className="text-xs text-[#F5F0FA] leading-relaxed font-bold">
                {tip || "Retrieving encrypted server data slots..."}
              </p>
            </div>
          </div>
        </div>

        {/* Small footer tag */}
        <div className="absolute bottom-8 text-[9px] text-[#9C8FAE]/50 tracking-widest uppercase">
          VICE CITY HUB SECURE LINK ACTIVE
        </div>
      </div>
    </>
  )
}
