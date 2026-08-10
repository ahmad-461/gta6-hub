import React from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Folder, Calendar, BookOpen, FileText } from "lucide-react"

interface CategoryPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const supabase = createSupabaseServerClient()
  const { data: category } = await supabase
    .from("categories")
    .select("name, description")
    .eq("slug", params.slug)
    .maybeSingle()

  if (!category) {
    return {
      title: "Category Not Found | GTA VI Hub",
    }
  }

  return {
    title: `Category: ${category.name} | GTA VI Hub`,
    description: category.description || `Browse articles and walkthrough guides under ${category.name}.`,
  }
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

export default async function CategoryArchivePage({ params }: CategoryPageProps) {
  const supabase = createSupabaseServerClient()

  // 1. Fetch category details
  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .eq("slug", params.slug)
    .maybeSingle()

  if (!category) {
    notFound()
  }

  // 2. Fetch published articles under this category
  const { data: articles } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, featured_image, published_at")
    .eq("category", category.id)
    .eq("status", "published")

  // 3. Fetch published guides under this category
  const { data: guides } = await supabase
    .from("guides")
    .select("id, title, slug, guide_category, difficulty, featured_image, published_at")
    .eq("category", category.id)
    .eq("status", "published")

  // 4. Combine and sort by date
  const combined = [
    ...(articles || []).map((art) => ({
      ...art,
      type: "article" as const,
    })),
    ...(guides || []).map((guide) => ({
      ...guide,
      type: "guide" as const,
    })),
  ].sort((a, b) => {
    return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime()
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-8">
      {/* Category Info Header */}
      <div className="space-y-3">
        <span className="text-xs font-black uppercase tracking-widest text-neon-pink bg-neon-pink/10 border border-neon-pink/25 rounded-md px-2.5 py-1 inline-flex items-center gap-1.5">
          <Folder className="w-3.5 h-3.5" /> Category Archive
        </span>
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-foreground/60 max-w-2xl leading-relaxed text-sm sm:text-base">
            {category.description}
          </p>
        )}
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-card-border/60 via-transparent to-transparent" />

      {/* Combined Feed */}
      {combined.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {combined.map((item) => {
            const isArticle = item.type === "article"
            const linkHref = isArticle
              ? `/news/${item.slug}`
              : `/guides/${(item as any).guide_category.toLowerCase().replace(/\s+/g, "-")}/${item.slug}`

            return (
              <article
                key={item.id}
                className={`group flex flex-col justify-between bg-card-bg border rounded-xl overflow-hidden hover:scale-[1.01] transition-all duration-300 shadow-md ${
                  isArticle
                    ? "border-card-border hover:border-neon-pink/40"
                    : "border-card-border hover:border-neon-blue/40"
                }`}
              >
                <div>
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image
                      src={getImageUrl(item.featured_image)}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-w-768px) 100vw, (max-w-1200px) 50vw, 30vw"
                    />
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      {isArticle ? (
                        <span className="text-[10px] font-black uppercase tracking-widest text-neon-pink flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          Article
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-neon-blue flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          Guide ({(item as any).guide_category})
                        </span>
                      )}

                      {!isArticle && (
                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          (item as any).difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400" :
                          (item as any).difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-400" :
                          "bg-rose-500/10 text-rose-400"
                        }`}>
                          {(item as any).difficulty}
                        </span>
                      )}
                    </div>

                    <h2 className={`text-lg sm:text-xl font-extrabold text-white transition-colors line-clamp-2 leading-snug ${
                      isArticle ? "group-hover:text-neon-pink" : "group-hover:text-neon-blue"
                    }`}>
                      <Link href={linkHref}>{item.title}</Link>
                    </h2>

                    {isArticle && (
                      <p className="text-sm text-foreground/70 leading-relaxed line-clamp-3">
                        {(item as any).excerpt}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0 mt-2 border-t border-card-border/30 flex items-center justify-between text-[11px] text-foreground/40 font-semibold">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-foreground/30" />
                    {formatDate(item.published_at)}
                  </span>
                  <Link
                    href={linkHref}
                    className={`font-bold hover:underline uppercase tracking-wider ${
                      isArticle ? "text-neon-pink" : "text-neon-blue"
                    }`}
                  >
                    Read {isArticle ? "Article" : "Guide"} &rarr;
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="border border-dashed border-card-border p-16 text-center rounded-xl bg-card-bg/40">
          <p className="text-foreground/40 text-lg mb-4">No published content found under this category.</p>
          <Link href="/" className="text-neon-pink hover:underline text-sm font-semibold">
            Return Home &rarr;
          </Link>
        </div>
      )}
    </div>
  )
}
