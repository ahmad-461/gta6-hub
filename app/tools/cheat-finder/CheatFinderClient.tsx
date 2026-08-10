"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  Gamepad2,
  Heart,
  Shield,
  Zap,
  Car,
  CloudSun,
  Sparkles,
  Sword,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
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
  const [selectedPlatform, setSelectedPlatform] = useState<"All" | "PS5" | "Xbox" | "PC">("All")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({})

  // Helper to copy code to clipboard
  const handleCopyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Failed to copy cheat code:", err)
    }
  }

  // Derive unique categories from dataset
  const categories = useMemo(() => {
    const list = new Set<string>()
    initialCheats.forEach((c) => {
      if (c.category) list.add(c.category)
    })
    return ["All", ...Array.from(list)]
  }, [initialCheats])

  // Get matching category icon with colors
  const getCategoryIcon = (category: string, sizeClass = "w-5 h-5") => {
    const lower = category.toLowerCase()
    if (lower.includes("weapon") || lower.includes("combat") || lower.includes("ammo") || lower.includes("gun")) {
      return <Sword className={`${sizeClass} text-neon-pink`} />
    }
    if (lower.includes("vehicle") || lower.includes("spawn") || lower.includes("car") || lower.includes("plane") || lower.includes("helicopter")) {
      return <Car className={`${sizeClass} text-neon-blue`} />
    }
    if (lower.includes("health") || lower.includes("armor") || lower.includes("invincibility") || lower.includes("life") || lower.includes("wanted")) {
      return <Heart className={`${sizeClass} text-neon-yellow`} />
    }
    if (lower.includes("player") || lower.includes("stat") || lower.includes("ability") || lower.includes("upgrade")) {
      return <Zap className={`${sizeClass} text-neon-purple`} />
    }
    if (lower.includes("weather") || lower.includes("world") || lower.includes("environment")) {
      return <CloudSun className={`${sizeClass} text-emerald-400`} />
    }
    return <Sparkles className={`${sizeClass} text-orange-400`} />
  }

  // Filter logic with proper platform grouping
  const filteredCheats = useMemo(() => {
    return initialCheats.filter((item) => {
      // Platform filter: Xbox Series X/S grouped under "Xbox"
      let matchesPlatform = true
      if (selectedPlatform !== "All") {
        const itemPlatform = item.platform.toLowerCase()
        if (selectedPlatform === "Xbox") {
          matchesPlatform =
            itemPlatform === "xbox" ||
            itemPlatform.includes("xbox series") ||
            itemPlatform === "xbox series x/s"
        } else {
          matchesPlatform = itemPlatform === selectedPlatform.toLowerCase()
        }
      }

      // Category filter
      let matchesCategory = true
      if (selectedCategory !== "All") {
        matchesCategory = item.category?.toLowerCase() === selectedCategory.toLowerCase()
      }

      // Search filter: matching title, effect, code, or category
      let matchesSearch = true
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase()
        matchesSearch =
          item.title.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.effect.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      }

      return matchesPlatform && matchesCategory && matchesSearch
    })
  }, [initialCheats, selectedPlatform, selectedCategory, searchQuery])

  // Group filtered cheats by category and sort categories alphabetically
  const groupedCheats = useMemo(() => {
    const groups: Record<string, CheatCode[]> = {}

    filteredCheats.forEach((cheat) => {
      const cat = cheat.category || "General"
      if (!groups[cat]) {
        groups[cat] = []
      }
      groups[cat].push(cheat)
    })

    return Object.fromEntries(
      Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
    )
  }, [filteredCheats])

  // Toggle category accordion
  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: prev[category] === false ? true : false, // default is open (false is default/open, so true means closed)
    }))
  }

  const platforms: Array<"All" | "PS5" | "Xbox" | "PC"> = ["All", "PS5", "Xbox", "PC"]

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
      {/* Search and Filters Bar */}
      <div className="bg-card-bg/60 border border-card-border p-6 rounded-xl space-y-6 backdrop-blur-sm shadow-xl">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-card-border focus:border-neon-yellow/60 focus:ring-1 focus:ring-neon-yellow/30 rounded-lg pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none transition-all placeholder:text-foreground/45 outline-none"
            placeholder="Search cheats by effect, title, or button combinations..."
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
        </div>

        {/* Visual Icon Grid Filter by Category / Effect Type */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-white/50 block mb-3">
            Filter by Effect Category
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((category) => {
              const isActive = selectedCategory === category
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 text-center ${
                    isActive
                      ? "bg-gradient-to-br from-neon-pink/10 via-neon-purple/10 to-neon-blue/10 border-neon-pink text-white shadow-lg scale-[1.02]"
                      : "bg-background/40 border-card-border text-foreground/80 hover:text-white hover:border-white/25"
                  }`}
                >
                  <div className="mb-2">
                    {category === "All" ? (
                      <Gamepad2 className={`w-6 h-6 ${isActive ? 'text-neon-yellow' : 'text-foreground/60'}`} />
                    ) : (
                      getCategoryIcon(category, "w-6 h-6")
                    )}
                  </div>
                  <span className="text-xs font-bold tracking-tight block truncate max-w-full px-1">
                    {category}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Platform Selection Tabs */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-white/50 block mb-3">
            Platform Selection
          </span>
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((plat) => {
              const isActive = selectedPlatform === plat
              return (
                <button
                  key={plat}
                  onClick={() => setSelectedPlatform(plat)}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded transition-all duration-200 ${
                    isActive
                      ? "bg-neon-yellow text-black shadow-lg shadow-neon-yellow/20"
                      : "bg-background hover:bg-neon-yellow/10 border border-card-border hover:border-neon-yellow/30 text-foreground/80 hover:text-white"
                  }`}
                >
                  {plat}
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

      {/* Accordion List */}
      {Object.keys(groupedCheats).length === 0 ? (
        <div className="border border-dashed border-card-border p-12 text-center rounded-xl bg-card-bg/20">
          <BookOpen className="w-8 h-8 text-foreground/20 mx-auto mb-3" />
          <p className="text-foreground/50 text-sm">
            No cheat codes match your filters. Try selecting a different platform, category, or broadening your search!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedCheats).map(([category, codes]) => {
            const isCollapsed = openCategories[category] === true // default to open (false means open)
            return (
              <div
                key={category}
                className="bg-card-bg border border-card-border rounded-xl shadow-md overflow-hidden transition-all duration-300"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex justify-between items-center px-6 py-4 border-b border-card-border/40 hover:bg-background/20 text-left transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-neon-yellow shadow-sm shadow-neon-yellow/40" />
                    <h3 className="font-extrabold text-white text-sm sm:text-base uppercase tracking-wider">
                      {category}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/45 text-xs font-semibold uppercase tracking-wider">
                    <span>{codes.length} {codes.length === 1 ? "Code" : "Codes"}</span>
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </div>
                </button>

                {/* Accordion Content */}
                {!isCollapsed && (
                  <div className="divide-y divide-card-border/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-background/20">
                      {codes.map((cheat) => {
                        const isCopied = copiedId === cheat.id
                        return (
                          <div
                            key={cheat.id}
                            className="p-4 rounded-lg bg-background/50 border border-card-border/40 hover:border-neon-yellow/20 flex items-center justify-between gap-4 transition-all duration-200 group relative"
                          >
                            <div className="space-y-1 flex-grow">
                              <div className="flex items-center flex-wrap gap-2">
                                <h4 className="font-black text-white text-sm sm:text-base">
                                  {cheat.title}
                                </h4>
                                {cheat.verified && (
                                  <span className="text-[9px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded">
                                    Verified
                                  </span>
                                )}
                                <span className="text-[9px] font-bold uppercase tracking-widest bg-white/5 text-foreground/70 px-1.5 py-0.5 rounded border border-card-border">
                                  {cheat.platform}
                                </span>
                              </div>
                              <p className="text-xs text-foreground/50 leading-relaxed">
                                {cheat.effect}
                              </p>
                              {/* Raw input display */}
                              <div className="pt-2">
                                <span className="inline-block px-3 py-1.5 bg-background border border-card-border font-mono text-xs sm:text-sm font-black text-neon-yellow rounded tracking-wider uppercase select-all break-all">
                                  {cheat.code}
                                </span>
                              </div>
                            </div>

                            {/* Copy Button */}
                            <button
                              onClick={() => handleCopyCode(cheat.code, cheat.id)}
                              className={`p-2.5 rounded-lg border flex-shrink-0 transition-all duration-200 hover:scale-105 ${
                                isCopied
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                  : "bg-card-bg border-card-border hover:border-neon-yellow/30 text-foreground/60 hover:text-white"
                              }`}
                              title="Copy Cheat Code"
                            >
                              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
