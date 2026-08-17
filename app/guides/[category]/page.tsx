import React from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Calendar, ArrowLeft, Award } from "lucide-react"
import EmptyState from "@/components/ui/EmptyState"
import GuideCategoryBadge, { getCategoryConfig } from "@/components/GuideCategoryBadge"

export const revalidate = 3600

interface CategoryPageProps {
  params: {
    category: string
  }
}

function getCategoryMeta(slug: string) {
  const config = getCategoryConfig(slug)
  if (config.color === "gray") return null

  const colorStyles: Record<string, string> = {
    green: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    cyan: "text-cyan border-cyan/20 bg-cyan/5",
    violet: "text-purple-400 border-purple-500/20 bg-purple-500/5",
    yellow: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    magenta: "text-magenta border-magenta/20 bg-magenta/5",
  }

  return {
    name: config.name,
    icon: config.icon,
    color: colorStyles[config.color] || "text-foreground/80 border-card-border bg-card-bg",
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

export async function generateMetadata({ params }: CategoryPageProps) {
  const meta = getCategoryMeta(params.category)
  if (!meta) {
    return {
      title: "Guides Category Not Found | GTA VI Hub",
    }
  }

  return {
    title: `${meta.name} Guides | GTA VI Hub`,
    description: `Complete list of Grand Theft Auto VI guides for the ${meta.name} category.`,
  }
}

export default async function CategoryGuidesPage({ params }: CategoryPageProps) {
  const meta = getCategoryMeta(params.category)
  if (!meta) {
    notFound()
  }

  const supabase = createSupabaseServerClient()

  // Fetch guides in this category where status = 'published'
  const { data: guides } = await supabase
    .from("guides")
    .select(`
      id,
      title,
      slug,
      difficulty,
      featured_image,
      published_at,
      updated_at
    `)
    .eq("guide_category", meta.name)
    .eq("status", "published")
    .order("published_at", { ascending: false })

  const Icon = meta.icon

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-8">
      {/* Back Button */}
      <div>
        <Link
          href="/guides"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground/45 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Categories
        </Link>
      </div>

      {/* Category Info Header */}
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-xl border ${meta.color}`}>
          <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-4xl font-black uppercase text-white">
            {meta.name} Guides
          </h1>
          <p className="text-foreground/50 text-xs sm:text-sm">
            Expert-tier knowledge base and walkthrough articles.
          </p>
        </div>
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-card-border/60 via-transparent to-transparent" />

      {/* Guides List */}
      {guides && guides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <article
              key={guide.id}
              className="group flex flex-col justify-between bg-card-bg border border-card-border rounded-xl overflow-hidden hover:border-neon-blue/40 transition-all duration-300 shadow-md"
            >
              <div>
                <div className="relative w-full h-48 overflow-hidden">
                  <Image
                    src={getImageUrl(guide.featured_image)}
                    alt={guide.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-w-768px) 100vw, (max-w-1200px) 50vw, 30vw"
                  />
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-bold font-mono uppercase tracking-wider">
                    <GuideCategoryBadge category={meta.name} />
                    <span className={`px-2 py-0.5 rounded ${
                      guide.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      guide.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}>
                      {guide.difficulty}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white group-hover:text-neon-blue transition-colors line-clamp-2 leading-snug">
                    <Link href={`/guides/${params.category}/${guide.slug}`}>{guide.title}</Link>
                  </h2>
                </div>
              </div>

              <div className="p-5 pt-0 mt-2 border-t border-card-border/30 flex items-center justify-between text-[11px] text-foreground/40 font-semibold">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-foreground/30" />
                  Last Verified: {formatDate(guide.updated_at || guide.published_at)}
                </span>
                <Link
                  href={`/guides/${params.category}/${guide.slug}`}
                  className="text-neon-blue font-bold hover:underline uppercase tracking-wider"
                >
                  Read Guide &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Award className="w-12 h-12 text-neon-blue/30 mx-auto" />}
          title="No strategy files compiled"
          description="Field intelligence has not cleared this sector's tactical guides yet. Standing by."
          action={
            <Link href="/guides" className="text-neon-blue hover:underline text-xs font-bold font-mono uppercase tracking-wider">
              Return to Categories &rarr;
            </Link>
          }
        />
      )}
    </div>
  )
}
