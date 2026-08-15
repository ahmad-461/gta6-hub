"use client"

import React, { useState } from "react"
import {
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  HelpCircle,
  Crosshair,
  Car,
  User,
  Globe,
  ShieldAlert,
  Zap,
  Sliders,
  CheckCircle2
} from "lucide-react"
import EmptyState from "@/components/ui/EmptyState"
import Badge from "@/components/ui/Badge"
import Card from "@/components/ui/Card"

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

function getCategoryIcon(category: string) {
  const catLower = category.toLowerCase()
  if (catLower.includes("weapon") || catLower.includes("gun") || catLower.includes("ammo")) {
    return Crosshair
  }
  if (catLower.includes("vehicle") || catLower.includes("car") || catLower.includes("spawn") || catLower.includes("helicopter")) {
    return Car
  }
  if (catLower.includes("player") || catLower.includes("health") || catLower.includes("armor") || catLower.includes("invincib")) {
    return User
  }
  if (catLower.includes("wanted") || catLower.includes("police") || catLower.includes("cop")) {
    return ShieldAlert
  }
  if (catLower.includes("world") || catLower.includes("weather") || catLower.includes("time") || catLower.includes("gravity")) {
    return Globe
  }
  if (catLower.includes("special") || catLower.includes("ability") || catLower.includes("super")) {
    return Zap
  }
  return Sliders
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
    <div className="space-y-6 font-mono">
      {/* Search Input and Platform Tabs Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-ink-2 border border-[rgba(245,240,250,0.14)] p-4 rounded-xl shadow-lg">
        {/* Search Bar */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-paper-dim" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, title, or effect..."
            className="w-full bg-ink border border-[rgba(245,240,250,0.14)] rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-paper-dim/40 focus:outline-none focus:border-[#FF2E88] focus:ring-1 focus:ring-[#FF2E88] transition-all duration-200"
          />
        </div>

        {/* Platform Tabs */}
        <div className="flex gap-1.5 bg-ink p-1.5 border border-[rgba(245,240,250,0.14)] rounded-lg overflow-x-auto whitespace-nowrap">
          {(["All", "PS5", "Xbox", "PC"] as const).map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  isActive
                    ? "bg-[#FF2E88] text-white shadow-[0_0_15px_rgba(255,46,136,0.4)]"
                    : "text-paper-dim hover:text-white hover:bg-white/5"
                }`}
              >
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      {/* Accordion List */}
      {categories.length > 0 ? (
        <div className="space-y-5">
          {categories.map((cat) => {
            const list = groupedCheats[cat]
            const isCollapsed = expandedCategories[cat] === true // default to open
            const CategoryIcon = getCategoryIcon(cat)

            return (
              <div
                key={cat}
                className="bg-ink-2 border border-[rgba(245,240,250,0.14)] rounded-2xl shadow-xl overflow-hidden transition-all duration-300"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex justify-between items-center px-6 py-4 bg-ink/40 hover:bg-ink/80 border-b border-[rgba(245,240,250,0.1)] text-left transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-[#FF2E88]/10 border border-[#FF2E88]/20 text-[#FF2E88]">
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    <h3 className="font-anton font-normal text-white text-lg sm:text-xl uppercase tracking-wider">
                      {cat}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-paper-dim text-xs font-bold uppercase tracking-wider">
                    <Badge color="magenta" variant="subtle">
                      {list.length} {list.length === 1 ? "Code" : "Codes"}
                    </Badge>
                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </div>
                </button>

                {/* Accordion Content */}
                {!isCollapsed && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {list.map((cheat) => {
                        const isCopied = copiedId === cheat.id
                        return (
                          <Card
                            key={cheat.id}
                            padding="md"
                            variant="standard"
                            className="bg-ink/60 border-[rgba(245,240,250,0.1)] hover:border-[#FF2E88]/50 flex flex-col justify-between gap-4 transition-all duration-200 group"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-anton font-normal text-white text-lg tracking-wide uppercase group-hover:text-[#FF2E88] transition-colors">
                                      {cheat.title}
                                    </h4>
                                  </div>
                                  <p className="text-xs text-paper-dim leading-relaxed font-sans">
                                    {cheat.effect}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Badge color="gray" variant="subtle">
                                    {cheat.platform}
                                  </Badge>
                                  {cheat.verified && (
                                    <Badge color="yellow" variant="subtle" className="flex items-center gap-1 border-[#FF8A3D]/40 text-[#FF8A3D]">
                                      <CheckCircle2 className="w-3 h-3 text-[#FF8A3D]" />
                                      VERIFIED
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Input sequence display */}
                              <div className="pt-2 flex items-center justify-between gap-3">
                                <div className="flex-grow bg-ink border border-[rgba(245,240,250,0.14)] rounded-lg px-4 py-2 text-xs sm:text-sm font-bold text-[#FF8A3D] uppercase tracking-widest break-all select-all shadow-inner">
                                  {cheat.code}
                                </div>

                                {/* Copy Button */}
                                <button
                                  onClick={() => handleCopy(cheat.id, cheat.code)}
                                  className={`p-2.5 rounded-lg border flex-shrink-0 transition-all duration-200 ${
                                    isCopied
                                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                      : "bg-ink border-[rgba(245,240,250,0.14)] hover:border-[#FF2E88] text-paper-dim hover:text-white"
                                  }`}
                                  title="Copy Cheat Code"
                                >
                                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          </Card>
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
          icon={<HelpCircle className="w-12 h-12 text-paper-dim/30 mx-auto" />}
          title="No Active Bypass Algorithms Matched"
          description="Our developmental systems have not cataloged any cheat inputs matching these search parameters. Standing by."
        />
      )}
    </div>
  )
}
