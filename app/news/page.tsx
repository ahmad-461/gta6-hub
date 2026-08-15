import React from "react"
import Link from "next/link"
import Image from "next/image"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Calendar, FileText, Clock, Search, X, ArrowRight, ShieldCheck, AlertTriangle, Radio, TrendingUp } from "lucide-react"

export const revalidate = 3600

export const metadata = {
  title: "GTA VI Intelligence & News Desk | GTA VI Hub",
  description: "The official intelligence hub for Grand Theft Auto VI. Breaking verified reports, rumors, leaks, trailer analysis, and state of Leonida updates.",
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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
        <ShieldCheck className="w-3 h-3 text-emerald-400" />
        [ VERIFIED ]
      </span>
    )
  }
  if (s === "rumor" || s === "unconfirmed" || s === "reported") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
        <AlertTriangle className="w-3 h-3 text-amber-400" />
        [ RUMOR ]
      </span>
    )
  }
  if (s === "debunked") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/30 font-mono">
        [ DEBUNKED ]
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 font-mono">
      [ {status.toUpperCase()} ]
    </span>
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
  const limit = 10
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

  // 1.5. Fetch active categories (only categories with at least one published article)
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

  // 5. Fetch Latest Picks (Top 5 global recent articles for trending module)
  const { data: rawPicks } = await supabase
    .from("articles")
    .select("id, title, slug, featured_image, published_at, category")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(5)

  const latestPicks = (rawPicks || []).map((art) => {
    let catObj = null
    if (art.category) {
      const match = (categories || []).find((c) => c.id === art.category || c.slug === art.category)
      catObj = match || { id: art.category, name: art.category, slug: art.category.toLowerCase().replace(/\s+/g, "-") }
    }
    return { ...art, categoryData: catObj }
  })

  // 6. Split Featured story vs Grid on Page 1
  const featuredArticle = currentPage === 1 && articlesWithCategories.length > 0 ? articlesWithCategories[0] : null
  const gridArticles = currentPage === 1 ? articlesWithCategories.slice(1) : articlesWithCategories

  // Hero Article (Use featured article on page 1, or top item overall if filtering)
  const heroArticle = featuredArticle || (articlesWithCategories.length > 0 ? articlesWithCategories[0] : null)

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

      {/* 1. CINEMATIC HERO — THE FIRST IMPRESSION */}
      <section className="relative w-full overflow-hidden border-b border-[#F5F5F7]/10 bg-[#0B0B0F]">
        {/* Hero Background Image with Subtle Gradients */}
        <div className="absolute inset-0 z-0 opacity-35">
          <Image
            src={getImageUrl(heroArticle?.featured_image)}
            alt="GTA VI Intelligence Desk"
            fill
            priority
            className="object-cover object-center scale-105 filter blur-[1px] brightness-75"
            sizes="100vw"
          />
          {/* Subtle cinematic gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F] via-[#0B0B0F]/60 to-transparent" />
          {/* Subtle tactical grid background overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#FF8A3D_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-24 sm:pb-20">
          <div className="max-w-3xl space-y-6">
            {/* Live Indicator Badge */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-[#16161B]/90 border border-[#FF8A3D]/30 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#FF8A3D] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FF8A3D] font-mono">
                LIVE GTA VI INTELLIGENCE
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-none drop-shadow-lg font-display">
              THE LATEST FROM <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#F5F5F7] to-[#FF8A3D]">LEONIDA</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#9E9EA8] font-mono leading-relaxed max-w-2xl border-l-2 border-[#FF8A3D] pl-4 py-1">
              Breaking news, verified reports, rumors, leaks, trailer discoveries, and everything happening across the world of Grand Theft Auto VI.
            </p>

            {/* Publication Metadata Briefing Bar */}
            {heroArticle && (
              <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-[#9E9EA8]/80 border-t border-[#F5F5F7]/10">
                <span className="text-[#FF2D8D] font-bold uppercase tracking-wider">
                  {heroArticle.categoryData?.name || "FEATURED DOSSIER"}
                </span>
                <span className="hidden sm:inline text-[#F5F5F7]/20">•</span>
                <span>{formatDate(heroArticle.published_at)}</span>
                <span className="hidden sm:inline text-[#F5F5F7]/20">•</span>
                <span>{heroArticle.readTime} MIN READ</span>
                <span className="hidden sm:inline text-[#F5F5F7]/20">•</span>
                <span>BY {heroArticle.authorName.toUpperCase()}</span>
              </div>
            )}

            {/* CTAs */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <a
                href="#latest-intelligence"
                className="px-6 py-3.5 rounded-lg bg-[#FF8A3D] hover:bg-[#FF8A3D]/90 text-black font-black uppercase text-xs tracking-widest transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[#FF8A3D]/20 hover:translate-x-0.5 font-mono"
              >
                EXPLORE LATEST NEWS <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#all-stories"
                className="px-6 py-3.5 rounded-lg bg-[#16161B] border border-[#F5F5F7]/15 hover:border-[#F5F5F7]/40 text-[#F5F5F7] hover:text-white font-bold uppercase text-xs tracking-widest transition-all duration-200 font-mono"
              >
                VIEW ALL STORIES
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BREAKING NEWS TICKER */}
      <div className="bg-[#16161B] border-y border-[#F5F5F7]/10 py-3 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
            <span className="px-2.5 py-1 rounded bg-[#FF2D8D] text-white font-black uppercase text-[10px] tracking-widest flex-shrink-0 animate-pulse">
              BREAKING
            </span>
            <div className="text-[#9E9EA8] truncate flex items-center gap-2">
              <span className="text-white font-bold">Rockstar Games • GTA VI • Leonida</span>
              <span className="hidden md:inline text-[#F5F5F7]/30">|</span>
              <span className="hidden md:inline text-white/90 truncate max-w-md">
                {heroArticle ? heroArticle.title : "Monitoring Rockstar Games Telemetry & Dispatches"}
              </span>
            </div>
          </div>
          {heroArticle && (
            <Link
              href={`/news/${heroArticle.slug}`}
              className="text-[#FF8A3D] hover:text-white font-bold uppercase text-[10px] tracking-widest flex items-center gap-1 flex-shrink-0 transition-colors"
            >
              READ REPORT &rarr;
            </Link>
          )}
        </div>
      </div>

      {/* MAIN DESK BODY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* 3. SEARCH & CATEGORY NAVIGATION BAR */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl bg-[#16161B] border border-[#F5F5F7]/10">
            {/* Category Navigation Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none font-mono">
              <Link
                href={buildFilterUrl({ category: null, page: 1 })}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 border ${
                  !categorySlug
                    ? "bg-[#FF2D8D] text-white border-[#FF2D8D] shadow-md shadow-[#FF2D8D]/20"
                    : "bg-[#0B0B0F] text-[#9E9EA8] border-[#F5F5F7]/10 hover:border-[#FF2D8D]/50 hover:text-white"
                }`}
              >
                ALL INTELLIGENCE
              </Link>
              {activeCategories.map((cat) => {
                const isActive = categorySlug === cat.slug
                return (
                  <Link
                    key={cat.id}
                    href={buildFilterUrl({ category: cat.slug, page: 1 })}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 border ${
                      isActive
                        ? "bg-[#FF2D8D] text-white border-[#FF2D8D] shadow-md shadow-[#FF2D8D]/20"
                        : "bg-[#0B0B0F] text-[#9E9EA8] border-[#F5F5F7]/10 hover:border-[#FF2D8D]/50 hover:text-white"
                    }`}
                  >
                    {cat.name}
                  </Link>
                )
              })}
            </div>

            {/* Search Input Form */}
            <form action="/news" method="GET" className="relative w-full md:w-80 flex-shrink-0">
              {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 text-[#9E9EA8]" />
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search GTA VI intelligence..."
                  className="w-full bg-[#0B0B0F] border border-[#F5F5F7]/15 rounded-lg pl-9 pr-9 py-2 text-xs text-white placeholder-[#9E9EA8]/60 focus:outline-none focus:border-[#FF8A3D] transition-all font-mono"
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

          {/* Filter Status Indicator */}
          {(selectedCategoryName || searchQuery) && (
            <div className="flex items-center justify-between text-xs font-mono text-[#9E9EA8] bg-[#16161B]/60 px-4 py-2 rounded-lg border border-[#F5F5F7]/5">
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

        {/* 4. FEATURED STORY — EDITORIAL MASTER CARD */}
        {featuredArticle && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#F5F5F7]/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF8A3D] font-mono block">
                  TOP COVERAGE
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white font-display">
                  FEATURED INTELLIGENCE
                </h2>
              </div>
              <div className="w-12 h-0.5 bg-[#FF8A3D]" />
            </div>

            <article className="group relative rounded-2xl bg-[#16161B] border border-[#F5F5F7]/10 overflow-hidden hover:border-[#FF8A3D]/40 transition-all duration-300 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Left Image Column */}
              <div className="lg:col-span-7 relative min-h-[300px] sm:min-h-[400px] overflow-hidden">
                <Image
                  src={getImageUrl(featuredArticle.featured_image)}
                  alt={featuredArticle.title}
                  fill
                  priority
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="(max-w-1024px) 100vw, 60vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#16161B] via-transparent to-transparent lg:hidden" />
              </div>

              {/* Right Details Column */}
              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-[#16161B]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {featuredArticle.categoryData && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#FF2D8D] bg-[#FF2D8D]/10 border border-[#FF2D8D]/30 px-2.5 py-0.5 rounded font-mono">
                        {featuredArticle.categoryData.name}
                      </span>
                    )}
                    {renderStatusBadge(featuredArticle.rumor_status)}
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-[#FF8A3D] transition-colors leading-snug font-display">
                    <Link href={`/news/${featuredArticle.slug}`}>
                      {featuredArticle.title}
                    </Link>
                  </h3>

                  <p className="text-sm text-[#9E9EA8] leading-relaxed line-clamp-3 font-sans">
                    {featuredArticle.excerpt}
                  </p>
                </div>

                <div className="pt-6 border-t border-[#F5F5F7]/10 space-y-4 font-mono text-xs">
                  <div className="flex flex-wrap items-center justify-between text-[#9E9EA8]/80 gap-2">
                    <span className="text-white font-bold">
                      BY {featuredArticle.authorName.toUpperCase()}
                    </span>
                    <span>{formatDate(featuredArticle.published_at)}</span>
                    <span>{featuredArticle.readTime} MIN READ</span>
                  </div>

                  <Link
                    href={`/news/${featuredArticle.slug}`}
                    className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-lg bg-[#0B0B0F] border border-[#FF8A3D]/30 hover:bg-[#FF8A3D] hover:text-black text-[#FF8A3D] font-black uppercase tracking-widest text-xs transition-all duration-200 group-hover:border-[#FF8A3D]"
                  >
                    READ FULL STORY <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </article>
          </section>
        )}

        {/* 5. LATEST INTELLIGENCE & 8. TRENDING PICKS LAYOUT */}
        <div id="latest-intelligence" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Main Grid Column */}
          <section className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#F5F5F7]/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF2D8D] font-mono block">
                  WHAT&apos;S HAPPENING AROUND GTA VI
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white font-display">
                  LATEST INTELLIGENCE
                </h2>
              </div>
            </div>

            {gridArticles && gridArticles.length > 0 ? (
              <div id="all-stories" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gridArticles.map((art) => (
                  <article
                    key={art.id}
                    className="group flex flex-col justify-between bg-[#16161B] border border-[#F5F5F7]/10 rounded-xl overflow-hidden hover:border-[#FF2D8D]/40 hover:shadow-xl transition-all duration-300"
                  >
                    <div>
                      {/* Image Container */}
                      <div className="relative w-full aspect-video overflow-hidden bg-[#0B0B0F]">
                        <Image
                          src={getImageUrl(art.featured_image)}
                          alt={art.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          sizes="(max-w-768px) 100vw, 40vw"
                        />
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                          {art.categoryData && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-[#0B0B0F]/90 text-white border border-[#F5F5F7]/20 backdrop-blur-md font-mono">
                              {art.categoryData.name}
                            </span>
                          )}
                          {renderStatusBadge(art.rumor_status)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <h3 className="text-lg font-bold text-white group-hover:text-[#FF2D8D] transition-colors leading-snug line-clamp-2">
                          <Link href={`/news/${art.slug}`}>{art.title}</Link>
                        </h3>
                        <p className="text-xs text-[#9E9EA8] leading-relaxed line-clamp-3">
                          {art.excerpt}
                        </p>
                      </div>
                    </div>

                    {/* Footer Metadata */}
                    <div className="p-5 pt-0 mt-2 border-t border-[#F5F5F7]/5 flex items-center justify-between text-[11px] font-mono text-[#9E9EA8]/70">
                      <span>{formatDate(art.published_at)}</span>
                      <Link
                        href={`/news/${art.slug}`}
                        className="text-[#FF2D8D] font-bold uppercase tracking-wider hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                      >
                        READ <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : !featuredArticle ? (
              /* 19. CINEMATIC EMPTY STATE */
              <div className="p-12 text-center bg-[#16161B] rounded-2xl border border-[#F5F5F7]/10 space-y-4 font-mono">
                <Radio className="w-12 h-12 text-[#FF2D8D]/40 mx-auto animate-pulse" />
                <h3 className="text-2xl font-black uppercase text-white font-display">
                  LEONIDA IS QUIET... FOR NOW.
                </h3>
                <p className="text-xs text-[#9E9EA8] max-w-md mx-auto leading-relaxed">
                  No stories are available matching your query. Check back soon for the latest GTA VI intelligence.
                </p>
                <div>
                  <Link
                    href="/news"
                    className="inline-block px-5 py-2.5 rounded-lg bg-[#FF2D8D] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#FF2D8D]/90 transition-colors"
                  >
                    CLEAR FILTERS
                  </Link>
                </div>
              </div>
            ) : null}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-8 border-t border-[#F5F5F7]/10 font-mono">
                {Array.from({ length: totalPages }, (_, i) => {
                  const pageNum = i + 1
                  const isCurrent = currentPage === pageNum
                  return (
                    <Link
                      key={pageNum}
                      href={buildFilterUrl({ page: pageNum })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs transition-all duration-200 border ${
                        isCurrent
                          ? "bg-[#FF2D8D] border-[#FF2D8D] text-white shadow-lg shadow-[#FF2D8D]/20"
                          : "bg-[#16161B] border-[#F5F5F7]/10 text-[#9E9EA8] hover:border-[#FF2D8D]/50 hover:text-white"
                      }`}
                    >
                      {pageNum}
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          {/* Sidebar Column: 8. LATEST PICKS / TRENDING MODULE */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-[#16161B] border border-[#F5F5F7]/10 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[#F5F5F7]/10 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FF8A3D] font-mono block">
                    EDITORIAL SELECTION
                  </span>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white font-display flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#FF8A3D]" /> LATEST PICKS
                  </h3>
                </div>
              </div>

              <div className="space-y-4">
                {latestPicks.map((pick, idx) => {
                  const numStr = String(idx + 1).padStart(2, "0")
                  return (
                    <Link
                      key={pick.id}
                      href={`/news/${pick.slug}`}
                      className="group flex gap-4 items-start p-2 rounded-xl hover:bg-[#0B0B0F]/60 transition-all duration-200 border border-transparent hover:border-[#F5F5F7]/10"
                    >
                      <span className="text-xl font-black font-mono text-[#FF8A3D]/40 group-hover:text-[#FF8A3D] transition-colors flex-shrink-0 w-6">
                        {numStr}
                      </span>
                      <div className="space-y-1 flex-grow min-w-0">
                        {pick.categoryData && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#FF2D8D] font-mono block">
                            {pick.categoryData.name}
                          </span>
                        )}
                        <h4 className="font-bold text-xs text-white group-hover:text-[#FF8A3D] transition-colors line-clamp-2 leading-snug">
                          {pick.title}
                        </h4>
                        <span className="text-[10px] font-mono text-[#9E9EA8]/60 block pt-0.5">
                          {formatDate(pick.published_at)}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Quick Links / Navigation Widget */}
            <div className="bg-[#16161B] border border-[#F5F5F7]/10 rounded-2xl p-6 space-y-4 font-mono text-xs">
              <h4 className="text-xs font-black uppercase text-[#9E9EA8] tracking-widest border-b border-[#F5F5F7]/10 pb-2">
                DESK RESOURCES
              </h4>
              <ul className="space-y-2 text-[#9E9EA8]">
                <li>
                  <Link href="/map" className="hover:text-white transition-colors flex items-center justify-between">
                    <span>Interactive Leonida Map</span>
                    <ArrowRight className="w-3 h-3 text-[#FF8A3D]" />
                  </Link>
                </li>
                <li>
                  <Link href="/characters" className="hover:text-white transition-colors flex items-center justify-between">
                    <span>Character Intelligence Dossiers</span>
                    <ArrowRight className="w-3 h-3 text-[#FF8A3D]" />
                  </Link>
                </li>
                <li>
                  <Link href="/trailers" className="hover:text-white transition-colors flex items-center justify-between">
                    <span>Trailer Breakdown Hub</span>
                    <ArrowRight className="w-3 h-3 text-[#FF8A3D]" />
                  </Link>
                </li>
                <li>
                  <Link href="/investigate" className="hover:text-white transition-colors flex items-center justify-between">
                    <span>AI Investigator Portal</span>
                    <ArrowRight className="w-3 h-3 text-[#FF8A3D]" />
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
