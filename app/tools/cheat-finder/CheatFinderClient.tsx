"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  Filter,
  Gamepad2,
  Heart,
  Shield,
  Zap,
  Car,
  CloudSun,
  Sparkles,
  Sword,
  Clipboard,
  Check,
  ArrowLeft,
  BookOpen
} from "lucide-react"

export interface CheatCode {
  id: string
  title: string
  platform: string
  code: string
  category: string
  effect: string
  verified: boolean
}

interface CheatFinderClientProps {
  initialCheats: CheatCode[]
}

export default function CheatFinderClient({ initialCheats }: CheatFinderClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlatform, setSelectedPlatform] = useState("All")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Derive unique categories from dataset
  const categories = useMemo(() => {
    const list = new Set<string>()
    initialCheats.forEach((c) => {
      if (c.category) list.add(c.category)
    })
    return ["All", ...Array.from(list)]
  }, [initialCheats])

  // Derive unique platforms
  const platforms = useMemo(() => {
    const list = new Set<string>()
    initialCheats.forEach((c) => {
      if (c.platform) list.add(c.platform)
    })
    return ["All", ...Array.from(list)]
  }, [initialCheats])

  // Helper to copy code to clipboard
  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Get matching category icon
  const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase()
    if (lower.includes("weapon") || lower.includes("combat") || lower.includes("ammo")) {
      return <Sword className="w-5 h-5 text-neon-pink" />
    }
    if (lower.includes("vehicle") || lower.includes("spawn") || lower.includes("car")) {
      return <Car className="w-5 h-5 text-neon-blue" />
    }
    if (lower.includes("health") || lower.includes("armor") || lower.includes("invincibility") || lower.includes("life")) {
      return <Heart className="w-5 h-5 text-neon-yellow" />
    }
    if (lower.includes("player") || lower.includes("stat") || lower.includes("ability") || lower.includes("upgrade")) {
      return <Zap className="w-5 h-5 text-neon-purple" />
    }
    if (lower.includes("weather") || lower.includes("world") || lower.includes("environment")) {
      return <CloudSun className="w-5 h-5 text-emerald-400" />
    }
    return <Sparkles className="w-5 h-5 text-orange-400" />
  }

  // Filter cheats
  const filteredCheats = useMemo(() => {
    return initialCheats.filter((cheat) => {
      const matchesSearch =
        cheat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cheat.effect.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cheat.code.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesPlatform =
        selectedPlatform === "All" ||
        cheat.platform.toLowerCase() === selectedPlatform.toLowerCase()

      const matchesCategory =
        selectedCategory === "All" ||
        cheat.category.toLowerCase() === selectedCategory.toLowerCase()

      return matchesSearch && matchesPlatform && matchesCategory
    })
  }, [initialCheats, searchQuery, selectedPlatform, selectedCategory])

  if (initialCheats.length === 0) {
    return (
      <div className="border border-dashed border-card-border p-16 text-center rounded-xl bg-card-bg/30">
        <Gamepad2 className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Cheat Codes Added Yet</h3>
        <p className="text-foreground/50 max-w-md mx-auto text-sm mb-6">
          Verified GTA VI cheats will appear here as soon as they are tested and confirmed in the final release. Check back soon!
        </p>
        <Link href="/tools" className="text-neon-pink hover:underline text-sm font-semibold inline-flex items-center space-x-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Tools</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="bg-card-bg/60 border border-card-border p-6 rounded-xl space-y-6 backdrop-blur-sm shadow-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
          <input
            type="text"
            placeholder="Search cheats by effect, title, button combination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-card-border focus:border-neon-pink focus:ring-1 focus:ring-neon-pink text-white rounded-lg pl-12 pr-4 py-3.5 text-sm outline-none transition-all placeholder:text-foreground/30"
          />
        </div>

        {/* Visual Category Row */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-white/50 block mb-3">
            Category Filter
          </span>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isActive = selectedCategory === category
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-neon-pink to-neon-purple border-transparent text-white shadow-lg shadow-neon-pink/20 scale-[1.02]"
                      : "bg-card-bg/80 border-card-border text-foreground/80 hover:text-white hover:border-foreground/20"
                  }`}
                >
                  {category !== "All" && getCategoryIcon(category)}
                  <span>{category}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Platform selection */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-white/50 block mb-3">
            Platform Selection
          </span>
          <div className="flex flex-wrap gap-2">
            {platforms.map((plat) => {
              const isActive = selectedPlatform === plat
              return (
                <button
                  key={plat}
                  onClick={() => setSelectedPlatform(plat)}
                  className={`flex items-center space-x-1.5 px-4.5 py-2 rounded-md border text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                    isActive
                      ? "bg-neon-blue border-transparent text-black font-extrabold"
                      : "bg-background border-card-border text-foreground/60 hover:text-white hover:border-card-border/80"
                  }`}
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>{plat}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Grid count summary */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground/50 uppercase tracking-widest">
          Found {filteredCheats.length} Cheat{filteredCheats.length !== 1 ? "s" : ""}
        </span>
        {(selectedPlatform !== "All" || selectedCategory !== "All" || searchQuery !== "") && (
          <button
            onClick={() => {
              setSelectedPlatform("All")
              setSelectedCategory("All")
              setSearchQuery("")
            }}
            className="text-xs font-semibold text-neon-pink hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Cheats Grid */}
      {filteredCheats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCheats.map((cheat) => (
            <div
              key={cheat.id}
              className="group bg-card-bg border border-card-border hover:border-white/20 p-5 rounded-xl flex flex-col justify-between transition-all duration-300 relative hover:shadow-2xl hover:shadow-neon-pink/5"
            >
              <div>
                <div className="flex items-start justify-between mb-3.5">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                      {getCategoryIcon(cheat.category)}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-neon-pink transition-colors">
                        {cheat.title}
                      </h4>
                      <p className="text-xs text-foreground/50">{cheat.category}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neon-blue/15 text-neon-blue tracking-wide uppercase">
                    {cheat.platform}
                  </span>
                </div>

                <p className="text-sm text-foreground/75 leading-relaxed mb-5">
                  {cheat.effect}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between p-3 bg-background border border-card-border/60 rounded-lg group-hover:border-card-border transition-colors">
                  <code className="text-xs font-mono font-bold text-neon-yellow tracking-tight break-all select-all pr-2">
                    {cheat.code}
                  </code>
                  <button
                    onClick={() => handleCopyCode(cheat.id, cheat.code)}
                    title="Copy code to clipboard"
                    className="shrink-0 p-1.5 hover:bg-white/5 rounded text-foreground/60 hover:text-white transition-colors"
                  >
                    {copiedId === cheat.id ? (
                      <Check className="w-4 h-4 text-emerald-400 animate-scale" />
                    ) : (
                      <Clipboard className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {cheat.verified && (
                  <div className="mt-3 flex items-center space-x-1 text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                    <Check className="w-3 h-3" />
                    <span>Verified Active</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-card-border p-12 text-center rounded-xl bg-card-bg/20">
          <BookOpen className="w-8 h-8 text-foreground/20 mx-auto mb-3" />
          <p className="text-foreground/50 text-sm">
            No cheat codes match your filters. Try selecting a different category or platform!
          </p>
        </div>
      )}
    </div>
  )
}
