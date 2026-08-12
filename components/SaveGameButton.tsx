"use client"

import React, { useState, useEffect } from "react"
import { Save, Loader2, Disc } from "lucide-react"

interface SaveGameButtonProps {
  slug: string
  title: string
  type: "news" | "guide"
  categoryName: string
  categorySlug?: string
}

export default function SaveGameButton({
  slug,
  title,
  type,
  categoryName,
  categorySlug,
}: SaveGameButtonProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveStep, setSaveStep] = useState<"none" | "writing" | "done">("none")
  const [isSaved, setIsSaved] = useState(false)

  // Determine if this slug is already saved in localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = localStorage.getItem("gta_hub_save_slots")
    if (raw) {
      try {
        const slots = JSON.parse(raw)
        if (Array.isArray(slots)) {
          const exists = slots.some((s: any) => s.slug === slug)
          setIsSaved(exists)
        }
      } catch (err) {
        console.error("Failed to parse save slots", err)
      }
    }
  }, [slug])

  const handleSave = () => {
    if (typeof window === "undefined") return

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const executeSaveState = () => {
      // Fetch existing saves
      const raw = localStorage.getItem("gta_hub_save_slots")
      let slots: any[] = []
      if (raw) {
        try {
          slots = JSON.parse(raw)
          if (!Array.isArray(slots)) slots = []
        } catch {
          slots = []
        }
      }

      // Filter out existing save for same slug to avoid duplicate
      slots = slots.filter((s: any) => s.slug !== slug)

      // Add new save as Slot 1 (unshift)
      slots.unshift({
        slug,
        title,
        type,
        categoryName,
        categorySlug: categorySlug || "",
        savedAt: Date.now(),
      })

      // Keep only up to 3 slots
      const cappedSlots = slots.slice(0, 3)

      localStorage.setItem("gta_hub_save_slots", JSON.stringify(cappedSlots))
      setIsSaved(true)
    }

    if (prefersReduced) {
      // Instantly save without overlay animation
      executeSaveState()
      return
    }

    // Execute with immersive retro overlay save game animation!
    setIsSaving(true)
    setSaveStep("writing")

    // Step 1: Write to card (1000ms)
    setTimeout(() => {
      executeSaveState()
      setSaveStep("done")

      // Step 2: Show Done (400ms)
      setTimeout(() => {
        setIsSaving(false)
        setSaveStep("none")
      }, 450)
    }, 1000)
  }

  return (
    <>
      <button
        onClick={handleSave}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all duration-200 border
          ${isSaved
            ? "bg-[#FF2E88]/10 hover:bg-[#FF2E88]/20 border-[#FF2E88]/40 hover:border-[#FF2E88] text-[#FF2E88]"
            : "bg-[#0B0710] hover:bg-[#00E5FF]/10 border-[rgba(245,240,250,0.14)] hover:border-[#00E5FF] text-[#9C8FAE] hover:text-[#00E5FF]"
          }
        `}
        title={isSaved ? "Overwrite existing Save Slot" : "Save this content to Save Game Slots"}
      >
        <Save className="w-3.5 h-3.5" />
        {isSaved ? "Slotted (Overwrite)" : "Save Game"}
      </button>

      {/* PS2 Retro Immersive Save Overlay */}
      {isSaving && (
        <div className="fixed inset-0 z-[9999] bg-[#0B0710]/95 flex items-center justify-center p-6 select-none font-mono text-[#F5F0FA]">
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(245,240,250,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(245,240,250,0.1)_1px,transparent_1px)] bg-[size:25px_25px]" />

          <div className="relative p-10 max-w-sm w-full bg-[#150C1F] border-2 border-[#FF2E88]/60 rounded-xl shadow-2xl flex flex-col items-center justify-center space-y-6 text-center">

            {/* Retro Reticle Brackets */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#FF2E88]" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#FF2E88]" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#FF2E88]" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#FF2E88]" />

            {/* Spinning disc animation */}
            <div className="relative">
              <Disc
                className={`w-16 h-16 text-[#00E5FF] ${
                  saveStep === "writing" ? "animate-spin" : "scale-110 text-emerald-400"
                } transition-all duration-300`}
                style={{ animationDuration: "1s" }}
              />
              {saveStep === "writing" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-4.5 h-4.5 bg-[#FF2E88] rounded-full animate-ping" />
                </div>
              )}
            </div>

            {saveStep === "writing" ? (
              <div className="space-y-1">
                <h4 className="text-sm font-black uppercase text-[#FF2E88] tracking-widest">
                  SAVING DATA TO SLOTS...
                </h4>
                <p className="text-[10px] text-[#9C8FAE] leading-relaxed">
                  WRITING TO INTERNAL MEMORY CARD.<br />
                  DO NOT POWER OFF SYSTEM OR CLOSE TAB.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <h4 className="text-sm font-black uppercase text-emerald-400 tracking-widest">
                  SAVE SUCCESSFUL!
                </h4>
                <p className="text-[10px] text-[#9C8FAE]">
                  SLOT 1 CONTENT SYNCHRONIZED OK.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
