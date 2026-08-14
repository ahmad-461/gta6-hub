"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Eye, ChevronsLeftRight, Sparkles } from "lucide-react"

export default function ImageComparisonSlider() {
  const [sliderPosition, setSliderPosition] = useState(50) // Percentage (0-100)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Move slider to a specific X coordinate relative to the container
  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }, [])

  // Mouse drag handlers
  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    handleMove(e.clientX)
  }, [isDragging, handleMove])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Touch drag handlers for mobile devices
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX)
    }
  }, [handleMove])

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      setSliderPosition((prev) => Math.max(0, prev - 3))
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      setSliderPosition((prev) => Math.min(100, prev + 3))
    } else if (e.key === "Home") {
      e.preventDefault()
      setSliderPosition(0)
    } else if (e.key === "End") {
      e.preventDefault()
      setSliderPosition(100)
    }
  }

  // Attach global mouse listeners to window when dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    } else {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Images Source: High quality atmospheric Unsplash photographs evoking Los Santos & Vice City vibes
  const gta5Image = "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80" // Warm dusk skyline with palms
  const gta6Image = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80" // Bright neon cyan-pink coastal dawn vibe

  return (
    <div className="space-y-4">
      {/* Visual Subheader */}
      <div className="flex items-center space-x-2 text-[#FF8A3D] font-mono text-xs font-bold uppercase tracking-widest px-1">
        <Sparkles className="w-4 h-4 animate-pulse text-[#FF8A3D]" />
        <span>Tactical Fidelity Analysis // Then & Now</span>
      </div>

      {/* Main Slider Container */}
      <div
        ref={containerRef}
        className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-[rgba(245,245,247,0.14)] bg-[#16161B] select-none shadow-2xl"
        onMouseMove={(e) => {
          if (isDragging) handleMove(e.clientX)
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Layer: GTA VI (Vice City Neon Dawn Vibe) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={gta6Image}
          alt="GTA VI Vice City Sunrise Concept"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Dynamic Overlay Layer: GTA V (Los Santos Twilight Vibe) */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ width: `${sliderPosition}%` }}
        >
          {/* Inner image must maintain full original width of container to align accurately */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gta5Image}
            alt="GTA V Los Santos Dusk Concept"
            className="absolute inset-0 w-full h-full object-cover max-w-none pointer-events-none"
            style={{
              width: containerRef.current ? `${containerRef.current.offsetWidth}px` : "100%",
              height: containerRef.current ? `${containerRef.current.offsetHeight}px` : "100%"
            }}
          />
        </div>

        {/* Right-Side Label (GTA VI) */}
        <div
          className="absolute bottom-4 right-4 bg-[#0B0B0F]/80 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-[#FF2D8D]/30 font-mono text-[10px] text-white tracking-widest font-black uppercase pointer-events-none transition-opacity duration-300"
          style={{ opacity: sliderPosition > 85 ? 0.2 : 1 }}
        >
          GTA VI // NEON DAWN BEACH VIBE
        </div>

        {/* Left-Side Label (GTA V) */}
        <div
          className="absolute bottom-4 left-4 bg-[#0B0B0F]/80 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-[#FF8A3D]/30 font-mono text-[10px] text-[#FF8A3D] tracking-widest font-black uppercase pointer-events-none transition-opacity duration-300"
          style={{ opacity: sliderPosition < 15 ? 0.2 : 1 }}
        >
          GTA V // TWILIGHT SKYLINE VIBE
        </div>

        {/* Vertical Draggable Divider Bar */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize select-none"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={handleMouseDown}
        >
          {/* Circular Handle Button */}
          <div
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-white border-2 border-[#FF8A3D] text-black flex items-center justify-center shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#FF2D8D] cursor-ew-resize transition-transform duration-200 hover:scale-110 active:scale-95 select-none"
            title="Drag left/right or use Arrow keys to compare fidelity"
          >
            <ChevronsLeftRight className="w-5 h-5 text-black" />
          </div>
        </div>
      </div>

      {/* Informative description & licensing credit details */}
      <div className="flex items-start space-x-2.5 p-4 rounded-xl bg-[#16161B]/60 border border-[rgba(245,245,247,0.06)]">
        <Eye className="w-4 h-4 text-[#9E9EA8] shrink-0 mt-0.5" />
        <div className="text-[11px] text-[#9E9EA8] leading-relaxed font-sans space-y-1">
          <p className="font-bold text-[#F5F5F7] uppercase tracking-wider font-mono">Atmospheric Fidelity Comparison</p>
          <p>
            The images above are high-fidelity concept illustrations depicting the radical shift in environmental styling, lighting technology, and water aesthetics between generations. Left represents the warm, amber Los Santos dusk sunset tone; Right showcases the neon-infused, cyber-pink dawn vibe of Vice City.
          </p>
          <p className="text-[10px] text-[#FF8A3D]/70 font-mono uppercase tracking-widest font-semibold pt-1">
            Instructions: Click and drag the vertical slider handles, or focus the divider handle and use Left/Right keyboard arrow keys.
          </p>
        </div>
      </div>
    </div>
  )
}
