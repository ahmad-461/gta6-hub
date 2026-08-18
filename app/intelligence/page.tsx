"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import NextImage from "next/image"
import { supabase } from "@/lib/supabase"
import {
  Calendar,
  HelpCircle,
  CheckCircle,
  ShieldAlert,
  Folder,
  ExternalLink,
  Cpu,
  Activity,
  FileText,
  Award
} from "lucide-react"

import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Badge from "@/components/ui/Badge"
import EmptyState from "@/components/ui/EmptyState"
import LoadingSkeleton from "@/components/ui/LoadingSkeleton"

export default function IntelligencePage() {
  const [rumors, setRumors] = useState<any[]>([])
  const [allArticles, setAllArticles] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [activeFilter, setActiveFilter] = useState<string>("all")

  useEffect(() => {
    fetchIntelligenceData()
  }, [])

  const fetchIntelligenceData = async () => {
    setIsLoading(true)
    try {
      // 1. Fetch Categories for labeling
      const { data: catData } = await supabase.from("categories").select("id, name, slug")
      setCategories(catData || [])

      // 2. Fetch all published articles to search related content in memory
      const { data: articlesData, error: artError } = await supabase
        .from("articles")
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image,
          published_at,
          updated_at,
          category,
          rumor_status
        `)
        .eq("status", "published")
        .order("published_at", { ascending: false })

      if (artError) throw artError
      const publishedArticles = articlesData || []
      setAllArticles(publishedArticles)

      // Filter rumor status specific articles for main display feed
      const rumorArticles = publishedArticles.filter((r) => r.rumor_status !== null)
      setRumors(rumorArticles)
    } catch (err) {
      console.error("Failed to load intelligence records:", err)
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
          color: "green" as const,
          icon: <CheckCircle className="w-3 h-3" />,
        }
      case "debunked":
        return {
          label: "Debunked",
          color: "magenta" as const,
          icon: <ShieldAlert className="w-3 h-3" />,
        }
      case "rumor":
      default:
        return {
          label: "Unverified",
          color: "yellow" as const,
          icon: <HelpCircle className="w-3 h-3" />,
        }
    }
  }

  // Related Content Row logic (same category first, fallback to tags/latest)
  const getRelatedContentForArticle = (article: any) => {
    const articleCategory = article.category
    const relatedList: any[] = []

    // 1. Same category articles (excluding itself)
    const sameCategoryArticles = allArticles.filter(
      (a) => a.id !== article.id && a.category === articleCategory
    )
    sameCategoryArticles.forEach((a) => {
      relatedList.push({ id: a.id, title: a.title, href: `/news/${a.slug}`, type: "article" })
    })

    // 2. Fallback to latest published articles
    if (relatedList.length < 3) {
      const latestArticles = allArticles.filter(
        (a) => a.id !== article.id && !relatedList.some((r) => r.id === a.id)
      )
      latestArticles.forEach((a) => {
        if (relatedList.length < 3) {
          relatedList.push({ id: a.id, title: a.title, href: `/news/${a.slug}`, type: "article" })
        }
      })
    }

    return relatedList.slice(0, 3)
  }

  // Count stats
  const totalCount = rumors.length
  const confirmedCount = rumors.filter((r) => r.rumor_status === "confirmed").length
  const unverifiedCount = rumors.filter((r) => r.rumor_status === "rumor").length
  const debunkedCount = rumors.filter((r) => r.rumor_status === "debunked").length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-12 animate-fade-in text-[#F5F0FA]">

      {/* HUD Header Bar using Card with corner brackets */}
      <Card variant="standard" padding="lg" showCornerBrackets className="relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5 text-[#FF2E88]">
              <Cpu className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase font-mono">
                LEONIDA INTEL DIRECTIVE // CORE TELEMETRY
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-anton uppercase tracking-tight text-white leading-none">
              INTELLIGENCE COMMAND
            </h1>
            <p className="text-sm text-[#9C8FAE] max-w-xl leading-relaxed">
              Real-time credibility verification ledgers of leaks, speculations, and dynamic rumors circulating Leonida. Map out verified signals from white noise.
            </p>
          </div>

          {/* Core metrics tracker panel inside Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#0B0710]/70 border border-[rgba(245,240,250,0.08)] rounded-lg font-mono">
            <div className="px-4 py-2 border-r border-[rgba(245,240,250,0.08)] last:border-0">
              <span className="block text-[10px] text-[#9C8FAE] uppercase font-bold">TOTAL REPORTS</span>
              <span className="text-2xl font-black text-white">{isLoading ? "..." : totalCount}</span>
            </div>
            <div className="px-4 py-2 border-r border-[rgba(245,240,250,0.08)] last:border-0">
              <span className="block text-[10px] text-emerald-400 uppercase font-bold">CONFIRMED</span>
              <span className="text-2xl font-black text-emerald-400">{isLoading ? "..." : confirmedCount}</span>
            </div>
            <div className="px-4 py-2 border-r border-[rgba(245,240,250,0.08)] last:border-0 text-amber-400">
              <span className="block text-[10px] text-amber-400 uppercase font-bold">UNVERIFIED</span>
              <span className="text-2xl font-black text-amber-400">{isLoading ? "..." : unverifiedCount}</span>
            </div>
            <div className="px-4 py-2 last:border-0 text-rose-400">
              <span className="block text-[10px] text-rose-400 uppercase font-bold">DEBUNKED</span>
              <span className="text-2xl font-black text-rose-400">{isLoading ? "..." : debunkedCount}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Filter and Console Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-[rgba(245,240,250,0.14)] pb-6">
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#9C8FAE]">
          <Activity className="w-4 h-4 text-[#00E5FF]" />
          <span>SIGNAL FILTER STATUS:</span>
          <span className="text-white bg-[#150C1F] px-2 py-1 rounded border border-[rgba(245,240,250,0.14)]">
            {activeFilter.toUpperCase()}
          </span>
        </div>

        {/* Filter Pills using Button Primitives */}
        <div className="flex flex-wrap gap-2.5">
          {[
            { id: "all", label: "ALL REPORTS" },
            { id: "confirmed", label: "CONFIRMED" },
            { id: "rumor", label: "UNVERIFIED" },
            { id: "debunked", label: "DEBUNKED" },
          ].map((pill) => (
            <Button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id)}
              variant={activeFilter === pill.id ? "primary" : "ghost"}
              size="sm"
              className={activeFilter === pill.id ? "shadow-[0_0_15px_rgba(255,46,136,0.3)]" : ""}
            >
              {pill.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Rumors Feed Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="card" />
        </div>
      ) : filteredRumors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRumors.map((rumor) => {
            const statusConfig = getStatusConfig(rumor.rumor_status)
            const catName = categories.find((c) => c.id === rumor.category)?.name || "Leonida Classified"
            const imgUrl = rumor.featured_image || "/og-image.jpg"
            const relatedContent = getRelatedContentForArticle(rumor)

            return (
              <Card
                key={rumor.id}
                padding="none"
                variant="standard"
                hoverGlow="magenta"
                interactive
                className="group flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Cover */}
                  <div className="relative w-full h-48 overflow-hidden bg-[#0B0710] border-b border-[rgba(245,240,250,0.14)]">
                    <NextImage
                      src={imgUrl}
                      alt={rumor.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      sizes="(max-width: 768px) 100vw, 30vw"
                    />

                    {/* Dynamic Confidence Badge Overlaid */}
                    <div className="absolute top-4 left-4 z-10">
                      <Badge
                        color={statusConfig.color}
                        variant="filled"
                        className="gap-1 px-3 py-1.5 rounded-sm backdrop-blur-md"
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Body Copy */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-bold font-mono text-[#00E5FF] uppercase tracking-widest">
                      <span className="flex items-center gap-1">
                        <Folder className="w-3.5 h-3.5 text-[#00E5FF]/70" />
                        {catName}
                      </span>
                      <span className="flex items-center gap-1 text-[#9C8FAE]">
                        <Calendar className="w-3.5 h-3.5 text-[#9C8FAE]/60" />
                        Last Verified: {formatDate(rumor.updated_at || rumor.published_at)}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-white group-hover:text-[#FF2E88] transition-colors line-clamp-2 leading-snug">
                      <Link href={`/news/${rumor.slug}`}>{rumor.title}</Link>
                    </h2>

                    <p className="text-xs sm:text-sm text-[#9C8FAE] leading-relaxed line-clamp-3">
                      {rumor.excerpt}
                    </p>
                  </div>
                </div>

                {/* Related Content & Action row */}
                <div className="p-6 pt-0 mt-2 space-y-4">
                  {/* Related Content list */}
                  {relatedContent.length > 0 && (
                    <div className="border-t border-[rgba(245,240,250,0.08)] pt-4 space-y-2">
                      <span className="block text-[9px] font-black font-mono text-[#9C8FAE]/55 tracking-widest uppercase">
                        RELATED INTELLIGENCE DOSSIER:
                      </span>
                      <div className="space-y-1.5">
                        {relatedContent.map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            className="flex items-center justify-between text-xs py-1 px-2.5 rounded bg-[#0B0710]/50 border border-[rgba(245,240,250,0.04)] hover:border-[#00E5FF]/30 transition group/item"
                          >
                            <span className="truncate pr-3 text-[#9C8FAE] group-hover/item:text-white font-semibold flex items-center gap-1.5">
                              {item.type === "article" ? (
                                <FileText className="w-3 h-3 text-[#FF2E88]" />
                              ) : (
                                <Award className="w-3 h-3 text-[#00E5FF]" />
                              )}
                              {item.title}
                            </span>
                            <ExternalLink className="w-3 h-3 text-[#9C8FAE]/40 group-hover/item:text-[#00E5FF] shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Read Verification button */}
                  <div className="border-t border-[rgba(245,240,250,0.08)] pt-4 flex justify-end">
                    <Link
                      href={`/news/${rumor.slug}`}
                      className="text-xs font-bold font-mono text-[#FF2E88] hover:underline uppercase tracking-wider flex items-center gap-1"
                    >
                      Verify Signal &rarr;
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={<HelpCircle className="w-12 h-12 text-[#9C8FAE]/30 mx-auto" />}
          title="No intercepted whispers matching filter"
          description="This signal tier is quiet. Meticulous tracking continues. Standing by."
        />
      )}
    </div>
  )
}
