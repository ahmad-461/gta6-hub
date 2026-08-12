"use client"

import React, { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

export default function WantedLevelMeter() {
  const pathname = usePathname()
  const [stars, setStars] = useState(1)
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)
  const [shouldRipple, setShouldRipple] = useState(false)
  const prevStarsRef = useRef(1)

  // Track page visits, tool usage, and scroll depth
  useEffect(() => {
    if (typeof window === "undefined") return

    // 1. Visit tracker
    const isArticleOrGuide =
      pathname.startsWith("/news/") ||
      (pathname.startsWith("/guides/") && pathname.split("/").length > 3)

    if (isArticleOrGuide) {
      const visitedJson = sessionStorage.getItem("gta_visited_slugs")
      const visited: string[] = visitedJson ? JSON.parse(visitedJson) : []
      if (!visited.includes(pathname)) {
        visited.push(pathname)
        sessionStorage.setItem("gta_visited_slugs", JSON.stringify(visited))
      }
    }

    // 2. Tool usage tracker
    const isTool =
      pathname.startsWith("/tools/") ||
      pathname === "/cheats" ||
      pathname === "/map" ||
      pathname === "/lore-map"

    if (isTool) {
      sessionStorage.setItem("gta_tool_used", "true")
    }

    // Calculate level initially and on page change
    calculateWantedLevel()

    // 3. Scroll depth tracker for articles/guides
    if (isArticleOrGuide) {
      let scrollTriggered = false
      const handleScroll = () => {
        if (scrollTriggered) return
        const scrollTop = window.scrollY || document.documentElement.scrollTop
        const scrollHeight =
          document.documentElement.scrollHeight - document.documentElement.clientHeight
        if (scrollHeight > 0 && scrollTop / scrollHeight >= 0.75) {
          scrollTriggered = true
          sessionStorage.setItem("gta_scroll_engaged", "true")
          calculateWantedLevel()
          window.removeEventListener("scroll", handleScroll)
        }
      }

      window.addEventListener("scroll", handleScroll)
      return () => window.removeEventListener("scroll", handleScroll)
    }
  }, [pathname])

  const calculateWantedLevel = () => {
    if (typeof window === "undefined") return

    let currentStars = 1

    // Visited articles/guides: +1 star per 2 visited articles
    const visitedJson = sessionStorage.getItem("gta_visited_slugs")
    const visitedCount = visitedJson ? JSON.parse(visitedJson).length : 0
    const visitStars = Math.floor(visitedCount / 2)
    currentStars += visitStars

    // Used a tool: +1 star
    if (sessionStorage.getItem("gta_tool_used") === "true") {
      currentStars += 1
    }

    // Scrolled past 75%: +1 star
    if (sessionStorage.getItem("gta_scroll_engaged") === "true") {
      currentStars += 1
    }

    // Cap at 5
    const finalStars = Math.min(5, Math.max(1, currentStars))

    if (finalStars > prevStarsRef.current) {
      // Trigger brief glow ripple if no prefers-reduced-motion
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (!prefersReduced) {
        setShouldRipple(true)
        setTimeout(() => setShouldRipple(false), 1500)
      }
    }

    prevStarsRef.current = finalStars
    setStars(finalStars)
  }

  // Descriptions based on star count
  const descriptions = [
    "", // 0 fallback
    "Just browsing.", // 1 star
    "Investigating the leaks.", // 2 stars
    "Highly engaged in Vice City lore.", // 3 stars
    "Recklessly excited for GTA VI.", // 4 stars
    "Cannot wait for Leonida!" // 5 stars
  ]

  const currentDesc = descriptions[stars] || "Active hub citizen."

  return (
    <div className="fixed bottom-6 left-6 z-50 font-mono text-[#F5F0FA] select-none">
      {/* Container with relative position for tooltip */}
      <div
        className="relative flex items-center bg-[#0B0710]/95 border border-[rgba(245,240,250,0.14)] px-3 py-2.5 rounded-lg shadow-lg cursor-help transition-all duration-300 hover:border-[#FF2E88]/50 group"
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
        onClick={() => setIsTooltipOpen(!isTooltipOpen)}
        title="Your Hub Wanted Level"
      >
        {/* Star row container */}
        <div className="flex items-center space-x-1.5 relative">
          {/* Animated Glow ripple overlay */}
          {shouldRipple && (
            <div className="absolute inset-0 bg-[#FFCC00]/10 border border-[#FFCC00] rounded-md animate-ping pointer-events-none" />
          )}

          {Array.from({ length: 5 }).map((_, index) => {
            const isLit = index < stars
            return (
              <svg
                key={index}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isLit ? "#FFCC00" : "none"}
                stroke={isLit ? "#FFCC00" : "#9C8FAE"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-4.5 h-4.5 transition-all duration-300
                  ${isLit ? "drop-shadow-[0_0_5px_rgba(255,204,0,0.6)]" : "opacity-40"}
                  ${shouldRipple && isLit ? "animate-pulse" : ""}
                `}
              >
                {/* Slightly rounded classic star shape */}
                <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
              </svg>
            )
          })}
        </div>

        {/* Tooltip Popup */}
        <div
          className={`absolute bottom-full left-0 mb-3 w-56 bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-3 rounded-lg shadow-xl pointer-events-none transition-all duration-200
            ${isTooltipOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}
          `}
        >
          {/* Decorative Corner Reticles */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#FFCC00]" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#FFCC00]" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#FFCC00]" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#FFCC00]" />

          <h4 className="text-[10px] font-black uppercase text-[#FFCC00] tracking-widest mb-1">
            WANTED LEVEL
          </h4>
          <p className="text-xs font-bold text-white mb-0.5">
            {stars} {stars === 1 ? "Star" : "Stars"} Active
          </p>
          <p className="text-[11px] text-[#9C8FAE] leading-relaxed italic">
            &ldquo;{currentDesc}&rdquo;
          </p>
        </div>
      </div>
    </div>
  )
}
