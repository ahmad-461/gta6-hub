"use client"

import React, { useState } from "react"
import { ShieldAlert, Copy, Check, ChevronDown, ChevronUp, Search, HelpCircle } from "lucide-react"
import EmptyState from "@/components/ui/EmptyState"

interface CheatCode {
  id: string
  title: string
  platform: string
  code: string
  category: string
  effect: string
  verified: boolean
}

interface CheatsClientProps {
  initialCheats: CheatCode[]
}

export default function CheatsClient({ initialCheats }: CheatsClientProps) {
  const [cheats] = useState<CheatCode[]>(initialCheats)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<"All" | "PS5" | "Xbox" | "PC">("All")
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Grouping platforms helper
  const matchesTab = (cheatPlatform: string) => {
    if (activeTab === "All") return true
    if (activeTab === "PS5") return cheatPlatform.toUpperCase() === "PS5"
    if (activeTab === "PC") return cheatPlatform.toUpperCase() === "PC"
    if (activeTab === "Xbox") {
      return (
        cheatPlatform.toUpperCase() === "XBOX" ||
        cheatPlatform.toUpperCase().includes("XBOX SERIES") ||
        cheatPlatform.toUpperCase() === "XBOX SERIES X/S"
      )
    }
    return false
  }

  // Filter cheats by search input + platform tab
  const filteredCheats = cheats.filter((cheat) => {
    const matchesPlatform = matchesTab(cheat.platform)
    const matchesSearch =
      cheat.title.toLowerCase().includes(search.toLowerCase()) ||
      cheat.code.toLowerCase().includes(search.toLowerCase()) ||
      cheat.effect.toLowerCase().includes(search.toLowerCase()) ||
      cheat.category.toLowerCase().includes(search.toLowerCase())

    return matchesPlatform && matchesSearch
  })

  // Group filtered cheats by category
  const groupedCheats = filteredCheats.reduce((groups, cheat) => {
    const cat = cheat.category || "General"
    if (!groups[cat]) {
      groups[cat] = []
    }
    groups[cat].push(cheat)
    return groups
  }, {} as Record<string, CheatCode[]>)

  const categories = Object.keys(groupedCheats).sort()

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }))
  }

  const handleCopy = async (id: string, codeText: string) => {
    try {
      await navigator.clipboard.writeText(codeText)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Failed to copy cheat code:", err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Input and Platform Tabs Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card-bg border border-card-border p-4 rounded-xl shadow-md">
        {/* Search Bar */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-foreground/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, title, effect..."
            className="w-full bg-background border border-card-border rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-foreground/30 focus:outline-none focus:border-neon-yellow/70 transition-all duration-200"
          />
        </div>

        {/* Platform Tabs */}
        <div className="flex gap-1 bg-background/80 p-1 border border-card-border rounded-lg overflow-x-auto whitespace-nowrap">
          {(["All", "PS5", "Xbox", "PC"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab
                  ? "bg-neon-yellow text-background font-extrabold shadow"
                  : "text-foreground/70 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion List */}
      {categories.length > 0 ? (
        <div className="space-y-4">
          {categories.map((cat) => {
            const list = groupedCheats[cat]
            const isCollapsed = expandedCategories[cat] === true // default to open (false means open)
            return (
              <div
                key={cat}
                className="bg-card-bg border border-card-border rounded-xl shadow-md overflow-hidden transition-all duration-300"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex justify-between items-center px-6 py-4 border-b border-card-border/40 hover:bg-background/20 text-left transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-neon-yellow shadow-sm shadow-neon-yellow/40" />
                    <h3 className="font-extrabold text-white text-sm sm:text-base uppercase tracking-wider">
                      {cat}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/45 text-xs font-semibold uppercase tracking-wider">
                    <span>{list.length} {list.length === 1 ? "Code" : "Codes"}</span>
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </div>
                </button>

                {/* Accordion Content */}
                {!isCollapsed && (
                  <div className="divide-y divide-card-border/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                      {list.map((cheat) => {
                        const isCopied = copiedId === cheat.id
                        return (
                          <div
                            key={cheat.id}
                            className="p-4 rounded-lg bg-background/50 border border-card-border/40 hover:border-neon-yellow/20 flex items-center justify-between gap-4 transition-all duration-200 group relative"
                          >
                            <div className="space-y-1 flex-grow">
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-white text-sm sm:text-base">
                                  {cheat.title}
                                </h4>
                                {cheat.verified && (
                                  <span className="text-[9px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded">
                                    Verified
                                  </span>
                                )}
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
                              onClick={() => handleCopy(cheat.id, cheat.code)}
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
      ) : (
        <EmptyState
          icon={<HelpCircle className="w-12 h-12 text-neon-yellow/30 mx-auto" />}
          title="No active bypass algorithms matched"
          description="Our developmental systems have not cataloged any cheat inputs matching these criteria. Standing by."
        />
      )}
    </div>
  )
}
