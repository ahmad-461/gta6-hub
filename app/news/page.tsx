import React from "react"
import Link from "next/link"
import Image from "next/image"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Search, X, ArrowRight, ShieldCheck, AlertTriangle, Radio, Sparkles } from "lucide-react"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import EmptyState from "@/components/ui/EmptyState"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "GTA VI Intelligence & News Desk | GTA VI Hub",
  description: "The official intelligence desk for Grand Theft Auto VI. Breaking verified reports, rumors, leaks, trailer analysis, and state of Leonida updates.",
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "RECENT TRANSMISSION"
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).toUpperCase()
  } catch {
    return dateStr || ""
  }
}

function getImageUrl(url?: string | null) {
  if (!url) return "/og-image.jpg"
  return url
}

function renderStatusBadge(status?: string | null) {
  if (!status) return null
  const s = status.toLowerCase()
  if (s === "confirmed") {
    return (
      <Badge color="green" variant="subtle">
        <ShieldCheck className="w-3 h-3 mr-1 inline-block text-emerald-400" />
        [ VERIFIED ]
      </Badge>
    )
  }
  if (s === "rumor" || s === "unconfirmed" || s === "reported") {
    return (
      <Badge color="yellow" variant="subtle">
        <AlertTriangle className="w-3 h-3 mr-1 inline-block text-amber-400" />
        [ RUMOR ]
      </Badge>
    )
  }
  if (s === "debunked") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
        [ DEBUNKED ]
      </span>
    )
  }
  return (
    <Badge color="cyan" variant="subtle">
      [ {status.toUpperCase()} ]
    </Badge>
  )
}

interface NewsPageProps {
  searchParams: {
    page?: string
    category?: string
    q?: string
  }
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const currentPage = Number(searchParams.page) || 1
  const categorySlug = searchParams.category || ""
  const searchQuery = (searchParams.q || "").trim()
  const limit = 12
  const from = (currentPage - 1) * limit
  const to = from + limit - 1

  const supabase = createSupabaseServerClient()

  // 1. Fetch categories
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name")

  if (categoriesError) {
    console.error("[NewsPage Categories Fetch Error]:", categoriesError)
  }

  // 1.5. Fetch active categories (only categories with published articles)
  const { data: publishedArticles, error: pubArticlesError } = await supabase
    .from("articles")
    .select("category")
    .eq("status", "published")

  if (pubArticlesError) {
    console.error("[NewsPage Active Categories Query Error]:", pubArticlesError)
  }

  const activeCategoryIds = Array.from(
    new Set(publishedArticles?.map((a) => a.category).filter(Boolean) || [])
  )

  const activeCategories =
    categories?.filter((cat) => activeCategoryIds.includes(cat.id) || activeCategoryIds.includes(cat.slug)) || []

