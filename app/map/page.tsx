"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import NextImage from "next/image"
import { supabase } from "@/lib/supabase"
import { MapPin, X, Compass, Layers, CheckCircle2, AlertTriangle, ExternalLink, Loader2 } from "lucide-react"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"

export default function LeonidaMapPage() {
  // Premium visual polish matching Part A Card and Badge primitives
  const [locations, setLocations] = useState<any[]>([])
  const [articles, setArticles] = useState<any[]>([])
  const [guides, setGuides] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [activeCategory, setActiveCategory] = useState<string>("all")

  // Selected Location for Side Panel / Modal
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const { data: locationsData } = await supabase.from("map_locations").select("*")
      const { data: articlesData } = await supabase.from("articles").select("id, title, slug, excerpt, status")
      const { data: guidesData } = await supabase.from("guides").select("id, title, slug, status, guide_category")

      setLocations(locationsData || [])
      setArticles(articlesData || [])
      setGuides(guidesData || [])
    } catch (err) {
      console.error("Failed to fetch map data", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle location view counting & opening
  const handleOpenLocation = async (loc: any) => {
    setSelectedLocation(loc)

    // Check if viewed in this session to deduplicate/debounce view count inflation
    const sessionViewed = sessionStorage.getItem("gta6_viewed_locations")
    let viewedIds: string[] = []
    if (sessionViewed) {
      try {
        viewedIds = JSON.parse(sessionViewed)
      } catch (e) {
        console.error(e)
      }
    }

    if (!viewedIds.includes(loc.id)) {
      try {
        await fetch("/api/map/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locationId: loc.id }),
        })

        // Update local views state so heat glow recalculated instantly
        setLocations((prev) =>
          prev.map((item) => {
            if (item.id === loc.id) {
              return { ...item, view_count: (item.view_count || 0) + 1 }
            }
            return item
          })
        )

        viewedIds.push(loc.id)
        sessionStorage.setItem("gta6_viewed_locations", JSON.stringify(viewedIds))
      } catch (err) {
        console.error("Failed to record location view telemetry", err)
      }
    }
  }

  // Maximum view count for normalizing heatmap glow
  const maxViewCount = useMemo(() => {
    if (locations.length === 0) return 0
    return Math.max(...locations.map((loc) => loc.view_count || 0))
  }, [locations])

  // Filter Locations
  const filteredLocations = locations.filter((loc) => {
    if (activeCategory === "all") return true
    return loc.category === activeCategory
  })

  // Get matching article/guide details for a location
  const getRelatedContent = (location: any) => {
    const ids = location?.related_article_ids || []
    const results: any[] = []

    ids.forEach((id: string) => {
      const art = articles.find((a) => a.id === id)
      if (art && art.status === "published") {
        results.push({ ...art, type: "article", href: `/news/${art.slug}` })
      }
      const gd = guides.find((g) => g.id === id)
      if (gd && gd.status === "published") {
        const catSlug = gd.guide_category ? gd.guide_category.toLowerCase().replace(/\s+/g, "-") : "getting-started"
        results.push({ ...gd, type: "guide", href: `/guides/${catSlug}/${gd.slug}` })
      }
    })

    return results
  }

  const relatedContentList = selectedLocation ? getRelatedContent(selectedLocation) : []

  const categories = [
    { id: "all", name: "All Locations" },
    { id: "city", name: "Cities" },
    { id: "landmark", name: "Landmarks" },
    { id: "poi", name: "Points of Interest" },
    { id: "easter-egg", name: "Easter Eggs" },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow flex flex-col space-y-8 text-[#F5F0FA]">

      {/* Title & Description Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(245,240,250,0.14)] pb-6">
        <div>
          <div className="flex items-center space-x-2 mb-2 text-[#FF2E88]">
            <Compass className="w-5 h-5 animate-spin-slow" />
            <span className="text-xs font-black tracking-widest uppercase font-mono">
              LEONIDA COMPREHENSIVE VECTOR telemetry
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-anton uppercase tracking-tight text-white leading-none">
            LEONIDA INTEL MAP
          </h1>
          <p className="text-sm text-[#9C8FAE] max-w-2xl mt-2 leading-relaxed">
            Scan districts, coordinates, verified structures, and dynamic rumor coordinates. Target pins on the grid to extract connected walkthrough files.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-stretch">

        {/* Left/Main Map Canvas (3 cols) */}
        <div className="lg:col-span-3 bg-[#150C1F]/40 border border-[rgba(245,240,250,0.14)] rounded-xl p-2 relative overflow-hidden flex flex-col items-center justify-center min-h-[500px]">

          {/* Responsive aspect-ratio-locked relative map container */}
          <div className="relative w-full aspect-[16/10] bg-[#0c0a10] rounded-lg overflow-hidden border border-[rgba(245,240,250,0.08)]">
            {/* Dark Neon stylized region map SVG/Canvas background */}
            <svg
              className="absolute inset-0 w-full h-full opacity-65 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1600 1000"
            >
              <defs>
                <radialGradient id="ocean" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#150f24" />
                  <stop offset="100%" stopColor="#08060c" />
                </radialGradient>
                <linearGradient id="neon-pink-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff007f" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#7f00ff" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="neon-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#0000ff" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Water grid background */}
              <rect width="100%" height="100%" fill="url(#ocean)" />
              <path
                d="M 0,100 L 1600,100 M 0,200 L 1600,200 M 0,300 L 1600,300 M 0,400 L 1600,400 M 0,500 L 1600,500 M 0,600 L 1600,600 M 0,700 L 1600,700 M 0,800 L 1600,800 M 0,900 L 1600,900"
                stroke="#1c162d"
                strokeWidth="1"
              />
              <path
                d="M 100,0 L 100,1000 M 200,0 L 200,1000 M 300,0 L 300,1000 M 400,0 L 400,1000 M 500,0 L 500,1000 M 600,0 L 600,1000 M 700,0 L 700,1000 M 800,0 L 800,1000 M 900,0 L 900,1000 M 1000,0 L 1000,1000 M 1100,0 L 1100,1000 M 1200,0 L 1200,1000 M 1300,0 L 1300,1000 M 1400,0 L 1400,1000 M 1500,0 L 1500,1000"
                stroke="#1c162d"
                strokeWidth="1"
              />

              {/* Abstract Stylized region landmass shapes */}
              {/* Mainland Leonida */}
              <path
                d="M 100,200 Q 250,50 500,120 T 900,80 T 1300,150 Q 1500,300 1450,550 Q 1300,700 1100,600 T 700,680 T 400,580 Q 200,600 150,450 Z"
                fill="url(#neon-pink-grad)"
                stroke="#ff007f"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.8"
              />

              {/* Vice City Area */}
              <path
                d="M 1150,400 Q 1350,350 1500,500 T 1420,850 T 1100,780 Q 1000,650 1150,400 Z"
                fill="url(#neon-blue-grad)"
                stroke="#00f0ff"
                strokeWidth="2"
                opacity="0.8"
              />

              {/* Everglades Swamps */}
              <path
                d="M 300,550 Q 500,500 700,600 T 600,850 T 250,750 Z"
                fill="#00ff00"
                fillOpacity="0.03"
                stroke="#00ff00"
                strokeWidth="1"
                strokeDasharray="1 5"
                opacity="0.6"
              />

              {/* Keys Islands */}
              <path
                d="M 200,880 Q 400,920 600,900 T 900,950 Q 1100,980 1200,920"
                fill="none"
                stroke="#7f00ff"
                strokeWidth="2.5"
                strokeDasharray="10 5"
                opacity="0.75"
              />

              {/* Grid Text labels */}
              <text x="50" y="50" fill="#ffffff" fillOpacity="0.15" fontSize="12" fontFamily="monospace">GRID A-1</text>
              <text x="1450" y="50" fill="#ffffff" fillOpacity="0.15" fontSize="12" fontFamily="monospace">GRID D-1</text>
              <text x="50" y="950" fill="#ffffff" fillOpacity="0.15" fontSize="12" fontFamily="monospace">GRID A-9</text>
              <text x="1450" y="950" fill="#ffffff" fillOpacity="0.15" fontSize="12" fontFamily="monospace">GRID D-9</text>

              {/* Custom stylistic radar sweeps */}
              <circle cx="1250" cy="550" r="120" fill="none" stroke="#00f0ff" strokeWidth="0.5" opacity="0.3" strokeDasharray="3 3" />
              <circle cx="1250" cy="550" r="240" fill="none" stroke="#00f0ff" strokeWidth="0.5" opacity="0.15" strokeDasharray="5 5" />
            </svg>

            {/* Title watermark floating */}
            <div className="absolute top-6 left-6 text-[9px] font-bold text-white/25 uppercase tracking-widest font-mono pointer-events-none select-none leading-relaxed">
              LEONIDA COMPREHENSIVE INTELLIGENCE SYSTEM v1.0<br />
              COORDINATES MONITORED VIA COGNITIVE RADAR LOOKUP
            </div>

            {/* FLOATING CONSOLE: Category Selector (Overlaid in bottom-right) */}
            <Card
              variant="console"
              padding="sm"
              showCornerBrackets
              className="absolute bottom-6 right-6 z-20 bg-[#150C1F]/95 backdrop-blur-md border border-[rgba(245,240,250,0.14)] p-4 rounded shadow-2xl flex flex-col gap-2.5 font-mono max-w-[240px]"
            >
              <div className="flex items-center gap-1.5 text-[9px] font-black tracking-widest text-[#00E5FF]">
                <Compass className="w-3.5 h-3.5 animate-spin-slow" />
                <span>HOTSPOT TELEMETRY CONSOLE</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.id
                  return (
                    <Button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id)
                        setSelectedLocation(null)
                      }}
                      variant={isActive ? "primary" : "ghost"}
                      size="sm"
                      className="font-mono text-[10px] tracking-wider uppercase font-bold justify-start"
                    >
                      {cat.name}
                    </Button>
                  )
                })}
              </div>
            </Card>

            {/* Hotspot markers rendered using percentages */}
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
                <Loader2 className="animate-spin text-[#FF2E88] w-8 h-8" />
              </div>
            ) : filteredLocations.length > 0 ? (
              filteredLocations.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id

                let pinColor = "text-[#FF2E88]"
                let rgbColor = "255, 46, 136" // Default magenta

                if (loc.category === "city") {
                  pinColor = "text-[#00E5FF]"
                  rgbColor = "0, 229, 255"
                } else if (loc.category === "landmark") {
                  pinColor = "text-[#6C1FB5]"
                  rgbColor = "108, 31, 181"
                } else if (loc.category === "easter-egg") {
                  pinColor = "text-amber-400"
                  rgbColor = "251, 191, 36"
                }

                // Recalculate heat glow intensity normalized against max counts
                const viewCount = loc.view_count || 0
                const intensity = maxViewCount > 0 ? viewCount / maxViewCount : 0

                // Keep scaling curve gentle and very subtle
                const glowSize = Math.round(10 + intensity * 35) // 10px to 45px
                const glowOpacity = Math.max(0.04, Math.min(0.7, 0.08 + intensity * 0.58)) // 0.08 to 0.66

                return (
                  <button
                    key={loc.id}
                    onClick={() => handleOpenLocation(loc)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-300 hover:scale-135 focus:outline-none group"
                    style={{
                      left: `${loc.x_coord}%`,
                      top: `${loc.y_coord}%`,
                    }}
                  >
                    {/* Normalized Trending Heat Glow Halo */}
                    <span
                      className="absolute rounded-full pointer-events-none transition-all duration-500 animate-pulse"
                      style={{
                        width: `${glowSize}px`,
                        height: `${glowSize}px`,
                        boxShadow: `0 0 ${glowSize}px ${Math.round(glowSize / 2)}px rgba(${rgbColor}, ${glowOpacity})`,
                        opacity: glowOpacity,
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: -1,
                      }}
                    />

                    <div className="relative flex items-center justify-center">
                      <MapPin className={`w-5 h-5 ${pinColor} filter drop-shadow-[0_0_8px_currentColor]`} />
                      <span className="absolute w-1.5 h-1.5 rounded-full bg-white" />
                    </div>

                    {/* Popover label on hover */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-7 bg-[#0B0710]/95 border border-[rgba(245,240,250,0.14)] px-2.5 py-1 rounded text-[9px] font-black font-mono text-white uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none select-none">
                      {loc.name}
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-xs text-[#9C8FAE] uppercase tracking-widest font-mono">
                  No telemetry pins registered in sector.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Info Overlay Side Panel styled with Part A Card primitive */}
        <div className="lg:col-span-1">
          <Card
            variant="standard"
            padding="sm"
            className="h-full min-h-[450px] flex flex-col justify-between shadow-xl animate-in fade-in slide-in-from-right-4 duration-200"
          >
            {selectedLocation ? (
              <div className="space-y-6 flex-grow flex flex-col">
                <div className="flex justify-between items-start border-b border-[rgba(245,240,250,0.08)] pb-2.5">
                  <span className="text-[10px] font-black tracking-widest text-[#00E5FF] uppercase font-mono">
                    COORDINATES DOSSIER
                  </span>
                  <button
                    onClick={() => setSelectedLocation(null)}
                    className="p-1 hover:bg-white/5 rounded text-[#9C8FAE] hover:text-white transition"
                    aria-label="Deselect location"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Image thumbnail if exists */}
                {selectedLocation.image && (
                  <div className="aspect-video relative rounded-lg overflow-hidden border border-[rgba(245,240,250,0.12)] bg-[#0B0710]">
                    <NextImage
                      src={selectedLocation.image}
                      alt={selectedLocation.name}
                      fill
                      className="object-cover"
                      sizes="250px"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white leading-tight">
                    {selectedLocation.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge color="cyan" variant="subtle">
                      {selectedLocation.category === "poi" ? "Point of Interest" : selectedLocation.category.replace("-", " ")}
                    </Badge>
                    <Badge
                      color={selectedLocation.status === "confirmed" ? "green" : "yellow"}
                      variant="outline"
                      className="gap-1"
                    >
                      {selectedLocation.status === "confirmed" ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {selectedLocation.status}
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-[#9C8FAE] leading-relaxed bg-[#0B0710]/50 border border-[rgba(245,240,250,0.06)] p-3.5 rounded-lg">
                  {selectedLocation.description || "No sector classification files available."}
                </p>

                {/* Related content / Evidence Section */}
                <div className="space-y-3 pt-3 border-t border-[rgba(245,240,250,0.1)]">
                  <h4 className="text-[10px] font-black uppercase text-[#FF2E88] tracking-widest font-mono">
                    VERIFIED EVIDENCE ({relatedContentList.length})
                  </h4>
                  {relatedContentList.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {relatedContentList.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          className="flex items-center justify-between p-2.5 rounded bg-[#0B0710] border border-[rgba(245,240,250,0.06)] hover:border-[#FF2E88]/40 transition group"
                        >
                          <span className="text-xs font-semibold text-[#9C8FAE] group-hover:text-white truncate pr-2">
                            {item.title}
                          </span>
                          <ExternalLink size={12} className="text-[#9C8FAE]/40 group-hover:text-[#FF2E88] shrink-0" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#9C8FAE]/40 font-mono font-bold italic">
                      No related articles or coordinate walkthrough files linked.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12">
                <Layers className="w-10 h-10 text-[#9C8FAE]/20 animate-pulse" />
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    GRID SECTOR UNSECURED
                  </h3>
                  <p className="text-xs text-[#9C8FAE]/50 max-w-[180px] leading-relaxed">
                    Click on any telemetry hotspot on the canvas grid to decode site files and coordinates.
                  </p>
                </div>
              </div>
            )}

            {/* Footer Coordinates monitor */}
            <div className="border-t border-[rgba(245,240,250,0.1)] pt-4 mt-6 text-[9px] font-mono text-[#9C8FAE]/45 flex justify-between items-center bg-[#0B0710]/40 p-2.5 rounded">
              <span>MAP CODES:</span>
              <span className="text-white font-bold">1600 X 1000px FLUID</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
