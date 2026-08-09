"use client"

import React, { useState, useMemo } from "react"
import { Search, Copy, Check, ChevronDown, ChevronUp, CheckCircle } from "lucide-react"

interface CheatCode {
  id: string
  title: string
  platform: string
  code: string
  category: string
  effect: string
  verified: boolean
}

interface CheatsContainerProps {
  initialCodes: CheatCode[]
}

export default function CheatsContainer({ initialCodes }: CheatsContainerProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<"All" | "PS5" | "Xbox" | "PC">("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Keep track of which categories are open in accordion
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({})

  // 1. Copy handler
  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Failed to copy cheat code:", err)
    }
  }

  // 2. Filter logic
  const filteredCodes = useMemo(() => {
    return initialCodes.filter((item) => {
      // Platform filter
      let matchesPlatform = true
      if (selectedPlatform !== "All") {
        const itemPlatform = item.platform.toLowerCase()
        if (selectedPlatform === "Xbox") {
          matchesPlatform = itemPlatform.includes("xbox")
        } else {
          matchesPlatform = itemPlatform === selectedPlatform.toLowerCase()
        }
      }

      // Search query filter (title, code, effect)
      let matchesSearch = true
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase()
        matchesSearch =
          item.title.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.effect.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      }

      return matchesPlatform && matchesSearch
    })
  }, [initialCodes, selectedPlatform, searchQuery])

  // 3. Group by category
  const groupedCodes = useMemo(() => {
    const groups: Record<string, CheatCode[]> = {}

    filteredCodes.forEach((code) => {
      const cat = code.category || "General"
      if (!groups[cat]) {
        groups[cat] = []
      }
      groups[cat].push(code)
    })

    // Sort categories alphabetically
    return Object.fromEntries(
      Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
    )
  }, [filteredCodes])

  // Toggle category accordion
  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: prev[category] === false ? true : false, // default is open (undefined means open)
    }))
  };

  const platforms: Array<"All" | "PS5" | "Xbox" | "PC"> = ["All", "PS5", "Xbox", "PC"]

  return (
    <div className="space-y-8">
      {/* FILTER CONTROLS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card-bg border border-card-border p-4 rounded-lg">

        {/* PLATFORM TABS */}
        <div className="flex flex-wrap gap-1.5">
          {platforms.map((plat) => (
            <button
              key={plat}
              onClick={() => setSelectedPlatform(plat)}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded transition-all duration-200 ${
                selectedPlatform === plat
                  ? "bg-neon-yellow text-brand-dark shadow-lg shadow-neon-yellow/20"
                  : "bg-background hover:bg-neon-yellow/10 border border-card-border hover:border-neon-yellow/30 text-foreground/80 hover:text-white"
              }`}
            >
              {plat}
            </button>
          ))}
        </div>

        {/* SEARCH BAR */}
        <div className="relative md:max-w-xs w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-card-border focus:border-neon-yellow/60 rounded pl-10 pr-4 py-2 text-xs text-foreground focus:outline-none transition-all placeholder:text-foreground/45"
            placeholder="Search cheats or vehicle codes..."
          />
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-foreground/40" />
        </div>

      </div>

      {/* ACCORDION CATEGORIES LIST */}
      {Object.keys(groupedCodes).length === 0 ? (
        <div className="border border-dashed border-card-border p-16 text-center rounded-lg bg-card-bg/50">
          <p className="text-foreground/40 text-lg mb-2 font-bold">No matching cheat codes found.</p>
          <p className="text-xs text-foreground/50">Try broadening your search or choosing another platform tab.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedCodes).map(([category, codes]) => {
            const isOpen = openCategories[category] !== false // default to true (open)
            return (
              <div
                key={category}
                className="bg-card-bg border border-card-border rounded-lg overflow-hidden transition-all duration-300"
              >
                {/* ACCORDION HEADER */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-5 bg-brand-dark/25 hover:bg-brand-dark/45 text-left font-black text-sm text-white uppercase tracking-wider transition-colors border-b border-card-border/40"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-yellow" />
                    {category} ({codes.length})
                  </span>
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* ACCORDION CONTENT */}
                {isOpen && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-card-border/50 bg-background/50 font-black text-foreground/50 text-[10px] uppercase tracking-widest">
                          <th className="p-4">Cheat Input / Combination</th>
                          <th className="p-4">Effect / Description</th>
                          <th className="p-4">Platform</th>
                          <th className="p-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {codes.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-card-border/20 last:border-0 hover:bg-brand-dark/15 transition-all"
                          >
                            <td className="p-4 font-mono font-bold text-white tracking-widest selection:bg-neon-yellow selection:text-black">
                              <span className="bg-background/80 border border-card-border rounded px-2.5 py-1.5 text-xs font-black inline-block">
                                {item.code}
                              </span>
                            </td>
                            <td className="p-4 font-semibold text-foreground/90 space-y-1">
                              <div>{item.title}</div>
                              <div className="text-[11px] text-foreground/50 font-medium">
                                {item.effect}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-[10px] font-black tracking-wider uppercase bg-card-border text-foreground/60 px-2 py-0.5 rounded border border-card-border">
                                {item.platform}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleCopy(item.code, item.id)}
                                className="inline-flex items-center gap-1.5 hover:bg-neon-yellow/10 border border-card-border hover:border-neon-yellow text-[11px] font-black uppercase tracking-wider text-foreground/70 hover:text-white px-3 py-1.5 rounded transition-all duration-200"
                              >
                                {copiedId === item.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-neon-yellow animate-bounce" />
                                    <span className="text-neon-yellow">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-neon-yellow" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
