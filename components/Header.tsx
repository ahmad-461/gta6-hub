"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Menu, X, ShieldAlert, Award, FileText, Swords, Wrench, Flame, Compass } from "lucide-react"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { name: "Home", href: "/", icon: Flame },
    { name: "News", href: "/news", icon: FileText },
    { name: "Guides", href: "/guides", icon: Award },
    { name: "Characters", href: "/characters", icon: Swords },
    { name: "Lore Map", href: "/lore-map", icon: Compass },
    { name: "Cheats", href: "/cheats", icon: ShieldAlert },
    { name: "Tools", href: "/tools", icon: Wrench },
  ]

  return (
    <header className="sticky top-0 z-50 bg-[#150C1F]/95 backdrop-blur-md border-b border-[rgba(245,240,250,0.14)] font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-extrabold tracking-wider text-[#F5F0FA] hover:text-[#FF2E88] transition-colors">
                GTA6<span className="text-[#FF2E88]">HUB</span>
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-1 lg:space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs font-bold text-[#9C8FAE] hover:text-[#FF2E88] transition-all duration-200 uppercase"
                >
                  <Icon className="w-4 h-4 text-[#00E5FF]" />
                  <span>{item.name}</span>
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
              {isOpen ? (
                <X className="block h-6 w-6 text-[#FF2E88]" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6 text-[#00E5FF]" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-[#150C1F] border-b border-[rgba(245,240,250,0.14)]" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-bold text-[#F5F0FA] hover:text-[#FF2E88] hover:bg-[#150C1F]/80 transition-all duration-200 uppercase"
                >
                  <Icon className="w-5 h-5 text-[#00E5FF]" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}
