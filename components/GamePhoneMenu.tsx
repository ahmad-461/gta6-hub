"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Search, Flame, Award, Swords, MessageSquare, ChevronRight, Wifi, Battery } from "lucide-react"

export default function GamePhoneMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const phoneRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Close phone when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Handle Escape key and focus trap
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
        triggerRef.current?.focus()
        return
      }

      if (e.key === "Tab" && phoneRef.current) {
        const focusableElements = phoneRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    // Focus first element in phone on open
    setTimeout(() => {
      const focusable = phoneRef.current?.querySelectorAll<HTMLElement>('button, [href]')
      if (focusable && focusable.length > 1) {
        // focus the first item (not the header button if any)
        focusable[0]?.focus()
      }
    }, 50)

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  const contacts = [
    {
      name: "Search Hub",
      icon: Search,
      action: () => {
        router.push("/search?focus=true")
      },
    },
    {
      name: "Cheat Finder",
      icon: Flame,
      action: () => {
        router.push("/cheats")
      },
    },
    {
      name: "Character Quiz",
      icon: Swords,
      action: () => {
        router.push("/tools/which-character")
      },
    },
    {
      name: "Community Points",
      icon: Award,
      action: () => {
        router.push("/community")
      },
    },
    {
      name: "Ask The Hub",
      icon: MessageSquare,
      action: () => {
        // Dispatch custom event to trigger ChatWidget
        window.dispatchEvent(new CustomEvent("toggle-chat-widget", { detail: { open: true } }))
      },
    },
  ]

  return (
    <>
      {/* Phone Icon Trigger */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Phone Menu"
        aria-expanded={isOpen}
        className="fixed bottom-6 right-6 z-[100] p-3 bg-[#150C1F] hover:bg-[#FF2E88]/10 border border-[#FF2E88]/50 hover:border-[#FF2E88] text-[#FF2E88] hover:text-white rounded shadow-[0_0_15px_rgba(255,46,136,0.2)] hover:shadow-[0_0_25px_rgba(255,46,136,0.4)] transition-all duration-300"
      >
        {/* Chunky Retro Phone Silhouette SVG */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
          className="w-6 h-6 animate-pulse"
        >
          {/* Antenna */}
          <path d="M17 2V5" />
          <circle cx="17" cy="2" r="1" fill="currentColor" />
          {/* Main Body */}
          <rect x="6" y="5" width="11" height="17" rx="1.5" />
          {/* Screen Border */}
          <rect x="8" y="7" width="7" height="5" />
          {/* Grid buttons (Chunky/Pixel style) */}
          <line x1="9" y1="14" x2="10" y2="14" />
          <line x1="12" y1="14" x2="13" y2="14" />
          <line x1="9" y1="16" x2="10" y2="16" />
          <line x1="12" y1="16" x2="13" y2="16" />
          <line x1="9" y1="18" x2="10" y2="18" />
          <line x1="12" y1="18" x2="13" y2="18" />
        </svg>
      </button>

      {/* Dark Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[90] bg-[#0B0710]/80 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
        />
      )}

      {/* GTA-Style Phone Overlay Panel */}
      <div
        ref={phoneRef}
        className={`fixed bottom-24 right-6 z-[100] w-80 h-[480px] bg-[#0B0710] border-4 border-[#150C1F] rounded-3xl shadow-2xl overflow-hidden flex flex-col font-mono text-[#F5F0FA]
          ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none invisible"}
          transition-all duration-200 origin-bottom-right motion-reduce:transition-none motion-reduce:transform-none`}
      >
        {/* Device Outer Frame Bezels & Camera */}
        <div className="h-6 bg-[#150C1F] flex items-center justify-center relative">
          <div className="w-12 h-3 bg-[#0B0710] rounded-full flex items-center justify-around px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#150C1F]" />
            <span className="w-4 h-1 rounded-full bg-[#150C1F]" />
          </div>
        </div>

        {/* Phone Screen Container */}
        <div className="flex-grow flex flex-col bg-[#150C1F]/90 p-4 relative overflow-hidden">
          {/* Wallpaper Graphic details */}
          <div className="absolute inset-0 pointer-events-none opacity-20 z-0 bg-gradient-to-tr from-[#6C1FB5] via-[#FF2E88] to-[#00E5FF]" />

          {/* Screen Header Bar */}
          <div className="flex justify-between items-center text-[10px] text-[#9C8FAE] border-b border-[rgba(245,240,250,0.14)] pb-2 mb-4 relative z-10">
            <span className="font-bold text-[#00E5FF]">iFruit v6.0</span>
            <div className="flex items-center space-x-1.5">
              <Wifi size={10} className="text-[#00E5FF]" />
              <Battery size={12} className="text-[#00E5FF]" />
              <span className="font-bold text-[#F5F0FA]">9:08</span>
            </div>
          </div>

          {/* Contacts Title */}
          <div className="mb-3 relative z-10">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#FF2E88]">
              -- CONTACTS --
            </h3>
          </div>

          {/* Contacts Vertical List */}
          <div className="flex-grow flex flex-col space-y-2 relative z-10 overflow-y-auto pr-1 select-none">
            {contacts.map((contact, idx) => {
              const Icon = contact.icon
              return (
                <button
                  key={idx}
                  onClick={() => {
                    contact.action()
                    setIsOpen(false)
                  }}
                  className="w-full text-left bg-[#0B0710] hover:bg-[#FF2E88]/10 border border-[rgba(245,240,250,0.1)] hover:border-[#FF2E88] p-3 rounded-lg flex items-center justify-between transition-all duration-150 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-[#150C1F] text-[#00E5FF] group-hover:text-white rounded border border-[rgba(245,240,250,0.08)]">
                      <Icon size={14} />
                    </div>
                    <span className="text-xs font-bold text-[#9C8FAE] group-hover:text-[#F5F0FA] transition-colors">
                      {contact.name}
                    </span>
                  </div>

                  {/* Signal bars decoration */}
                  <div className="flex items-end space-x-0.5" title="Signal Strength">
                    <div className="w-0.5 h-1 bg-[#00E5FF]" />
                    <div className="w-0.5 h-2 bg-[#00E5FF]" />
                    <div className="w-0.5 h-3 bg-[#00E5FF]" />
                    <div className="w-0.5 h-4 bg-[#00E5FF]" />
                    <div className="w-0.5 h-5 bg-[#00E5FF]" />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Keypad Quick Stats Footer */}
          <div className="mt-4 border-t border-[rgba(245,240,250,0.14)] pt-3 text-[9px] text-[#9C8FAE] text-center relative z-10">
            LEONIDA SECURE TELEMETRY LINK
          </div>
        </div>

        {/* Device Home Button Bezel */}
        <div className="h-8 bg-[#150C1F] flex items-center justify-center">
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Phone Home Button"
            className="w-4 h-4 rounded-full border-2 border-[#9C8FAE] hover:border-white transition-colors"
          />
        </div>
      </div>
    </>
  )
}
