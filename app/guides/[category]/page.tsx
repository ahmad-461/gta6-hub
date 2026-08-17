import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { ArrowLeft, BookOpen } from "lucide-react"
import PageBanner from "@/components/PageBanner"
import CategoryBadge, { getCategoryConfig } from "@/components/ui/CategoryBadge"
import GuideCard from "@/components/GuideCard"
import EmptyState from "@/components/ui/EmptyState"

export const revalidate = 3600

interface CategoryPageProps {
  params: {
    category: string
  }
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const catConfig = getCategoryConfig(params.category)
  if (!catConfig) {
    return {
      title: "Category Not Found | GTA VI Hub",
    }
  }

  return {
    title: `${catConfig.name} Guides | GTA VI Hub`,
    description: `Complete list of Grand Theft Auto VI guides for the ${catConfig.name} category.`,
  }
}

export default async function CategoryGuidesPage({ params }: CategoryPageProps) {
  const catConfig = getCategoryConfig(params.category)
  if (!catConfig) {
    notFound()
  }

  const supabase = createSupabaseServerClient()

  // Fetch all published guides and filter flexibly by category (matching name or slug via getCategoryConfig)
  const { data: allPublishedGuides } = await supabase
    .from("guides")
    .select(`
      id,
      title,
      slug,
      guide_category,
      difficulty,
      excerpt,
      featured_image,
      published_at,
      updated_at
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false })

  const guides = (allPublishedGuides || []).filter((g) => {
    const config = getCategoryConfig(g.guide_category)
    return config && config.slug === catConfig.slug
  })

  const IconComp = catConfig.icon

  return (
    <div className="w-full flex-grow flex flex-col space-y-8 pb-12">
      {/* Mini-Hero Page Banner (Phase 15) */}
      <PageBanner pathname={`/guides/${catConfig.slug}`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#9E9EA8] hover:text-[#FF8A3D] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Guides Directory
          </Link>
        </div>

        {/* Category Header */}
        <div className="flex items-start sm:items-center gap-4 border-b border-[rgba(245,245,247,0.14)] pb-6">
          <div className={`p-4 rounded-xl border ${catConfig.borderClass} ${catConfig.bgClass} ${catConfig.textClass}`}>
            <IconComp className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CategoryBadge category={catConfig.name} size="md" variant="subtle" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-anton uppercase text-[#F5F5F7] tracking-wide">
              {catConfig.name} Guides
            </h1>
            <p className="text-[#9E9EA8] text-xs sm:text-sm max-w-2xl leading-relaxed">
              {catConfig.description}
            </p>
          </div>
        </div>

        {/* Guides Grid or Empty State */}
        {guides && guides.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((guide) => (
              <GuideCard key={guide.id} guide={guide} categorySlug={catConfig.slug} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BookOpen className="w-12 h-12 text-[#FF2D8D]/40 mx-auto" />}
            title={`No ${catConfig.name} Strategy Files Compiled`}
            description="Field intelligence has not cleared this sector's tactical guides yet. Standing by."
            action={
              <Link
                href="/guides"
                className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase text-[#FF8A3D] hover:underline"
              >
                Return to Guides Directory &rarr;
              </Link>
            }
          />
        )}
      </div>
    </div>
  )
}
