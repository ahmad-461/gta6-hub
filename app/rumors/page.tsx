"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import NextImage from "next/image"
import { supabase } from "@/lib/supabase"
import { Calendar, AlertCircle, HelpCircle, CheckCircle, ShieldAlert, Folder, Loader2 } from "lucide-react"

export default function RumorTrackerPage() {
  const [rumors, setRumors] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [activeFilter, setActiveFilter] = useState<string>("all")

  useEffect(() => {
    fetchRumors()
  }, [])

  const fetchRumors = async () => {
    setIsLoading(true)
    try {
      // 1. Fetch Categories for labeling
      const { data: catData } = await supabase.from("categories").select("id, name")
      setCategories(catData || [])

      // 2. Fetch Rumors: Published articles where rumor_status is not null
      const { data: rumorsData, error } = await supabase
        .from("articles")
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image,
          published_at,
          category,
          rumor_status
        `)
        .eq("status", "published")
        .not("rumor_status", "is", null)
        .order("published_at", { ascending: false })

      if (error) throw error
      setRumors(rumorsData || [])
    } catch (err) {
      console.error("Failed to load rumors", err)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRumors = rumors.filter((r) => {
    if (activeFilter === "all") return true
    return r.rumor_status === activeFilter
  })

  function formatDate(dateStr?: string) {
    if (!dateStr) return ""
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateStr || ""
    }
  }

  function getStatusConfig(status: string) {
    switch (status) {
      case "confirmed":
        return {
          label: "Confirmed",
          colorClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
          icon: <CheckCircle className="w-3.5 h-3.5" />,
        }
      case "debunked":
        return {
          label: "Debunked",
          colorClass: "bg-red-500/15 text-red-400 border-red-500/25",
          icon: <ShieldAlert className="w-3.5 h-3.5" />,
        }
      case "rumor":
      default:
        return {
          label: "Rumor",
          colorClass: "bg-amber-500/15 text-amber-400 border-amber-500/25",
          icon: <HelpCircle className="w-3.5 h-3.5" />,
        }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-card-border pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 text-neon-pink">
            <AlertCircle className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-black tracking-widest uppercase">Verified Credibility Ledger</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-mono">
            Rumor & Fact Tracker
          </h1>
          <p className="text-sm text-foreground/60 max-w-xl">
            We analyze, verify, and catalog raw bulleted leaks and rumors. Browse our database to stay ahead of speculation.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Speculations" },
            { id: "confirmed", label: "Confirmed Only" },
            { id: "rumor", label: "Rumors Only" },
            { id: "debunked", label: "Debunked Only" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all duration-200 ${
                activeFilter === pill.id
                  ? "bg-neon-pink text-white border-neon-pink shadow-[0_0_15px_rgba(255,0,127,0.3)]"
                  : "bg-card-bg text-foreground/75 border-card-border hover:border-neon-pink/50 hover:text-white"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rumors Feed Grid */}
      {isLoading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="animate-spin text-neon-pink w-10 h-10" />
        </div>
      ) : filteredRumors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRumors.map((rumor) => {
            const statusConfig = getStatusConfig(rumor.rumor_status)
            const catName = categories.find((c) => c.id === rumor.category)?.name || "Uncategorized"
            const imgUrl = rumor.featured_image || "/og-image.jpg"

            return (
              <article
                key={rumor.id}
                className="group flex flex-col justify-between bg-card-bg border border-card-border rounded-xl overflow-hidden hover:border-neon-pink/45 transition-all duration-300 shadow-md"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative w-full h-48 overflow-hidden">
                    <NextImage
                      src={imgUrl}
                      alt={rumor.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 30vw"
                    />

                    {/* Status Badge Overlaid on Thumbnail */}
                    <div className="absolute top-4 left-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md shadow-md ${statusConfig.colorClass}`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neon-blue flex items-center gap-1">
                      <Folder className="w-3 h-3" />
                      {catName}
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white group-hover:text-neon-pink transition-colors line-clamp-2 leading-snug">
                      <Link href={`/news/${rumor.slug}`}>{rumor.title}</Link>
                    </h2>
                    <p className="text-sm text-foreground/70 leading-relaxed line-clamp-3">
                      {rumor.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 mt-2 border-t border-card-border/30 flex items-center justify-between text-[11px] text-foreground/40 font-semibold">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-foreground/30" />
                    {formatDate(rumor.published_at)}
                  </span>
                  <Link
                    href={`/news/${rumor.slug}`}
                    className="text-neon-pink font-bold hover:underline uppercase tracking-wider"
                  >
                    Read Verification &rarr;
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="border border-dashed border-card-border p-16 text-center rounded-xl bg-card-bg/40 max-w-xl mx-auto space-y-3">
          <HelpCircle className="w-12 h-12 text-foreground/20 mx-auto" />
          <h4 className="text-lg font-bold text-white uppercase font-mono">No Ledgers Plotted</h4>
          <p className="text-xs text-foreground/50 leading-relaxed">
            There are currently no published rumors, debunked alerts, or confirmed leaks matching the requested credibility filters.
          </p>
        </div>
      )}
    </div>
  )
}
