"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Menu, X, ShieldAlert, Award, FileText, Swords, Wrench, Flame } from "lucide-react"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { name: "Home", href: "/", icon: Flame },
    { name: "News", href: "/news", icon: FileText },
    { name: "Guides", href: "/guides", icon: Award },
    { name: "Characters", href: "/characters", icon: Swords },
    { name: "Cheats", href: "/cheats", icon: ShieldAlert },
    { name: "Tools", href: "/tools", icon: Wrench },
  ]

  return (
    <header className="sticky top-0 z-50 bg-card-bg/95 backdrop-blur-md border-b border-card-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent hover:brightness-110 transition-all duration-300">
                GTA VI HUB
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
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium text-foreground hover:text-neon-pink hover:bg-background/80 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:text-neon-pink hover:bg-background/80 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6 text-neon-pink" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6 text-neon-blue" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-card-bg border-b border-card-border" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-base font-medium text-foreground hover:text-neon-pink hover:bg-background/80 transition-all duration-200"
                >
                  <Icon className="w-5 h-5 text-neon-blue" />
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
