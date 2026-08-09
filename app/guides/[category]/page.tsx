import React from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Calendar, Award, ArrowLeft, Clock } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export const revalidate = 0 // dynamically server-render

interface CategoryPageProps {
  params: {
    category: string
  }
}

export async function generateMetadata({ params }: CategoryPageProps) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: category } = await supabase
      .from("categories")
      .select("name, description")
      .eq("slug", params.category)
      .single()

    if (!category) return {}

    return {
      title: `${category.name} Guides Walkthroughs`,
      description: category.description || `Exhaustive list of expert-level ${category.name} gameplay guides and interactive walkthroughs.`,
    }
  } catch (_) {
    return {}
  }
}

export default async function CategoryGuidesPage({ params }: CategoryPageProps) {
  const supabase = createSupabaseServerClient()

  let category: any = null
  let guides: any[] = []

  try {
    // 1. Fetch category
    const { data: catData } = await supabase
      .from("categories")
      .select("id, name, slug, description")
      .eq("slug", params.category)
      .maybeSingle()

    if (!catData) {
      return notFound()
    }

    category = catData

    // 2. Fetch guides in category
    const { data: guidesData } = await supabase
      .from("guides")
      .select(`
        id, title, slug, featured_image, published_at, difficulty, word_count
      `)
      .eq("category", category.id)
      .eq("status", "published")
      .order("published_at", { ascending: false })

    guides = guidesData || []
  } catch (err) {
    console.error("Error loading category guides:", err)
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-10">

      {/* BACK ACTION */}
      <div>
        <Link
          href="/guides"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground/50 hover:text-neon-blue uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> All Categories
        </Link>
      </div>

      {/* HEADER */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-black tracking-widest text-neon-blue uppercase bg-neon-blue/10 px-3 py-1 rounded-full">
          Category: {category.name}
        </span>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
          {category.name} <span className="bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">Walkthroughs</span>
        </h1>
        <p className="text-foreground/60 text-sm leading-relaxed">
          {category.description || "Browse our catalog of professional-grade GTA 6 game systems guides."}
        </p>
      </div>

      {/* GUIDES GRID */}
      {guides.length === 0 ? (
        <div className="border border-dashed border-card-border p-16 text-center rounded-lg bg-card-bg/50">
          <p className="text-foreground/40 text-lg mb-2 font-bold">No walkthroughs available under {category.name}.</p>
          <p className="text-xs text-foreground/50">Our gaming writers are working on it. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {guides.map((guide) => (
            <div
              key={guide.id}
              className="group bg-card-bg border border-card-border hover:border-neon-blue/30 rounded-lg overflow-hidden transition-all duration-300 flex flex-col"
            >
              <div className="relative h-44 w-full bg-brand-dark">
                <Image
                  src={guide.featured_image || "/placeholder-card.jpg"}
                  alt={guide.title}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {guide.difficulty && (
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider ${
                      guide.difficulty === "easy" ? "bg-emerald-500 text-white" :
                      guide.difficulty === "medium" ? "bg-amber-500 text-white" :
                      guide.difficulty === "hard" ? "bg-rose-500 text-white" :
                      "bg-rose-600 text-white"
                    }`}>
                      {guide.difficulty}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <Link href={`/guides/${category.slug}/${guide.slug}`}>
                    <h3 className="text-base font-bold text-white hover:text-neon-blue transition-colors line-clamp-2">
                      {guide.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-foreground/55">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {guide.word_count ? `${Math.max(1, Math.ceil(guide.word_count / 200))} min` : "1 min"}
                    </span>
                    <span>•</span>
                    <span>{guide.word_count || 0} words</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-card-border flex items-center justify-between text-xs font-bold text-foreground/50">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-neon-blue" />
                    {formatDate(guide.published_at)}
                  </span>
                  <Link
                    href={`/guides/${category.slug}/${guide.slug}`}
                    className="text-neon-blue hover:underline flex items-center gap-1"
                  >
                    Read Walkthrough &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
