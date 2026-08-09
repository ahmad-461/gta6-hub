import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, Tag } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export const revalidate = 0 // dynamically server-render

interface NewsPageProps {
  searchParams: {
    page?: string
    category?: string
  }
}

export async function generateMetadata({ searchParams }: NewsPageProps) {
  const categorySlug = searchParams.category || ""
  let categoryName = ""

  if (categorySlug) {
    try {
      const supabase = createSupabaseServerClient()
      const { data } = await supabase
        .from("categories")
        .select("name")
        .eq("slug", categorySlug)
        .single()
      if (data) {
        categoryName = ` - ${data.name}`
      }
    } catch (_) {}
  }

  return {
    title: `Latest News${categoryName}`,
    description: `Stay updated with Grand Theft Auto VI breaking news, rumors, trailers, leaks, and system announcements.`,
  }
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const supabase = createSupabaseServerClient()
  const activeCategory = searchParams.category || ""
  const currentPage = parseInt(searchParams.page || "1", 10)
  const itemsPerPage = 12

  let articles: any[] = []
  let categories: any[] = []
  let totalArticlesCount = 0

  try {
    // 1. Fetch categories for filters
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("name")

    categories = categoriesData || []

    // 2. Build the query
    let query = supabase
      .from("articles")
      .select(`
        id, title, slug, excerpt, featured_image, published_at, category ( name, slug )
      `, { count: "exact" })
      .eq("status", "published")

    if (activeCategory) {
      const targetCategory = categories.find((c) => c.slug === activeCategory)
      if (targetCategory) {
        query = query.eq("category", targetCategory.id)
      }
    }

    // 3. Apply pagination limits
    const from = (currentPage - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    const { data: articlesData, count } = await query
      .order("published_at", { ascending: false })
      .range(from, to)

    articles = articlesData || []
    totalArticlesCount = count || 0
  } catch (err) {
    console.error("Error loading news page data:", err)
  }

  const totalPages = Math.ceil(totalArticlesCount / itemsPerPage) || 1

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-10">

      {/* HEADER */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
          Latest <span className="bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">News Feed</span>
        </h1>
        <p className="text-foreground/60 text-sm sm:text-base leading-relaxed">
          Stay informed on Leonida rumors, Rockstar news releases, and GTA 6 leaks.
        </p>
      </div>

      {/* CATEGORIES / FILTER SYSTEM */}
      <div className="flex flex-wrap justify-center gap-2 pb-4 border-b border-card-border">
        <Link
          href="/news"
          className={`px-4 py-2 rounded text-xs font-black uppercase tracking-wider transition-all duration-200 ${
            !activeCategory
              ? "bg-neon-pink text-white shadow-lg shadow-neon-pink/20"
              : "bg-card-bg border border-card-border hover:border-neon-pink/40 text-foreground/80 hover:text-white"
          }`}
        >
          All Categories
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/news?category=${cat.slug}`}
            className={`px-4 py-2 rounded text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              activeCategory === cat.slug
                ? "bg-neon-pink text-white shadow-lg shadow-neon-pink/20"
                : "bg-card-bg border border-card-border hover:border-neon-pink/40 text-foreground/80 hover:text-white"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* ARTICLES GRID */}
      {articles.length === 0 ? (
        <div className="border border-dashed border-card-border p-16 text-center rounded-lg bg-card-bg/50">
          <p className="text-foreground/40 text-lg mb-2 font-bold">No articles found.</p>
          <p className="text-xs text-foreground/50">Please adjust your filter or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <div
              key={article.id}
              className="group bg-card-bg border border-card-border hover:border-neon-pink/30 rounded-lg overflow-hidden transition-all duration-300 flex flex-col"
            >
              <div className="relative h-48 w-full bg-brand-dark">
                <Image
                  src={article.featured_image || "/placeholder-card.jpg"}
                  alt={article.title}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {article.category && (
                    <span className="text-[10px] font-bold text-neon-pink tracking-widest uppercase">
                      {article.category.name}
                    </span>
                  )}
                  <Link href={`/news/${article.slug}`}>
                    <h3 className="text-lg font-bold text-white hover:text-neon-pink transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-foreground/60 leading-relaxed line-clamp-3">
                    {article.excerpt}
                  </p>
                </div>
                <div className="pt-4 border-t border-card-border flex items-center justify-between text-xs font-bold text-foreground/50">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-neon-pink" />
                    {formatDate(article.published_at)}
                  </span>
                  <Link href={`/news/${article.slug}`} className="text-neon-pink hover:underline flex items-center gap-1">
                    Read Story &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          {Array.from({ length: totalPages }, (_, i) => {
            const pageNum = i + 1
            const isActive = pageNum === currentPage
            const targetUrl = activeCategory
              ? `/news?category=${activeCategory}&page=${pageNum}`
              : `/news?page=${pageNum}`

            return (
              <Link
                key={pageNum}
                href={targetUrl}
                className={`px-3.5 py-1.5 rounded text-xs font-black border transition-all duration-200 ${
                  isActive
                    ? "bg-neon-pink text-white border-neon-pink shadow-lg shadow-neon-pink/20"
                    : "bg-card-bg text-foreground/70 border-card-border hover:border-neon-pink/30 hover:text-white"
                }`}
              >
                [{pageNum}]
              </Link>
            )
          })}
        </div>
      )}

    </div>
  )
}
