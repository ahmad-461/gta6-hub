"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface PageBannerProps {
  pathname?: string
}

export default function PageBanner({ pathname: propPathname }: PageBannerProps) {
  const localPathname = usePathname()
  const pathname = propPathname || localPathname || ""

  // Do not render on the homepage
  if (pathname === "/" || pathname === "") {
    return null
  }

  // Do not render on admin panel routes
  if (pathname.startsWith("/admin")) {
    return null
  }

  // Derive Section Label from Pathname
  let label = "INTEL"
  if (pathname.startsWith("/news") || pathname.startsWith("/category") || pathname.startsWith("/tag")) {
    label = "NEWS"
  } else if (pathname.startsWith("/guides")) {
    label = "GUIDES"
  } else if (pathname.startsWith("/characters")) {
    label = "CHARACTERS"
  } else if (pathname.startsWith("/cheats")) {
    label = "CHEATS"
  } else if (pathname.startsWith("/tools")) {
    label = "TOOLS"
  } else if (pathname.startsWith("/map")) {
    label = "MAP"
  } else if (pathname.startsWith("/lore-map")) {
    label = "LORE MAP"
  } else if (pathname.startsWith("/intelligence")) {
    label = "INTELLIGENCE"
  } else if (pathname.startsWith("/investigate")) {
    label = "INVESTIGATE"
  } else if (pathname.startsWith("/community")) {
    label = "COMMUNITY"
  } else if (pathname.startsWith("/about")) {
    label = "ABOUT"
  } else if (pathname.startsWith("/privacy")) {
    label = "PRIVACY"
  } else if (pathname.startsWith("/contact")) {
    label = "CONTACT"
  }

  return (
    <Link
      href="/"
      className="block relative w-full overflow-hidden bg-[#16161B]/85 backdrop-blur-md border-b border-[rgba(245,245,247,0.14)] select-none cursor-pointer group transition-all duration-300 hover:brightness-[1.03] active:scale-[0.995] motion-reduce:transition-none motion-reduce:hover:scale-100"
    >
      {/* Film Grain Texture overlay */}
      <div className="film-grain opacity-5 pointer-events-none" />

      {/* Glow effect matching Phase 11 'premium, not loud' principle */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[300px] h-[100px] bg-[#FF2D8D]/03 blur-[50px] rounded-full" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[300px] h-[100px] bg-[#FF8A3D]/03 blur-[50px] rounded-full" />
      </div>

      {/* Large low-opacity 'VI' Watermark */}
      <div className="absolute right-6 sm:right-12 md:right-24 top-1/2 -translate-y-1/2 select-none pointer-events-none z-0">
        <span className="font-anton text-7xl sm:text-8xl md:text-9xl uppercase leading-none tracking-tighter text-[#F5F5F7] opacity-[0.04] transition-opacity duration-300 group-hover:opacity-[0.06] motion-reduce:transition-none">
          VI
        </span>
      </div>

      {/* Banner content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 sm:h-28 flex flex-col justify-center relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">

          {/* Left Side: Logo treatment & tagline */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8A3D] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF8A3D]"></span>
              </span>
              <span className="text-lg font-normal tracking-wider text-[#F5F5F7] font-anton uppercase">
                GTA6<span className="text-[#FF2D8D]">HUB</span>
              </span>
            </div>
            <p className="font-mono text-[9px] sm:text-[10px] tracking-widest text-[#9E9EA8] uppercase">
              The Ultimate Leonida Intelligence Network
            </p>
          </div>

          {/* Right Side: Dynamic section title */}
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="h-[2px] w-6 bg-[#FF2D8D]" />
            <h1 className="font-anton text-2xl sm:text-3xl text-[#F5F5F7] tracking-wider uppercase group-hover:text-[#FF2D8D] transition-colors duration-200">
              {label}
            </h1>
          </div>

        </div>
      </div>
    </Link>
  )
}
