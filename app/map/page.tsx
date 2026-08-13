"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import NextImage from "next/image"
import { supabase } from "@/lib/supabase"
import { MapPin, X, Compass, Layers, CheckCircle2, AlertTriangle, ExternalLink, Loader2, Info } from "lucide-react"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"

export default function LeonidaMapPage() {
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
      const { data: guidesData } = await supabase.from("guides").select("id, title, slug, status")

      setLocations(locationsData || [])
      setArticles(articlesData || [])
      setGuides(guidesData || [])
    } catch (err) {
      console.error("Failed to fetch map data", err)
    } finally {
      setIsLoading(false)
    }
  }

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
        results.push({ ...gd, type: "guide", href: `/guides/Getting Started/${gd.slug}` }) // Using Getting Started fallback category, standard dynamic resolution
      }
    })

    return results
  }

  const relatedContentList = selectedLocation ? getRelatedContent(selectedLocation) : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow flex flex-col space-y-6">
      {/* Title & Description */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-[rgba(245,240,250,0.14)] pb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1.5 text-cyan">
            <Compass className="w-5 h-5 animate-spin-slow" />
            <span className="text-xs font-black tracking-widest uppercase font-mono">Leonida Intelligence Division</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-mono">
            Interactive Leonida Map
          </h1>
          <p className="text-sm text-paper-dim max-w-2xl mt-2">
            Explore vice districts, speculation hotspots, verified landmarks, and hidden easter eggs of Vice City and wider state of Leonida.
          </p>
        </div>

        {/* Categories Filter dock console with dark tactical styling */}
        <Card variant="console" padding="sm" showCornerBrackets className="flex flex-wrap gap-1.5 shrink-0">
          {[
            { id: "all", name: "All Sites" },
            { id: "city", name: "Cities" },
            { id: "landmark", name: "Landmarks" },
            { id: "poi", name: "Points of Interest" },
            { id: "easter-egg", name: "Easter Eggs" },
          ].map((cat) => (
            <Button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id)
                setSelectedLocation(null)
              }}
              variant={activeCategory === cat.id ? "primary" : "ghost"}
              size="sm"
            >
              {cat.name}
            </Button>
          ))}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left/Main Map Canvas */}
        <div className="lg:col-span-3 bg-ink-2/40 border border-[rgba(245,240,250,0.14)] rounded-xl p-2 relative overflow-hidden flex flex-col items-center justify-center min-h-[500px]">
          {/* Responsive aspect-ratio-locked relative map container */}
          <div className="relative w-full aspect-[16/10] bg-[#0c0a10] rounded-lg overflow-hidden border border-[rgba(245,240,250,0.08)]">
            {/* Dark Neon stylized region map SVG/Canvas background */}
            <svg
              className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
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
            <div className="absolute top-6 left-6 text-[10px] font-black text-white/20 uppercase tracking-widest font-mono pointer-events-none select-none">
              LEONIDA COMPREHENSIVE INTELLIGENCE FEED v0.98<br />
              COORDINATES TRACKED VIA INTEL RETRIEVAL SATELLITE
            </div>

            {/* Hotspot markers rendered using percentages */}
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                <Loader2 className="animate-spin text-magenta w-8 h-8" />
              </div>
            ) : filteredLocations.length > 0 ? (
              filteredLocations.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id
                // Color categories mapping
                let pinColor = "text-magenta"
                let bgColor = "bg-magenta"

                if (loc.category === "city") {
                  pinColor = "text-cyan"
                  bgColor = "bg-cyan"
                } else if (loc.category === "landmark") {
                  pinColor = "text-violet"
                  bgColor = "bg-violet"
                } else if (loc.category === "easter-egg") {
                  pinColor = "text-amber-400"
                  bgColor = "bg-amber-400"
                }

                return (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedLocation(loc)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-300 hover:scale-125 focus:outline-none group"
                    style={{
                      left: `${loc.x_coord}%`,
                      top: `${loc.y_coord}%`,
                    }}
                  >
                    {/* Pulsing ring */}
                    <span className={`absolute inline-flex h-6 w-6 rounded-full opacity-75 animate-ping -left-1.5 -top-1.5 ${bgColor}`} />

                    <div className="relative flex items-center justify-center">
                      <MapPin className={`w-5 h-5 ${pinColor} filter drop-shadow-[0_0_8px_currentColor]`} />
                      {/* Inner core */}
                      <span className="absolute w-1.5 h-1.5 rounded-full bg-white" />
                    </div>

                    {/* Popover label on hover */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-6 bg-black/90 border border-[rgba(245,240,250,0.14)] px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none select-none">
                      {loc.name}
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-xs text-paper-dim/40 uppercase tracking-widest font-mono">
                  No hotspots loaded for this category
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Info Overlay Side Panel / Modal details mapped with Part A Card primitive */}
        <div className="lg:col-span-1">
          <Card
            variant="standard"
            padding="sm"
            className="h-full min-h-[450px] flex flex-col justify-between shadow-xl animate-in fade-in slide-in-from-right-4 duration-200"
          >
            {selectedLocation ? (
              <div className="space-y-4 flex-grow flex flex-col">
                <div className="flex justify-between items-start border-b border-[rgba(245,240,250,0.08)] pb-2.5">
                  <span className="text-[10px] font-black tracking-widest text-cyan uppercase font-mono">
                    Location Dossier
                  </span>
                  <button
                    onClick={() => setSelectedLocation(null)}
                    className="p-1 hover:bg-white/5 rounded text-paper-dim/60 hover:text-white transition"
                    aria-label="Deselect location"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Image thumbnail if exists */}
                {selectedLocation.image && (
                  <div className="aspect-video relative rounded-lg overflow-hidden border border-[rgba(245,240,250,0.14)] shadow-inner">
                    <NextImage
                      src={selectedLocation.image}
                      alt={selectedLocation.name}
                      fill
                      className="object-cover"
                      sizes="250px"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-paper leading-tight font-mono uppercase tracking-tight">
                    {selectedLocation.name}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge color="cyan" variant="subtle">
                      {selectedLocation.category === "poi" ? "Point of Interest" : selectedLocation.category.replace("-", " ")}
                    </Badge>
                    <Badge
                      color={selectedLocation.status === "confirmed" ? "green" : "yellow"}
                      variant="outline"
                    >
                      {selectedLocation.status}
                    </Badge>
                  </div>
                </div>

                {/* Section hierarchy: Description → Evidence/related content → Sources */}
                <div className="space-y-4 flex-grow">
                  {/* 1. Description */}
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-mono font-bold text-paper-dim/40 tracking-wider">
                      Classification Report:
                    </span>
                    <p className="text-xs text-paper-dim/80 leading-relaxed bg-ink/40 border border-[rgba(245,240,250,0.06)] p-3 rounded">
                      {selectedLocation.description || "No classification dossiers or leaks available for this sector."}
                    </p>
                  </div>

                  {/* 2. Evidence / Related Content */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase font-mono font-bold text-paper-dim/40 tracking-wider">
                      Telemetry Evidence ({relatedContentList.length})
                    </span>
                    {relatedContentList.length > 0 ? (
                      <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-thin">
                        {relatedContentList.map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            className="flex items-center justify-between p-1.5 rounded bg-ink/30 border border-[rgba(245,240,250,0.06)] hover:border-cyan/50 transition group"
                          >
                            <span className="text-[11px] font-bold text-paper-dim/80 group-hover:text-white truncate pr-2">
                              {item.title}
                            </span>
                            <ExternalLink size={10} className="text-paper-dim/30 group-hover:text-cyan shrink-0" />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-paper-dim/30 font-bold font-mono uppercase italic pl-1">
                        No telemetry coordinates associated.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3.5 py-12">
                <div className="p-3 bg-white/5 border border-[rgba(245,240,250,0.08)] rounded-full text-paper-dim/30 animate-pulse">
                  <Layers className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-[200px]">
                  <h3 className="text-xs font-bold text-paper uppercase tracking-widest font-mono">
                    Target Unspecified
                  </h3>
                  <p className="text-[11px] text-paper-dim/50 leading-relaxed">
                    Click on any interactive hotspot icon across the map grid to pull up telemetry coordinates.
                  </p>
                </div>
              </div>
            )}

            {/* Footer Coordinates monitor */}
            <div className="border-t border-[rgba(245,240,250,0.08)] pt-3.5 mt-4 text-[9px] font-mono text-paper-dim/40 flex justify-between items-center bg-ink/20 p-2 rounded">
              <span>SCAN GRID MONITOR:</span>
              <span className="text-white font-bold">1600 X 1000px FLUID</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
