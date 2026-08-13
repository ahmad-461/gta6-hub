"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Bar } from "react-chartjs-2"
import { ArrowLeft, ShieldAlert, CheckCircle2, ShoppingBag, Loader2, BarChart3, HelpCircle } from "lucide-react"

// Register Chart.js Components for horizontal bar chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const CURATED_ITEMS = [
  // Weapons
  { id: "assault-rifle", name: "Assault Rifle", category: "Weapons", description: "Standard tactical combat rifle", icon: "🔫" },
  { id: "pistol", name: "Pistol", category: "Weapons", description: "Lightweight, concealable sidearm", icon: "🔫" },
  { id: "sniper-rifle", name: "Sniper Rifle", category: "Weapons", description: "High-precision extreme range rifle", icon: "🔫" },
  { id: "combat-shotgun", name: "Combat Shotgun", category: "Weapons", description: "Devastating close-quarter scattergun", icon: "🔫" },

  // Vehicles
  { id: "sports-car", name: "Sports Car", category: "Vehicles", description: "High-octane neon speed racer", icon: "🚗" },
  { id: "chopper", name: "Chopper", category: "Vehicles", description: "Armed high-mobility helicopter", icon: "🚁" },
  { id: "motorcycle", name: "Motorcycle", category: "Vehicles", description: "Snappy, high-maneuverability street bike", icon: "🏍️" },
  { id: "muscle-car", name: "Muscle Car", category: "Vehicles", description: "Raw vintage horsepower cruiser", icon: "🚗" },

  // Features
  { id: "heist-planner", name: "Heist Planner", category: "Features", description: "Interactive structural heist blueprinting", icon: "🗺️" },
  { id: "night-vision", name: "Night Vision", category: "Features", description: "Tactical thermal/NVG goggles", icon: "👓" },
  { id: "character-customization", name: "Character Customization", category: "Features", description: "In-depth gang attire & cosmetic editor", icon: "👕" },
  { id: "dynamic-weather", name: "Dynamic Weather", category: "Features", description: "Hyper-realistic tropical storms & typhoons", icon: "⛈️" }
]

const CATEGORIES = ["Weapons", "Vehicles", "Features"]

