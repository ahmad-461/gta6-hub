"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, ShieldAlert, Award, FileText, Swords, Wrench, Flame, Compass } from "lucide-react"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === "/"
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    if (!isHome) {
      setIsScrolled(true)
      return
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isHome])

  const navItems = [
    { name: "Home", href: "/", icon: Flame },
    { name: "News", href: "/news", icon: FileText },
    { name: "Guides", href: "/guides", icon: Award },
    { name: "Characters", href: "/characters", icon: Swords },
    { name: "Lore Map", href: "/lore-map", icon: Compass },
    { name: "Cheats", href: "/cheats", icon: ShieldAlert },
    { name: "Tools", href: "/tools", icon: Wrench },
  ]

  const headerClass = `sticky top-0 z-50 transition-all duration-300 motion-reduce:transition-none font-mono ${
    isScrolled
      ? "bg-[#150C1F]/95 backdrop-blur-md border-b border-[rgba(245,240,250,0.14)]"
      : "bg-transparent border-b border-transparent"
  }`

  return (
    <header className={headerClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              {/* Pulsing Cyan Dot */}
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E5FF]"></span>
              </span>
              <span className="text-xl font-normal tracking-wider text-[#F5F0FA] font-anton uppercase">
                GTA6<span className="text-[#FF2E88]">HUB</span>
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-1 lg:space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative flex items-center space-x-1.5 px-3 py-2 text-xs font-bold transition-colors duration-200 uppercase group
                    ${isActive ? "text-white" : "text-[#9C8FAE] hover:text-white"}`}
                >
                  <Icon className="w-4 h-4 text-[#00E5FF]" />
                  <span className="relative py-1">
                    {item.name}
                    <span
                      className={`absolute bottom-0 left-0 h-[2px] bg-[#FF2E88] w-full origin-left transition-transform duration-300 motion-reduce:transition-none
                        ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
                    />
                  </span>
                </Link>
              )
            })}
          </nav>

          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-[#F5F0FA] hover:text-[#FF2E88] focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="block h-6 w-6 text-[#00E5FF]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Hamburger menu takeover */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B0710] flex flex-col justify-between overflow-hidden animate-fade-in duration-300">
          {/* film grain texture overlay */}
          <div className="film-grain opacity-10 pointer-events-none" />

          {/* Header row in takeover */}
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center space-x-2">
              {/* Pulsing Cyan Dot */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E5FF]"></span>
              </span>
              <span className="text-xl font-normal tracking-wider text-[#F5F0FA] font-anton uppercase">
                GTA6<span className="text-[#FF2E88]">HUB</span>
              </span>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-[#FF2E88] focus:outline-none"
            >
              <X className="block h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Centered navigation panel with HUD corner brackets */}
          <div className="flex-grow flex items-center justify-center p-4">
            <div className="relative p-12 max-w-sm w-full bg-[#150C1F]/90 border border-[rgba(245,240,250,0.14)] rounded shadow-2xl space-y-8">
              {/* HUD targeting corner brackets */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00E5FF]" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00E5FF]" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00E5FF]" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00E5FF]" />

              {/* Small header label */}
              <div className="flex items-center justify-center space-x-2 text-[9px] tracking-widest text-[#00E5FF] font-mono font-bold">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00E5FF]"></span>
                </span>
                <span>MAIN NAV TELEMETRY</span>
              </div>

              {/* Links */}
              <nav className="flex flex-col space-y-5 items-center">
                {navItems.map((item) => {
                  const isItemActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`text-3xl font-anton uppercase tracking-wider text-center block relative group transition-colors duration-200
                        ${isItemActive ? "text-[#FF2E88]" : "text-[#F5F0FA] hover:text-[#00E5FF]"}`}
                    >
                      {item.name}
                      <span
                        className={`absolute -bottom-1 left-1/2 -translate-x-1/2 h-[2px] bg-[#FF2E88] w-12 origin-center transition-transform duration-300 motion-reduce:transition-none
                          ${isItemActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
                      />
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Footer row inside menu to anchor it */}
          <div className="py-6 text-center text-[10px] font-mono text-[#9C8FAE] tracking-widest uppercase">
            SECURE SYSTEM ONLINE // VICE CITY HUB
          </div>
        </div>
      )}
    </header>
  )
}
