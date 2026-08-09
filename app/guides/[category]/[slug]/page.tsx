import React from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Calendar, User, Clock, ArrowLeft, RefreshCw, BarChart2 } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import TableOfContents from "@/components/TableOfContents"

export const revalidate = 0 // dynamically server-render

interface GuidePageProps {
  params: {
    category: string
    slug: string
  }
}

export async function generateMetadata({ params }: GuidePageProps) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: guide } = await supabase
      .from("guides")
      .select("title, content")
      .eq("slug", params.slug)
      .single()

    if (!guide) return {}

    return {
      title: `${guide.title} Walkthrough`,
      description: `Complete step-by-step master-class walkthough: ${guide.title}. Find complete interactive collectibles locations, map planners, and heists tactics.`,
    }
  } catch (_) {
    return {}
  }
}

export default async function GuidePage({ params }: GuidePageProps) {
  const supabase = createSupabaseServerClient()

  let guide: any = null

  try {
    const { data: guideData } = await supabase
      .from("guides")
      .select(`
        id,
        title,
        content,
        featured_image,
        difficulty,
        word_count,
        published_at,
        updated_at,
        toc,
        category ( id, name, slug ),
        profiles:author_id ( name )
      `)
      .eq("slug", params.slug)
      .eq("status", "published")
      .maybeSingle()

    if (!guideData) {
      return notFound()
    }

    guide = guideData
  } catch (err) {
    console.error("Error loading guide details:", err)
    return notFound()
  }

  const wordCount = guide.word_count || (guide.content ? guide.content.split(/\s+/).length : 0)
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const categoryName = guide.category?.name || "General"
  const categorySlug = guide.category?.slug || ""

  // Ensure table of contents is an array
  const rawToc = guide.toc || []
  const tocArray = Array.isArray(rawToc) ? rawToc : []

  return (
    <div className="w-full flex-grow bg-background text-foreground pb-20">

      {/* GUIDE HERO SECTION */}
      <section className="relative overflow-hidden bg-brand-dark border-b border-card-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-6 relative z-10">

          {/* BREADCRUMB */}
          <div className="space-y-3">
            <Link
              href={`/guides/${categorySlug}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground/50 hover:text-neon-blue uppercase tracking-widest transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back To {categoryName}
            </Link>

            <nav className="text-xs font-semibold uppercase tracking-wider text-foreground/40 flex flex-wrap items-center gap-2">
              <Link href="/" className="hover:text-neon-blue">Home</Link>
              <span>&gt;</span>
              <Link href="/guides" className="hover:text-neon-blue">Guides</Link>
              <span>&gt;</span>
              {categorySlug ? (
                <Link href={`/guides/${categorySlug}`} className="hover:text-neon-blue">{categoryName}</Link>
              ) : (
                <span>{categoryName}</span>
              )}
              <span>&gt;</span>
              <span className="text-foreground/60 line-clamp-1">{guide.title}</span>
            </nav>
          </div>

          {/* TITLE & META */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {guide.difficulty && (
                <span className={`text-[10px] font-black px-3 py-1 rounded uppercase tracking-wider border ${
                  guide.difficulty === "easy" ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" :
                  guide.difficulty === "medium" ? "bg-amber-500/10 border-amber-500 text-amber-400" :
                  guide.difficulty === "hard" ? "bg-rose-500/10 border-rose-500 text-rose-400" :
                  "bg-rose-600/10 border-rose-600 text-rose-500"
                }`}>
                  Difficulty: {guide.difficulty}
                </span>
              )}
              <span className="text-[10px] font-black bg-neon-blue/10 border border-neon-blue/30 text-neon-blue px-3 py-1 rounded uppercase tracking-wider">
                {categoryName} Walkthrough
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              {guide.title}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-bold text-foreground/50 pt-3 border-t border-card-border/50">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-neon-blue" />
                BY {guide.profiles?.name || "STAFF WALKTHROUGHS WRITER"}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-neon-blue" />
                PUBLISHED: {formatDate(guide.published_at)}
              </span>
              {guide.updated_at && guide.updated_at !== guide.published_at && (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-neon-blue" />
                  UPDATED: {formatDate(guide.updated_at)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-neon-blue" />
                {readTime} MIN READ
              </span>
              <span className="flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-neon-blue" />
                {wordCount} WORDS
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* BODY GRID: Toc and Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT: TABLE OF CONTENTS (COL SPAN 3) */}
          <div className="lg:col-span-3 hidden lg:block">
            <TableOfContents toc={tocArray} />
          </div>

          {/* RIGHT: FEATURED IMAGE & CONTENT (COL SPAN 9) */}
          <div className="lg:col-span-9 space-y-8">

            {/* FEATURED IMAGE */}
            <div className="relative w-full h-[250px] sm:h-[400px] rounded-lg overflow-hidden border border-card-border">
              <Image
                src={guide.featured_image || "/placeholder-featured.jpg"}
                alt={guide.title}
                fill
                priority
                unoptimized
                className="object-cover"
              />
            </div>

            {/* GUIDE CONTENT */}
            <div
              className="guide-content text-foreground/90 text-base sm:text-lg leading-relaxed space-y-6"
              dangerouslySetInnerHTML={{ __html: guide.content }}
            />

          </div>

        </div>
      </section>

    </div>
  )
}
