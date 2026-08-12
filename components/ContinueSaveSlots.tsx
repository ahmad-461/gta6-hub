"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Play, Trash2, FolderOpen, AlertCircle } from "lucide-react"

interface SaveSlot {
  slug: string
  title: string
  type: "news" | "guide"
  categoryName: string
  categorySlug: string
  savedAt: number
}

export default function ContinueSaveSlots() {
  const [slots, setSlots] = useState<SaveSlot[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const raw = localStorage.getItem("gta_hub_save_slots")
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setSlots(parsed)
        }
      } catch (err) {
        console.error("Failed to load save slots", err)
      }
    }
  }, [])

  const handleDeleteSlot = (e: React.MouseEvent, slugToDelete: string) => {
    e.preventDefault()
    e.stopPropagation()
    const updated = slots.filter((slot) => slot.slug !== slugToDelete)
    setSlots(updated)
    localStorage.setItem("gta_hub_save_slots", JSON.stringify(updated))
  }

  // Format relative time (e.g. "Last Saved: 2 hours ago", "Last Saved: 3 days ago")
  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} ${days === 1 ? "day" : "days"} ago`
    if (hours > 0) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`
    if (minutes > 0) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`
    return "Just now"
  }

  if (!isClient || slots.length === 0) return null

  // Ensure we always represent exactly 3 slots to match the classic console save screen layout
  const totalSlotsCount = 3
  const renderedSlots = Array.from({ length: totalSlotsCount }).map((_, index) => {
    return slots[index] || null
  })

  return (
    <section className="w-full bg-[#150C1F] border-b border-[rgba(245,240,250,0.14)] py-12 px-4 sm:px-6 lg:px-12 relative overflow-hidden z-20">
      {/* Subtle scanline CRT overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.4)_0px,rgba(0,0,0,0.4)_1px,transparent_1px,transparent_3px)]" />

      <div className="max-w-7xl mx-auto w-full space-y-6">

        {/* Save Slots Title block */}
        <div className="flex items-center justify-between border-b border-[rgba(245,240,250,0.1)] pb-3">
          <div className="flex items-center space-x-2.5">
            <FolderOpen className="w-4 h-4 text-[#FF2E88] animate-pulse" />
            <h3 className="font-anton text-lg tracking-wider text-[#F5F0FA] uppercase">
              LOAD GAME / RESUME MISSION
            </h3>
          </div>
          <div className="hidden sm:flex items-center space-x-1 font-mono text-[10px] text-[#9C8FAE]">
            <AlertCircle size={12} className="text-[#00E5FF]" />
            <span>SELECT SLOT TO RESUME READING</span>
          </div>
        </div>

        {/* 3 Save slots grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderedSlots.map((slot, index) => {
            const slotNum = index + 1

            if (!slot) {
              return (
                <div
                  key={index}
                  className="border border-dashed border-[rgba(245,240,250,0.1)] bg-[#0B0710]/40 rounded-lg p-6 flex flex-col items-center justify-center h-32 select-none"
                >
                  <span className="font-mono text-[10px] tracking-widest text-[#9C8FAE]/40 uppercase font-black">
                    SLOT {slotNum}
                  </span>
                  <span className="font-mono text-xs text-[#9C8FAE]/25 font-bold uppercase mt-2">
                    [ EMPTY SLOT ]
                  </span>
                </div>
              )
            }

            const targetUrl =
              slot.type === "news"
                ? `/news/${slot.slug}`
                : `/guides/${slot.categorySlug}/${slot.slug}`

            return (
              <Link
                key={slot.slug}
                href={targetUrl}
                className="group relative block border border-[rgba(245,240,250,0.14)] hover:border-[#00E5FF] bg-[#0B0710] hover:bg-[#FF2E88]/5 rounded-lg p-5 transition-all duration-300 h-32 flex flex-col justify-between shadow-md"
              >
                {/* HUD Corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00E5FF]/40 group-hover:border-[#00E5FF]" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00E5FF]/40 group-hover:border-[#00E5FF]" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00E5FF]/40 group-hover:border-[#00E5FF]" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00E5FF]/40 group-hover:border-[#00E5FF]" />

                {/* Top slots info */}
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="font-black text-[#FF2E88] tracking-widest">
                    SLOT {slotNum}
                  </span>
                  <span className="bg-[#150C1F] text-[#00E5FF] px-1.5 py-0.5 rounded uppercase font-extrabold tracking-wider border border-[rgba(245,240,250,0.06)]">
                    {slot.categoryName}
                  </span>
                </div>

                {/* Slot Headline */}
                <div className="mt-1 flex-grow">
                  <h4 className="text-sm font-bold text-[#F5F0FA] group-hover:text-[#00E5FF] transition-colors line-clamp-1 leading-snug">
                    {slot.title}
                  </h4>
                </div>

                {/* Bottom slot status details */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[rgba(245,240,250,0.06)]">
                  <span className="font-mono text-[9px] text-[#9C8FAE] tracking-tight uppercase">
                    Last Saved: {getRelativeTime(slot.savedAt)}
                  </span>

                  {/* Actions inside slot */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleDeleteSlot(e, slot.slug)}
                      aria-label="Delete Save Slot"
                      className="p-1 text-[#9C8FAE]/40 hover:text-[#FF2E88] transition-colors rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                    <div className="text-[#00E5FF] group-hover:scale-110 transition-transform">
                      <Play size={12} fill="currentColor" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

      </div>
    </section>
  )
}