  // 2. Fetch specific category ID if filtering
  let categoryId = null
  let selectedCategoryName = ""
  if (categorySlug) {
    const { data: cat, error: catError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("slug", categorySlug)
      .maybeSingle()

    if (catError) {
      console.error("[NewsPage Selected Category Fetch Error]:", catError)
    }

    if (cat) {
      categoryId = cat.id
      selectedCategoryName = cat.name
    } else {
      selectedCategoryName = categorySlug
    }
  }

  // 3. Query main articles
  let query = supabase
    .from("articles")
    .select(`
      id,
      title,
      slug,
      excerpt,
      content,
      featured_image,
      published_at,
      created_at,
      rumor_status,
      author_id,
      category
    `, { count: "exact" })
    .eq("status", "published")

  if (categorySlug) {
    if (categoryId) {
      query = query.or(`category.eq.${categoryId},category.eq.${categorySlug}`)
    } else {
      query = query.eq("category", categorySlug)
    }
  }

  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`)
  }

  const { data: rawArticles, count, error: articlesError } = await query
    .order("published_at", { ascending: false })
    .range(from, to)

  if (articlesError) {
    console.error("[NewsPage Articles Query Error]:", articlesError)
  }

  // 4. Resolve Authors from profiles table
  const authorIds = Array.from(
    new Set((rawArticles || []).map((art) => art.author_id).filter(Boolean))
  ) as string[]

  const authorMap = new Map<string, string>()
  if (authorIds.length > 0) {
    const { data: authors, error: authorsError } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", authorIds)

    if (authorsError) {
      console.error("[NewsPage Authors Fetch Error]:", authorsError)
    } else if (authors) {
      authors.forEach((a) => {
        if (a.name) authorMap.set(a.id, a.name)
      })
    }
  }

  // Map category object & author name for rendering
  const articlesWithCategories = (rawArticles || []).map((art) => {
    let catObj = null
    if (art.category) {
      const match = (categories || []).find((c) => c.id === art.category || c.slug === art.category)
      catObj = match || { id: art.category, name: art.category, slug: art.category.toLowerCase().replace(/\s+/g, "-") }
    }
    const resolvedAuthor = art.author_id ? authorMap.get(art.author_id) || "GTA VI Hub Editorial" : "GTA VI Hub Editorial"

    const wordCount = art.content ? art.content.split(/\s+/).length : 0
    const readTime = Math.max(1, Math.ceil(wordCount / 200))

    return {
      ...art,
      categoryData: catObj,
      authorName: resolvedAuthor,
      readTime,
    }
  })

  // Get breaking headline for news ticker
  const breakingArticle = articlesWithCategories.length > 0 ? articlesWithCategories[0] : null

  const totalItems = count || 0
  const totalPages = Math.ceil(totalItems / limit) || 1

  // Helper to build URL query
  const buildFilterUrl = (params: { page?: number; category?: string | null; q?: string | null }) => {
    const urlParams = new URLSearchParams()
    const newCat = params.category !== undefined ? params.category : categorySlug
    const newQ = params.q !== undefined ? params.q : searchQuery
    const newPage = params.page !== undefined ? params.page : 1

    if (newCat) urlParams.set("category", newCat)
    if (newQ) urlParams.set("q", newQ)
    if (newPage > 1) urlParams.set("page", String(newPage))

    const str = urlParams.toString()
    return str ? `/news?${str}` : "/news"
  }

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-[#F5F5F7] font-sans selection:bg-[#FF2D8D] selection:text-white">

      {/* 1. BREAKING NEWS TICKER */}
      <div className="bg-[#16161B] border-b border-[rgba(245,245,247,0.14)] py-2.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
            <span className="px-2.5 py-0.5 rounded bg-[#FF2D8D] text-white font-black uppercase text-[10px] tracking-widest flex-shrink-0 animate-pulse">
              BREAKING
            </span>
            <div className="text-[#9E9EA8] truncate flex items-center gap-2">
              <span className="text-white font-bold">Rockstar Games • GTA VI • Leonida</span>
              <span className="hidden md:inline text-[rgba(245,245,247,0.2)]">|</span>
              <span className="hidden md:inline text-white/90 truncate max-w-xl">
                {breakingArticle ? breakingArticle.title : "Monitoring Rockstar Games Telemetry & Dispatches"}
              </span>
            </div>
          </div>
          {breakingArticle && (
            <Link
              href={`/news/${breakingArticle.slug}`}
              className="text-[#FF8A3D] hover:text-white font-bold uppercase text-[10px] tracking-widest flex items-center gap-1 flex-shrink-0 transition-colors"
            >
              READ REPORT &rarr;
            </Link>
          )}
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">

        {/* 2. CRISP PAGE HEADER */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16161B] border border-[#FF8A3D]/30 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#FF8A3D] animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF8A3D]">
              LIVE GTA VI DISPATCHES
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-anton uppercase tracking-wider text-[#F5F5F7]">
            LATEST <span className="text-[#FF8A3D]">INTEL</span>
          </h1>
          <p className="text-xs sm:text-sm font-mono text-[#9E9EA8] max-w-2xl leading-relaxed">
            Breaking reports, verified dispatches, rumors, leaks, trailer analysis, and state of Leonida updates.
          </p>
        </div>

        {/* 3. CATEGORY FILTER BAR & SEARCH */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3.5 rounded-xl bg-[#16161B] border border-[rgba(245,245,247,0.14)]">

            {/* Pill-Style Category Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none font-mono">
              <Link href={buildFilterUrl({ category: null, page: 1 })}>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className={
                    !categorySlug
                      ? "bg-[#FF8A3D] text-black hover:bg-[#FF8A3D]/90 border-[#FF8A3D] shadow-md shadow-[#FF8A3D]/20 font-mono text-[11px] font-bold"
                      : "text-[#9E9EA8] hover:text-[#F5F5F7] hover:border-[#FF8A3D]/40 border-[rgba(245,245,247,0.14)] font-mono text-[11px]"
                  }
                >
                  ALL INTELLIGENCE
                </Button>
              </Link>

              {activeCategories.map((cat) => {
                const isActive = categorySlug === cat.slug
                return (
                  <Link key={cat.id} href={buildFilterUrl({ category: cat.slug, page: 1 })}>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className={
                        isActive
                          ? "bg-[#FF8A3D] text-black hover:bg-[#FF8A3D]/90 border-[#FF8A3D] shadow-md shadow-[#FF8A3D]/20 font-mono text-[11px] font-bold"
                          : "text-[#9E9EA8] hover:text-[#F5F5F7] hover:border-[#FF8A3D]/40 border-[rgba(245,245,247,0.14)] font-mono text-[11px]"
                      }
                    >
                      {cat.name}
                    </Button>
                  </Link>
                )
              })}
            </div>

            {/* Search Input Form */}
            <form action="/news" method="GET" className="relative w-full md:w-72 flex-shrink-0">
              {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 text-[#9E9EA8]" />
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search intelligence..."
                  className="w-full bg-[#0B0B0F] border border-[rgba(245,245,247,0.14)] rounded-lg pl-9 pr-9 py-2 text-xs text-white placeholder-[#9E9EA8]/60 focus:outline-none focus:border-[#FF8A3D] transition-all font-mono"
                />
                {searchQuery ? (
                  <Link
                    href={buildFilterUrl({ q: null, page: 1 })}
                    className="absolute right-3 text-[#9E9EA8] hover:text-white"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </Link>
                ) : null}
              </div>
            </form>

          </div>

          {/* Active Filter Indicator */}
          {(selectedCategoryName || searchQuery) && (
            <div className="flex items-center justify-between text-xs font-mono text-[#9E9EA8] bg-[#16161B]/60 px-4 py-2 rounded-lg border border-[rgba(245,245,247,0.08)]">
              <span>
                Filtering by:{" "}
                {selectedCategoryName && (
                  <span className="text-[#FF2D8D] font-bold mr-2">Category: {selectedCategoryName}</span>
                )}
                {searchQuery && (
                  <span className="text-[#FF8A3D] font-bold">Query: &quot;{searchQuery}&quot;</span>
                )}
              </span>
              <Link
                href="/news"
                className="text-xs font-bold text-[#FF2D8D] hover:underline uppercase tracking-wider"
              >
                Reset All Filters
              </Link>
            </div>
          )}
        </div>

        {/* 4. ARTICLE GRID — RESPONSIVE 3-COLUMN LAYOUT */}
        {articlesWithCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articlesWithCategories.map((art, idx) => {
              const isNew = currentPage === 1 && idx < 2
              return (
                <Card
                  key={art.id}
                  variant="standard"
                  padding="none"
                  hoverGlow="magenta"
                  interactive
                  className="group flex flex-col justify-between overflow-hidden bg-[#16161B] border border-[rgba(245,245,247,0.14)] hover:border-[#FF8A3D]/50 hover:shadow-[0_4px_20px_rgba(255,138,61,0.15)] transition-all duration-300"
                >
                  <div className="flex flex-col">
                    {/* Featured Image Container */}
                    <div className="relative w-full aspect-video overflow-hidden bg-[#0B0B0F]">
                      <Image
                        src={getImageUrl(art.featured_image)}
                        alt={art.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        quality={90}
                        className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />

                      {/* Overlaid Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {art.categoryData && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest bg-[#0B0B0F]/90 text-[#F5F5F7] border border-[rgba(245,245,247,0.2)] backdrop-blur-md">
                              {art.categoryData.name}
                            </span>
                          )}
                          {renderStatusBadge(art.rumor_status)}
                        </div>

                        {/* Top 1-2 Understated "NEW" Badge */}
                        {isNew && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-[#FF8A3D] text-black shadow-md shadow-[#FF8A3D]/30">
                            <Sparkles className="w-2.5 h-2.5 text-black" />
                            NEW
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <h3 className="text-base sm:text-lg font-bold text-[#F5F5F7] group-hover:text-[#FF8A3D] transition-colors leading-snug line-clamp-2">
                        <Link href={`/news/${art.slug}`}>{art.title}</Link>
                      </h3>
                      <p className="text-xs text-[#9E9EA8] leading-relaxed line-clamp-3">
                        {art.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer Metadata Row */}
                  <div className="p-5 pt-3 border-t border-[rgba(245,245,247,0.08)] flex items-center justify-between text-[11px] font-mono text-[#9E9EA8]/70">
                    <div className="flex items-center gap-2 truncate">
                      <span>{formatDate(art.published_at)}</span>
                      <span>•</span>
                      <span>{art.readTime} MIN READ</span>
                    </div>
                    <Link
                      href={`/news/${art.slug}`}
                      className="text-[#FF8A3D] hover:text-white font-bold uppercase tracking-wider flex items-center gap-1 group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-2"
                    >
                      READ <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          /* 5. IN-VOICE EMPTY STATE */
          <EmptyState
            icon={<Radio className="w-10 h-10 text-[#FF8A3D]" />}
            title="NO CONFIRMED TRANSMISSIONS YET"
            description="No stories are available matching your query or filter parameters. Standing by."
            action={
              <Link href="/news">
                <Button
                  variant="primary"
                  size="md"
                  className="bg-[#FF8A3D] hover:bg-[#FF8A3D]/90 text-black border-[#FF8A3D] font-mono font-bold"
                >
                  CLEAR FILTERS
                </Button>
              </Link>
            }
          />
        )}

        {/* 6. PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-8 border-t border-[rgba(245,245,247,0.14)] font-mono">
            {Array.from({ length: totalPages }, (_, i) => {
              const pageNum = i + 1
              const isCurrent = currentPage === pageNum
              return (
                <Link key={pageNum} href={buildFilterUrl({ page: pageNum })}>
                  <Button
                    type="button"
                    size="sm"
                    variant={isCurrent ? "primary" : "ghost"}
                    className={
                      isCurrent
                        ? "bg-[#FF8A3D] text-black hover:bg-[#FF8A3D]/90 border-[#FF8A3D] w-10 h-10 p-0 font-bold text-xs"
                        : "w-10 h-10 p-0 text-[#9E9EA8] hover:text-[#F5F5F7] hover:border-[#FF8A3D]/40 border-[rgba(245,245,247,0.14)] font-bold text-xs"
                    }
                  >
                    {pageNum}
                  </Button>
                </Link>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
