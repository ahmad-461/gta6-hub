import React from "react"
import Link from "next/link"
import Image from "next/image"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Folder, Calendar } from "lucide-react"

export const metadata = {
  title: "News & Leaks | GTA VI Hub",
  description: "Stay updated with standard breaking news, leaks, rumors, and announcements of Grand Theft Auto VI.",
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ""
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return dateStr || ""
  }
}

function getImageUrl(url?: string | null) {
  if (!url) return "/og-image.jpg"
  return url
}

interface NewsPageProps {
  searchParams: {
    page?: string
    category?: string
  }
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const currentPage = Number(searchParams.page) || 1
  const categorySlug = searchParams.category || ""
  const limit = 12
  const from = (currentPage - 1) * limit
  const to = from + limit - 1

  const supabase = createSupabaseServerClient()

  // 1. Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name")

  // 2. Fetch specific category ID if filtering
  let categoryId = null
  let selectedCategoryName = ""
  if (categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id, name")
      .eq("slug", categorySlug)
      .maybeSingle()
    if (cat) {
      categoryId = cat.id
      selectedCategoryName = cat.name
    }
  }

  // 3. Query articles
  let query = supabase
    .from("articles")
    .select(`
      id,
      title,
      slug,
      excerpt,
      featured_image,
      published_at,
      category:categories(id, name, slug)
    `, { count: "exact" })
    .eq("status", "published")

  if (categorySlug && categoryId) {
    query = query.eq("category", categoryId)
  }

  const { data: articles, count } = await query
    .order("published_at", { ascending: false })
    .range(from, to)

  const totalItems = count || 0
  const totalPages = Math.ceil(totalItems / limit) || 1

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-8">
      {/* Page Header */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
          News Feed
        </h1>
        <p className="text-foreground/60 max-w-2xl leading-relaxed text-sm sm:text-base">
          All standard announcements, community updates, rumors, leaks, and trailer analyses of Grand Theft Auto VI, fetched dynamically from Leonida.
        </p>
      </div>

      {/* Category Filter Pills */}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-4 border-b border-card-border/60">
          <Link
            href="/news"
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-200 ${
              !categorySlug
                ? "bg-neon-pink text-white border-neon-pink"
                : "bg-card-bg text-foreground/75 border-card-border hover:border-neon-pink/50 hover:text-white"
            }`}
          >
            All Categories
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/news?category=${cat.slug}`}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-200 ${
                categorySlug === cat.slug
                  ? "bg-neon-pink text-white border-neon-pink"
                  : "bg-card-bg text-foreground/75 border-card-border hover:border-neon-pink/50 hover:text-white"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {selectedCategoryName && (
        <div className="text-xs text-foreground/50 font-semibold uppercase tracking-wider">
          Showing articles in <span className="text-neon-pink font-bold">{selectedCategoryName}</span>
        </div>
      )}

      {/* Articles Feed */}
      {articles && articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => (
            <article
              key={art.id}
              className="group flex flex-col justify-between bg-card-bg border border-card-border rounded-xl overflow-hidden hover:border-neon-pink/45 transition-all duration-300 shadow-md"
            >
              <div>
                <div className="relative w-full h-48 overflow-hidden">
                  <Image
                    src={getImageUrl(art.featured_image)}
                    alt={art.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-w-768px) 100vw, (max-w-1200px) 50vw, 30vw"
                  />
                </div>
                <div className="p-5 space-y-3">
                  {art.category && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neon-blue flex items-center gap-1">
                      <Folder className="w-3 h-3" />
                      {(art.category as any).name}
                    </span>
                  )}
                  <h2 className="text-lg sm:text-xl font-extrabold text-white group-hover:text-neon-pink transition-colors line-clamp-2 leading-snug">
                    <Link href={`/news/${art.slug}`}>{art.title}</Link>
                  </h2>
                  <p className="text-sm text-foreground/70 leading-relaxed line-clamp-3">
                    {art.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 mt-2 border-t border-card-border/30 flex items-center justify-between text-[11px] text-foreground/40 font-semibold">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-foreground/30" />
                  {formatDate(art.published_at)}
                </span>
                <Link
                  href={`/news/${art.slug}`}
                  className="text-neon-pink font-bold hover:underline uppercase tracking-wider"
                >
                  Read More &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-card-border p-16 text-center rounded-xl bg-card-bg/40">
          <p className="text-foreground/40 text-lg mb-4">No articles found in this section.</p>
          <Link href="/news" className="text-neon-pink hover:underline text-sm font-semibold">
            Clear Filters &rarr;
          </Link>
        </div>
      )}

      {/* Numbered Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-8 border-t border-card-border/40">
          {Array.from({ length: totalPages }, (_, i) => {
            const pageNum = i + 1
            const categoryParam = categorySlug ? `&category=${categorySlug}` : ""
            return (
              <Link
                key={pageNum}
                href={`/news?page=${pageNum}${categoryParam}`}
                className={`w-9 h-9 rounded-md flex items-center justify-center font-bold text-xs transition-all duration-200 border ${
                  currentPage === pageNum
                    ? "bg-neon-pink border-neon-pink text-white"
                    : "bg-card-bg border-card-border text-foreground hover:border-neon-pink hover:text-white"
                }`}
              >
                {pageNum}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
