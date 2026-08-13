"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  Menu,
  X,
  Search,
  Flame,
  ShieldAlert,
  Wrench,
  Compass,
  Award,
  Swords,
  FileText,
  Sparkles,
  Home,
  Cpu,
  Loader2,
  HelpCircle,
  MessageSquare,
  MoreHorizontal,
  MapPin,
  ChevronRight
} from "lucide-react"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any>({
    articles: [],
    guides: [],
    characters: [],
    locations: [],
  })
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === "/"
  const [isScrolled, setIsScrolled] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsSearchOpen((prev) => !prev)
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Auto-focus search input
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isSearchOpen])

  // Live search queries
  useEffect(() => {
    if (!isSearchOpen) {
      setSearchQuery("")
      setSearchResults({ articles: [], guides: [], characters: [], locations: [] })
      return
    }

    const trimmed = searchQuery.trim()
    if (trimmed.length < 2) {
      setSearchResults({ articles: [], guides: [], characters: [], locations: [] })
      return
    }

    setIsSearchLoading(true)
    const delayDebounce = setTimeout(async () => {
      try {
        const [articlesRes, guidesRes, charactersRes, locationsRes] = await Promise.all([
          supabase
            .from("articles")
            .select("id, title, slug, excerpt")
            .eq("status", "published")
            .textSearch("search_vector", trimmed, { type: "websearch", config: "english" })
            .limit(5),
          supabase
            .from("guides")
            .select("id, title, slug, guide_category")
            .eq("status", "published")
            .textSearch("search_vector", trimmed, { type: "websearch", config: "english" })
            .limit(5),
          supabase
            .from("characters")
            .select("id, name, slug, biography")
            .eq("status", "published")
            .textSearch("search_vector", trimmed, { type: "websearch", config: "english" })
            .limit(5),
          supabase
            .from("map_locations")
            .select("id, name, slug, description, category")
            .or(`name.ilike.%${trimmed}%,description.ilike.%${trimmed}%`)
            .limit(5)
        ])

        setSearchResults({
          articles: articlesRes.data || [],
          guides: guidesRes.data || [],
          characters: charactersRes.data || [],
          locations: locationsRes.data || [],
        })
      } catch (err) {
        console.error("Global search failed:", err)
      } finally {
        setIsSearchLoading(false)
      }
    }, 250)

    return () => clearTimeout(delayDebounce)
  }, [searchQuery, isSearchOpen])

  const primaryNavItems = [
    { name: "Home", href: "/", icon: Flame },
    { name: "Intelligence", href: "/intelligence", icon: Cpu },
    { name: "Map", href: "/map", icon: Compass },
    { name: "Investigate", href: "/investigate", icon: Sparkles },
    { name: "Guides", href: "/guides", icon: Award },
    { name: "Community", href: "/community", icon: MessageSquare },
  ]

  const secondaryNavItems = [
    { name: "Characters", href: "/characters", icon: Swords },
    { name: "Lore Map", href: "/lore-map", icon: Compass },
    { name: "Cheats", href: "/cheats", icon: ShieldAlert },
    { name: "Tools", href: "/tools", icon: Wrench },
    { name: "About", href: "/about", icon: HelpCircle },
    { name: "Contact", href: "/contact", icon: MessageSquare },
    { name: "Privacy", href: "/privacy", icon: FileText },
  ]

  const headerClass = `sticky top-0 z-50 transition-all duration-300 motion-reduce:transition-none font-mono ${
    isScrolled
      ? "bg-ink-2/95 backdrop-blur-md border-b border-[rgba(245,240,250,0.14)]"
      : "bg-transparent border-b border-transparent"
  }`

  const hasAnySearchResults =
    searchResults.articles.length > 0 ||
    searchResults.guides.length > 0 ||
    searchResults.characters.length > 0 ||
    searchResults.locations.length > 0

  return (
    <>
      <header className={headerClass}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-2 group">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange"></span>
                </span>
                <span className="text-xl font-normal tracking-wider text-paper font-anton uppercase">
                  GTA6<span className="text-magenta">HUB</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-3">
              {primaryNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative flex items-center space-x-1.5 px-3 py-2 text-xs font-bold transition-colors duration-200 uppercase group
                      ${isActive ? "text-white" : "text-paper-dim hover:text-white"}`}
                  >
                    <Icon className="w-4 h-4 text-orange" />
                    <span className="relative py-1">
                      {item.name}
                      <span
                        className={`absolute bottom-0 left-0 h-[2px] bg-magenta w-full origin-left transition-transform duration-300 motion-reduce:transition-none
                          ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
                      />
                    </span>
                  </Link>
                )
              })}

              {/* Desktop Global Search Icon */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 ml-2 rounded-md text-paper-dim hover:text-orange transition-all duration-200"
                title="Search Database (Cmd+K)"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* More Trigger (Opens full takeover menu) */}
              <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-md text-paper-dim hover:text-magenta transition-all duration-200 flex items-center space-x-1"
                title="System Menu"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </nav>

            {/* Mobile Header Icons */}
            <div className="flex items-center space-x-3 md:hidden">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-md text-orange"
                title="Search"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-md text-orange"
                title="Menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* MOBILE STICKY BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-ink-2/95 backdrop-blur-md border-t border-[rgba(245,240,250,0.14)] md:hidden flex items-center justify-around h-16 px-2 pb-safe">
        {primaryNavItems.slice(0, 5).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[9px] font-bold uppercase font-mono transition-colors duration-200
                ${isActive ? "text-orange" : "text-paper-dim hover:text-white"}`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? "text-magenta filter drop-shadow-[0_0_5px_rgba(255,46,136,0.5)]" : "text-orange"}`} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* GLOBAL COMMAND PALETTE SEARCH OVERLAY */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-ink/95 backdrop-blur-md flex flex-col pt-20 px-4 sm:px-6 overflow-y-auto">
          <div className="film-grain opacity-5 pointer-events-none" />

          {/* Top Control Bar */}
          <div className="max-w-3xl w-full mx-auto flex items-center justify-between border-b border-[rgba(245,240,250,0.1)] pb-4 mb-6">
            <div className="flex items-center space-x-2 text-[9px] font-black tracking-widest text-orange font-mono">
              <Cpu className="w-4 h-4 animate-pulse" />
              <span>INTEL DIRECTORY RADAR SYSTEM</span>
            </div>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="p-1.5 rounded-full bg-ink-2 border border-[rgba(245,240,250,0.08)] text-magenta hover:scale-105 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Centered Command Bar */}
          <div className="max-w-3xl w-full mx-auto space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles, guides, character bios, or map locations..."
                className="w-full bg-ink-2 border border-[rgba(245,240,250,0.14)] focus:border-magenta focus:ring-1 focus:ring-magenta rounded-xl pl-12 pr-12 py-4 text-base text-white placeholder-foreground/30 font-mono outline-none shadow-2xl"
              />
              {isSearchLoading && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-magenta animate-spin" />
              )}
            </div>

            {/* Live results section */}
            {searchQuery.trim().length >= 2 ? (
              <div className="space-y-6 pb-12 animate-fade-in">
                {hasAnySearchResults ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                    {/* Articles Category */}
                    {searchResults.articles.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-paper-dim border-b border-[rgba(245,240,250,0.1)] pb-2">
                          <FileText className="w-4 h-4 text-magenta" />
                          <h3 className="font-bold uppercase text-[10px] tracking-widest font-mono">
                            Articles ({searchResults.articles.length})
                          </h3>
                        </div>
                        <div className="space-y-2">
                          {searchResults.articles.map((art: any) => (
                            <Link
                              key={art.id}
                              href={`/news/${art.slug}`}
                              onClick={() => setIsSearchOpen(false)}
                              className="block p-3 rounded bg-ink-2/60 border border-[rgba(245,240,250,0.06)] hover:border-magenta/40 transition group"
                            >
                              <h4 className="font-bold text-sm text-white group-hover:text-magenta truncate">
                                {art.title}
                              </h4>
                              <p className="text-[10px] text-paper-dim/70 line-clamp-1 mt-1 font-sans">
                                {art.excerpt}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Guides Category */}
                    {searchResults.guides.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-paper-dim border-b border-[rgba(245,240,250,0.1)] pb-2">
                          <Award className="w-4 h-4 text-orange" />
                          <h3 className="font-bold uppercase text-[10px] tracking-widest font-mono">
                            Guides ({searchResults.guides.length})
                          </h3>
                        </div>
                        <div className="space-y-2">
                          {searchResults.guides.map((g: any) => {
                            const catSlug = g.guide_category ? g.guide_category.toLowerCase().replace(/\s+/g, "-") : "getting-started"
                            return (
                              <Link
                                key={g.id}
                                href={`/guides/${catSlug}/${g.slug}`}
                                onClick={() => setIsSearchOpen(false)}
                                className="block p-3 rounded bg-ink-2/60 border border-[rgba(245,240,250,0.06)] hover:border-orange/40 transition group"
                              >
                                <h4 className="font-bold text-sm text-white group-hover:text-orange truncate">
                                  {g.title}
                                </h4>
                                <span className="text-[9px] font-black tracking-widest uppercase text-magenta font-mono block mt-1">
                                  {g.guide_category || "GETTING STARTED"}
                                </span>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Characters Category */}
                    {searchResults.characters.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-paper-dim border-b border-[rgba(245,240,250,0.1)] pb-2">
                          <Swords className="w-4 h-4 text-violet" />
                          <h3 className="font-bold uppercase text-[10px] tracking-widest font-mono">
                            Characters ({searchResults.characters.length})
                          </h3>
                        </div>
                        <div className="space-y-2">
                          {searchResults.characters.map((char: any) => (
                            <Link
                              key={char.id}
                              href={`/characters/${char.slug}`}
                              onClick={() => setIsSearchOpen(false)}
                              className="block p-3 rounded bg-ink-2/60 border border-[rgba(245,240,250,0.06)] hover:border-violet/40 transition group"
                            >
                              <h4 className="font-bold text-sm text-white group-hover:text-violet truncate">
                                {char.name}
                              </h4>
                              <p className="text-[10px] text-paper-dim/70 line-clamp-1 mt-1 font-sans">
                                {char.biography.replace(/<[^>]*>/g, "")}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Locations Category */}
                    {searchResults.locations.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-paper-dim border-b border-[rgba(245,240,250,0.1)] pb-2">
                          <MapPin className="w-4 h-4 text-amber-400" />
                          <h3 className="font-bold uppercase text-[10px] tracking-widest font-mono">
                            Locations ({searchResults.locations.length})
                          </h3>
                        </div>
                        <div className="space-y-2">
                          {searchResults.locations.map((loc: any) => (
                            <Link
                              key={loc.id}
                              href={`/map`}
                              onClick={() => setIsSearchOpen(false)}
                              className="block p-3 rounded bg-ink-2/60 border border-[rgba(245,240,250,0.06)] hover:border-amber-400/40 transition group"
                            >
                              <h4 className="font-bold text-sm text-white group-hover:text-amber-400 truncate">
                                {loc.name}
                              </h4>
                              <p className="text-[10px] text-paper-dim/70 line-clamp-1 mt-1 font-sans">
                                {loc.description || "Sector coordinate mapped."}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-[rgba(245,240,250,0.1)] rounded-xl bg-ink-2/30 text-paper-dim text-xs font-mono">
                    No directory files matching &ldquo;<span className="text-white font-bold">{searchQuery}</span>&rdquo; found.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-[rgba(245,240,250,0.08)] rounded-xl bg-ink-2/20 max-w-xl mx-auto text-paper-dim text-xs font-mono leading-relaxed space-y-2">
                <p>AWAITING OPERATOR INPUT (AT LEAST 2 CHARACTERS)...</p>
                <p className="text-[10px] opacity-45">TIP: Use ESC key to abort or click search icon again.</p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* FULL SYSTEM TAKEOVER DRAWER (Mobile + Desktop secondary menu) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-ink flex flex-col justify-between overflow-hidden animate-fade-in duration-300">
          <div className="film-grain opacity-10 pointer-events-none" />

          {/* Drawer Header */}
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-b border-[rgba(245,240,250,0.08)]">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange"></span>
              </span>
              <span className="text-xl font-normal tracking-wider text-paper font-anton uppercase">
                GTA6<span className="text-magenta">SYSTEM</span>
              </span>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-magenta hover:scale-105 transition focus:outline-none"
            >
              <X className="block h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Centered navigation panel with HUD targeting brackets */}
          <div className="flex-grow flex items-center justify-center p-4">
            <div className="relative p-10 max-w-md w-full bg-ink-2/90 border border-[rgba(245,240,250,0.14)] rounded shadow-2xl space-y-6">

              {/* HUD corner brackets */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-orange" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-orange" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-orange" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-orange" />

              <div className="flex items-center justify-center space-x-2 text-[9px] tracking-widest text-orange font-mono font-bold border-b border-[rgba(245,240,250,0.08)] pb-3">
                <Cpu className="w-3.5 h-3.5 animate-pulse" />
                <span>ALL TELEMETRY PATHS</span>
              </div>

              {/* Grid of All Links */}
              <div className="grid grid-cols-2 gap-4">

                {/* Primary items left column */}
                <div className="space-y-3">
                  <span className="block text-[8px] font-black tracking-widest font-mono text-paper-dim/50 uppercase mb-1">
                    PRIMARY STATIONS
                  </span>
                  {primaryNavItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-2 py-1 px-2 rounded hover:bg-magenta/10 text-sm font-anton uppercase tracking-wider text-white hover:text-magenta transition duration-200`}
                    >
                      <item.icon className="w-3.5 h-3.5 text-orange shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ))}
                </div>

                {/* Secondary items right column */}
                <div className="space-y-3">
                  <span className="block text-[8px] font-black tracking-widest font-mono text-paper-dim/50 uppercase mb-1">
                    SECONDARY SECTORS
                  </span>
                  {secondaryNavItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-2 py-1 px-2 rounded hover:bg-orange/10 text-sm font-anton uppercase tracking-wider text-white hover:text-orange transition duration-200`}
                    >
                      <item.icon className="w-3.5 h-3.5 text-magenta shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ))}
                </div>

              </div>
            </div>
          </div>

          {/* Footer row inside menu to anchor it */}
          <div className="py-6 text-center text-[10px] font-mono text-paper-dim tracking-widest uppercase border-t border-[rgba(245,240,250,0.06)]">
            SECURE SYSTEM OVERRIDE ONLINE // VICE CITY HUB v1.0
          </div>
        </div>
      )}
    </>
  )
}
