"use client"

import React, { useState, useEffect } from "react"
import AdminSidebar from "@/components/AdminSidebar"
import AdminCommandPalette from "@/components/AdminCommandPalette"
import { Search, HelpCircle } from "lucide-react"
import Modal from "@/components/ui/Modal"

interface AdminClientLayoutProps {
  children: React.ReactNode
  adminUser: {
    email: string
    name: string
    role: string
  }
  breadcrumbs: string[]
}

export default function AdminClientLayout({
  children,
  adminUser,
  breadcrumbs,
}: AdminClientLayoutProps) {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle palette: Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsPaletteOpen((prev) => !prev)
      }
      // Toggle help modal: Shift+? (which is key "/" with shift) or just "?"
      if (e.key === "?" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        setIsHelpOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0B0710] text-[#F5F0FA]">
      <AdminSidebar user={adminUser} />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Dynamic Breadcrumbs and Status Header Bar */}
        <header className="bg-[#150C1F] border-b border-[rgba(245,240,250,0.14)] py-4 px-6 lg:px-8 flex items-center justify-between font-mono shrink-0">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#9C8FAE]">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-[#FF2E88]">/</span>}
                <span className={idx === breadcrumbs.length - 1 ? "text-[#F5F0FA]" : ""}>{crumb}</span>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick Palette Search trigger */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="p-1.5 rounded bg-[#0B0710] border border-[rgba(245,240,250,0.14)] text-[#9C8FAE]/60 hover:text-white transition flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider"
              title="Search Command Palette (Cmd+K)"
            >
              <Search size={12} />
              <span className="hidden sm:inline">Search (⌘K)</span>
            </button>

            {/* Quick shortcuts help trigger */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-1.5 rounded bg-[#0B0710] border border-[rgba(245,240,250,0.14)] text-[#9C8FAE]/60 hover:text-white transition"
              title="Keyboard Shortcuts Help (?)"
            >
              <HelpCircle size={14} />
            </button>

            {/* Status / Role Badge */}
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FF2E88]/10 text-[#FF2E88] border border-[#FF2E88]/15">
              {adminUser.role}
            </span>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Global Command Palette overlay */}
      <AdminCommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />

      {/* Keyboard shortcuts help modal */}
      <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title="Keyboard Shortcuts Directory" size="sm">
        <div className="space-y-4 font-mono text-xs">
          <div className="space-y-2 border-b border-[rgba(245,240,250,0.08)] pb-3">
            <h4 className="font-black text-white text-[10px] uppercase tracking-widest text-[#FF2E88]">Global Navigation</h4>
            <div className="flex justify-between items-center py-1">
              <span className="text-[#9C8FAE]">Admin Command Palette</span>
              <kbd className="bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">⌘ + K</kbd>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[#9C8FAE]">Shortcuts Directory</span>
              <kbd className="bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">?</kbd>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <h4 className="font-black text-white text-[10px] uppercase tracking-widest text-[#00E5FF]">Document Editor Form</h4>
            <div className="flex justify-between items-center py-1">
              <span className="text-[#9C8FAE]">Save Draft (Prevent default)</span>
              <kbd className="bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">⌘ + S</kbd>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[#9C8FAE]">Publish and generate embedding</span>
              <kbd className="bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">⌘ + Enter</kbd>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