export default function WishlistPage() {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Database counts stats
  const [votesData, setVotesData] = useState<Record<string, number>>({})
  const [isLoadingVotes, setIsLoadingVotes] = useState(true)

  // Fetch current aggregate community results on mount
  const fetchVotes = async () => {
    setIsLoadingVotes(true)
    try {
      const res = await fetch("/api/wishlist")
      if (res.ok) {
        const json = await res.json()
        const mapping: Record<string, number> = {}
        // Initialize all with 0 first
        CURATED_ITEMS.forEach(it => { mapping[it.id] = 0 })

        if (json.votes && Array.isArray(json.votes)) {
          json.votes.forEach((v: any) => {
            mapping[v.item_slug] = v.votes
          })
        }
        setVotesData(mapping)
      }
    } catch (e) {
      console.error("Failed to load wishlist votes", e)
    } finally {
      setIsLoadingVotes(false)
    }
  }

  useEffect(() => {
    setIsMounted(true)
    fetchVotes()

    // Restore loadout from localStorage
    const savedLoadout = localStorage.getItem("gta6_wishlist_loadout")
    if (savedLoadout) {
      try {
        setSelectedItems(JSON.parse(savedLoadout))
      } catch (e) {
        console.error(e)
      }
    }

    const savedSubmitted = localStorage.getItem("gta6_wishlist_submitted")
    if (savedSubmitted === "true") {
      setHasSubmitted(true)
    }
  }, [])

  // Save changes locally whenever selections modify
  const handleToggleItem = (itemId: string, itemCategory: string) => {
    if (hasSubmitted) return // Locked after submission

    const isSelected = selectedItems.includes(itemId)

    if (isSelected) {
      const updated = selectedItems.filter(id => id !== itemId)
      setSelectedItems(updated)
      localStorage.setItem("gta6_wishlist_loadout", JSON.stringify(updated))
    } else {
      // Validate cap: max 3 per category
      const categoryItems = CURATED_ITEMS.filter(it => it.category === itemCategory).map(it => it.id)
      const selectedInCategoryCount = selectedItems.filter(id => categoryItems.includes(id)).length

      if (selectedInCategoryCount >= 3) {
        alert(`Loadout Restriction: You can select a maximum of 3 items in the ${itemCategory} category.`)
        return
      }

      const updated = [...selectedItems, itemId]
      setSelectedItems(updated)
      localStorage.setItem("gta6_wishlist_loadout", JSON.stringify(updated))
    }
  }

  // Handle Loadout Submission
  const handleSubmitLoadout = async () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item to build your criminal loadout!")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: selectedItems })
      })

      if (res.ok) {
        setHasSubmitted(true)
        localStorage.setItem("gta6_wishlist_submitted", "true")
        fetchVotes() // Refresh chart with updated tally
      } else {
        alert("Operation aborted. Server error.")
      }
    } catch (e) {
      console.error(e)
      alert("Terminal connection interrupted.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Compile sorted list for Chart.js Bar Chart
  const sortedChartData = useMemo(() => {
    return CURATED_ITEMS.map(item => {
      return {
        name: item.name,
        category: item.category,
        votes: votesData[item.id] || 0
      }
    }).sort((a, b) => b.votes - a.votes)
  }, [votesData])

  // ChartJS Data setup
  const chartData = useMemo(() => {
    return {
      labels: sortedChartData.map(it => it.name),
      datasets: [
        {
          label: "Community Wanted Points",
          data: sortedChartData.map(it => it.votes),
          backgroundColor: sortedChartData.map(it =>
            it.category === "Weapons" ? "rgba(255, 46, 136, 0.75)" : // Magenta
            it.category === "Vehicles" ? "rgba(0, 229, 255, 0.75)" : // Cyan
            "rgba(108, 31, 181, 0.75)" // Violet
          ),
          borderColor: sortedChartData.map(it =>
            it.category === "Weapons" ? "#FF2D8D" :
            it.category === "Vehicles" ? "#FF8A3D" :
            "#832258"
          ),
          borderWidth: 1.5,
          borderRadius: 4,
          hoverBackgroundColor: sortedChartData.map(it =>
            it.category === "Weapons" ? "rgba(255, 46, 136, 0.95)" :
            it.category === "Vehicles" ? "rgba(0, 229, 255, 0.95)" :
            "rgba(108, 31, 181, 0.95)"
          ),
        }
      ]
    }
  }, [sortedChartData])

  // Chart configuration options
  const chartOptions = {
    indexAxis: "y" as const, // Horizontal layout
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: "rgba(245, 240, 250, 0.08)"
        },
        ticks: {
          color: "#9E9EA8",
          font: {
            family: "monospace",
            size: 10
          }
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          color: "#F5F5F7",
          font: {
            family: "monospace",
            size: 10,
            weight: "bold" as const
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: "#16161B",
        borderColor: "rgba(245, 240, 250, 0.14)",
        borderWidth: 1,
        titleColor: "#FF8A3D",
        bodyColor: "#F5F5F7",
        titleFont: {
          family: "monospace",
          weight: "bold" as const
        },
        bodyFont: {
          family: "monospace"
        }
      }
    }
  }

  if (!isMounted) return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow flex flex-col space-y-10 text-paper">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(245,240,250,0.14)] pb-6">
        <div>
          <div className="flex items-center space-x-2 mb-2 text-orange">
            <ShoppingBag className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-black tracking-widest uppercase font-mono">
              AMMU-NATION LOADOUT TELEMETRY
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-anton uppercase tracking-tight text-white leading-none">
            WISHLIST BUILDER
          </h1>
          <p className="text-sm text-paper-dim max-w-2xl mt-2 leading-relaxed">
            Construct your dream criminal stash! Pick up to 3 options per category. Submit your payload to contribute anonymously to the most wanted aggregate leaderboard.
          </p>
        </div>

        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-magenta hover:underline bg-magenta/5 border border-magenta/20 rounded-lg px-4 py-2.5 self-start sm:self-center transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back To Fan Tools
        </Link>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        {/* Loadout Selection Panel (7 Cols) */}
        <div className="lg:col-span-7 space-y-8 flex flex-col justify-between bg-ink-2/40 border border-[rgba(245,240,250,0.14)] rounded-xl p-6 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-orange" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-orange" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-orange" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-orange" />

          <div className="space-y-6">
            {CATEGORIES.map((cat) => {
              const catItems = CURATED_ITEMS.filter((it) => it.category === cat)
              const selectedInCategoryCount = selectedItems.filter((id) => catItems.map(i => i.id).includes(id)).length

              return (
                <div key={cat} className="space-y-3.5">
                  {/* Category Title bar */}
                  <div className="flex justify-between items-center border-b border-[rgba(245,240,250,0.08)] pb-1.5">
                    <h3 className="font-anton text-lg tracking-wider text-white uppercase">
                      {cat}
                    </h3>
                    <span className="font-mono text-xs text-paper-dim font-bold">
                      {selectedInCategoryCount} / 3 SELECTED
                    </span>
                  </div>

                  {/* 4 Item Cards in Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {catItems.map((item) => {
                      const isSelected = selectedItems.includes(item.id)

                      let accentBorder = "hover:border-[rgba(245,240,250,0.3)] border-[rgba(245,240,250,0.08)]"
                      let accentBg = "bg-ink/40"
                      let checkboxColor = "border-[rgba(245,240,250,0.2)] text-transparent"

                      if (isSelected) {
                        accentBg = cat === "Weapons" ? "bg-magenta/10" : cat === "Vehicles" ? "bg-orange/10" : "bg-violet/10"
                        accentBorder = cat === "Weapons" ? "border-magenta" : cat === "Vehicles" ? "border-orange" : "border-violet"
                        checkboxColor = cat === "Weapons" ? "bg-magenta border-magenta text-white" : cat === "Vehicles" ? "bg-orange border-orange text-black" : "bg-violet border-violet text-white"
                      }

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleItem(item.id, cat)}
                          className={`flex items-start justify-between p-4 rounded-lg border cursor-pointer select-none transition-all duration-300 ${accentBg} ${accentBorder} ${hasSubmitted ? "opacity-70 cursor-not-allowed" : ""}`}
                        >
                          <div className="flex items-start space-x-3 min-w-0 pr-2">
                            <span className="text-2xl mt-0.5">{item.icon}</span>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-white truncate">
                                {item.name}
                              </h4>
                              <p className="text-[11px] text-paper-dim line-clamp-1 mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          {/* Custom Checkbox circle */}
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold transition-all ${checkboxColor}`}>
                            {isSelected && "✓"}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Submission and Action Strip */}
          <div className="pt-6 border-t border-[rgba(245,240,250,0.1)] mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-paper-dim leading-relaxed max-w-sm">
              {hasSubmitted ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 font-mono">
                  <CheckCircle2 size={14} /> YOUR PAYLOAD INTEL SECURELY REGISTERED. THANK YOU!
                </span>
              ) : (
                <span>* Verify your configuration carefully. Once submitted, your community tally points will be registered permanently.</span>
              )}
            </div>

            <button
              onClick={handleSubmitLoadout}
              disabled={hasSubmitted || isSubmitting || selectedItems.length === 0}
              className="px-8 py-3 bg-magenta hover:bg-magenta/90 disabled:opacity-40 text-white font-mono text-xs font-black uppercase tracking-widest rounded transition-all shadow-[0_0_15px_rgba(255,46,136,0.3)] disabled:shadow-none flex items-center gap-2 shrink-0"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingBag className="w-4 h-4" />
              )}
              {isSubmitting ? "TRANSMITTING..." : hasSubmitted ? "LOADOUT REGISTERED" : "REGISTER PAYLOAD"}
            </button>
          </div>

        </div>

        {/* Community Results Chart (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-ink-2 border border-[rgba(245,240,250,0.14)] rounded-xl p-6 min-h-[480px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-magenta via-[#832258] to-orange" />

          <div className="flex items-center justify-between border-b border-[rgba(245,240,250,0.08)] pb-4 mb-4">
            <div>
              <h3 className="text-base font-anton uppercase text-white tracking-wider">
                Most Wanted Picks
              </h3>
              <p className="text-[11px] text-paper-dim font-mono uppercase font-bold">
                Tally reports across all virtual hubs
              </p>
            </div>
            <div className="bg-orange/10 border border-orange/20 px-2.5 py-1 rounded flex items-center space-x-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-orange" />
              <span className="text-[9px] font-black font-mono text-orange uppercase tracking-wider">TALLY ENGINE</span>
            </div>
          </div>

          {/* Chart block */}
          <div className="relative flex-grow flex items-center justify-center min-h-[350px]">
            {isLoadingVotes ? (
              <div className="flex flex-col items-center justify-center space-y-2 text-foreground/45 font-mono">
                <Loader2 className="w-8 h-8 text-magenta animate-spin" />
                <span className="text-xs uppercase tracking-widest animate-pulse">Extracting counts database...</span>
              </div>
            ) : sortedChartData.length > 0 ? (
              <div className="w-full h-full min-h-[350px] relative">
                <Bar data={chartData} options={chartOptions} />
              </div>
            ) : (
              <div className="text-center p-8 text-foreground/30 flex flex-col items-center justify-center space-y-3 font-mono">
                <HelpCircle className="w-12 h-12 text-foreground/10 stroke-1" />
                <p className="text-xs uppercase tracking-wider">No community points tallied yet.</p>
              </div>
            )}
          </div>

          {/* Legend key footer */}
          <div className="mt-4 pt-4 border-t border-[rgba(245,240,250,0.08)] flex justify-between gap-2 text-[8px] font-bold font-mono text-paper-dim/60">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-magenta" /> WEAPONS
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-orange" /> VEHICLES
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-violet" /> FEATURES
            </span>
          </div>

        </div>

      </div>
    </div>
  )
}
