import React from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Calendar, Tag, BookOpen, FileText } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export const revalidate = 0 // dynamically server-render

interface CategoryArchivePageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: CategoryArchivePageProps) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: category } = await supabase
      .from("categories")
      .select("name, description")
      .eq("slug", params.slug)
      .single()

    if (!category) return {}

    return {
      title: `Category: ${category.name}`,
      description: category.description || `Browse all articles and guides published in the ${category.name} category.`,
    }
  } catch (_) {
    return {}
  }
}

export default async function CategoryArchivePage({ params }: CategoryArchivePageProps) {
  const supabase = createSupabaseServerClient()

  let category: any = null
  let items: any[] = []

  try {
    // 1. Fetch current category
    const { data: catData } = await supabase
      .from("categories")
      .select("id, name, slug, description")
      .eq("slug", params.slug)
      .maybeSingle()

    if (!catData) {
      return notFound()
    }

    category = catData

    // 2. Fetch both articles and guides belonging to this category
    const [articlesRes, guidesRes] = await Promise.all([
      supabase
        .from("articles")
        .select("id, title, slug, excerpt, featured_image, published_at")
        .eq("category", category.id)
        .eq("status", "published"),
      supabase
        .from("guides")
        .select("id, title, slug, featured_image, published_at, difficulty")
        .eq("category", category.id)
        .eq("status", "published")
    ])

    const articles = (articlesRes.data || []).map((art) => ({
      ...art,
      type: "article" as const,
    }))

    const guides = (guidesRes.data || []).map((gd) => ({
      ...gd,
      type: "guide" as const,
    }))

    // Merge and sort by published_at DESC
    items = [...articles, ...guides].sort((a, b) => {
      const dateA = new Date(a.published_at || 0).getTime()
      const dateB = new Date(b.published_at || 0).getTime()
      return dateB - dateA
    })
  } catch (err) {
    console.error("Error loading category archive data:", err)
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
        <span className="text-xs font-black tracking-widest text-neon-pink uppercase bg-neon-pink/10 px-3 py-1 rounded-full border border-neon-pink/20">
          Category Archive
        </span>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
          {category.name}
        </h1>
        <p className="text-foreground/60 text-sm leading-relaxed">
          {category.description || `Explore all standard news coverages and interactive gameplay walkthroughs under ${category.name}.`}
        </p>
      </div>

      {/* ITEMS FEED */}
      {items.length === 0 ? (
        <div className="border border-dashed border-card-border p-16 text-center rounded-lg bg-card-bg/50 max-w-xl mx-auto">
          <p className="text-foreground/40 text-lg mb-2 font-bold">No matching content found.</p>
          <p className="text-xs text-foreground/50">Check back later as we post standard updates under this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => {
            const isArticle = item.type === "article"
            const href = isArticle
              ? `/news/${item.slug}`
              : `/guides/${category.slug}/${item.slug}`

            return (
              <div
                key={item.id}
                className={`group bg-card-bg border rounded-lg overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                  isArticle
                    ? "border-card-border hover:border-neon-pink/30 hover:shadow-lg hover:shadow-neon-pink/5"
                    : "border-card-border hover:border-neon-blue/30 hover:shadow-lg hover:shadow-neon-blue/5"
                }`}
              >
                <div>
                  {/* Image wrapper */}
                  <div className="relative h-48 w-full bg-brand-dark">
                    <Image
                      src={item.featured_image || "/placeholder-card.jpg"}
                      alt={item.title}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badge for Type */}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      {isArticle ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-neon-pink text-white px-2.5 py-1 rounded">
                          <FileText className="w-3 h-3" /> Article
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-neon-blue text-white px-2.5 py-1 rounded">
                          <BookOpen className="w-3 h-3" /> Guide
                        </span>
                      )}
                    </div>

                    {/* Badge for Difficulty if Guide */}
                    {!isArticle && item.difficulty && (
                      <div className="absolute top-3 right-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                          item.difficulty === "easy" ? "bg-emerald-500 text-white" :
                          item.difficulty === "medium" ? "bg-amber-500 text-white" :
                          "bg-rose-500 text-white"
                        }`}>
                          {item.difficulty}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info details */}
                  <div className="p-6 space-y-3">
                    <Link href={href}>
                      <h3 className={`text-base font-bold text-white transition-colors line-clamp-2 ${
                        isArticle ? "group-hover:text-neon-pink" : "group-hover:text-neon-blue"
                      }`}>
                        {item.title}
                      </h3>
                    </Link>
                    {item.excerpt && (
                      <p className="text-xs text-foreground/60 leading-relaxed line-clamp-3">
                        {item.excerpt}
                      </p>
                    )}
                  </div>
                </div>

                <div className={`p-6 pt-0 flex justify-between items-center text-xs font-bold border-t border-card-border/50 ${
                  isArticle ? "text-neon-pink" : "text-neon-blue"
                }`}>
                  <span className="flex items-center gap-1 text-foreground/50 text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(item.published_at)}
                  </span>
                  <Link href={href} className="hover:underline flex items-center gap-1.5">
                    Explore {isArticle ? "Article" : "Walkthrough"} &rarr;
                  </Link>
                </div>

              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
