import React from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Calendar, Tag, FileText, Info } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export const revalidate = 0 // dynamically server-render

interface TagArchivePageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: TagArchivePageProps) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: tag } = await supabase
      .from("tags")
      .select("name")
      .eq("slug", params.slug)
      .single()

    if (!tag) return {}

    return {
      title: `Tag: ${tag.name}`,
      description: `Browse all articles tagged with ${tag.name} on GTA VI Hub.`,
    }
  } catch (_) {
    return {}
  }
}

export default async function TagArchivePage({ params }: TagArchivePageProps) {
  const supabase = createSupabaseServerClient()

  let tag: any = null
  let articles: any[] = []

  try {
    // 1. Fetch current tag
    const { data: tagData } = await supabase
      .from("tags")
      .select("id, name, slug")
      .eq("slug", params.slug)
      .maybeSingle()

    if (!tagData) {
      return notFound()
    }

    tag = tagData

    // 2. Fetch articles tagged with this tag
    const { data: tagArticlesData } = await supabase
      .from("article_tags")
      .select(`
        articles (
          id, title, slug, excerpt, featured_image, published_at, category ( name, slug )
        )
      `)
      .eq("tag_id", tag.id)

    if (tagArticlesData) {
      // Extract articles, filter for status = 'published', and sort by published_at DESC
      articles = tagArticlesData
        .map((item: any) => item.articles)
        .filter(Boolean)
        .sort((a: any, b: any) => {
          const dateA = new Date(a.published_at || 0).getTime()
          const dateB = new Date(b.published_at || 0).getTime()
          return dateB - dateA
        })
    }
  } catch (err) {
    console.error("Error loading tag archive data:", err)
    return notFound()
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-grow space-y-12">

      {/* HEADER */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-black tracking-widest text-neon-pink uppercase bg-neon-pink/10 px-3 py-1 rounded-full border border-neon-pink/20 flex items-center gap-1.5 w-fit mx-auto">
          <Tag className="w-3.5 h-3.5" /> Tag Archive
        </span>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
          Tag: #{tag.name}
        </h1>

        {/* CLEARLY LABEL EXCLUSIONS */}
        <div className="inline-flex items-center gap-2 bg-brand-dark border border-card-border px-4 py-2 rounded-lg text-[11px] font-black uppercase text-foreground/50 tracking-wider">
          <Info className="w-4 h-4 text-neon-pink animate-pulse" />
          <span>Articles only — Walkthrough guides are excluded from Tag results</span>
        </div>
      </div>

      {/* ARTICLES GRID */}
      {articles.length === 0 ? (
        <div className="border border-dashed border-card-border p-16 text-center rounded-lg bg-card-bg/50 max-w-xl mx-auto">
          <p className="text-foreground/40 text-lg mb-2 font-bold">No tagged articles found.</p>
          <p className="text-xs text-foreground/50">Check back later as we post standard updates under #{tag.name}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <div
              key={article.id}
              className="group bg-card-bg border border-card-border hover:border-neon-pink/30 rounded-lg overflow-hidden transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 w-full bg-brand-dark">
                  <Image
                    src={article.featured_image || "/placeholder-card.jpg"}
                    alt={article.title}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-neon-pink text-white px-2.5 py-1 rounded">
                      <FileText className="w-3 h-3" /> Article
                    </span>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {article.category && (
                    <span className="text-[10px] font-bold text-neon-pink tracking-widest uppercase">
                      {article.category.name}
                    </span>
                  )}
                  <Link href={`/news/${article.slug}`}>
                    <h3 className="text-base font-bold text-white hover:text-neon-pink transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                  </Link>
                  {article.excerpt && (
                    <p className="text-xs text-foreground/60 leading-relaxed line-clamp-3">
                      {article.excerpt}
                    </p>
                  )}
                </div>
              </div>
              <div className="p-6 pt-0 flex justify-between items-center text-xs font-bold text-neon-pink border-t border-card-border/50">
                <span className="flex items-center gap-1 text-foreground/50 text-[11px]">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(article.published_at)}
                </span>
                <Link href={`/news/${article.slug}`} className="hover:underline flex items-center gap-1.5">
                  Explore Article &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
