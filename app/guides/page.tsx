import React from "react"
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { ChevronRight } from "lucide-react"
import PageBanner from "@/components/PageBanner"
import CategoryBadge, { CATEGORY_CONFIGS, getCategoryConfig } from "@/components/ui/CategoryBadge"
import GuideCard from "@/components/GuideCard"
import Card from "@/components/ui/Card"

export const revalidate = 3600

export const metadata = {
  title: "Walkthroughs & Guides | GTA VI Hub",
  description: "Complete walkthroughs, missions, secrets, collectibles search, and multiplayer tips for Grand Theft Auto VI.",
}

export default async function GuidesHubPage() {
  const supabase = createSupabaseServerClient()

  // Fetch all published guides
  const { data: guides } = await supabase
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

  const allGuides = guides || []

  // Count published guides per category using normalized getCategoryConfig
  const counts = allGuides.reduce((acc, curr) => {
    const cfg = getCategoryConfig(curr.guide_category)
    if (cfg) {
      acc[cfg.name] = (acc[cfg.name] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const categoryList = Object.values(CATEGORY_CONFIGS)

  return (
    <div className="w-full flex-grow flex flex-col space-y-8 pb-12">
      {/* Mini-Hero Page Banner (Phase 15) */}
      <PageBanner pathname="/guides" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-10">
        {/* Section Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF8A3D] animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#FF8A3D]">
              Knowledge Base Directory
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-anton uppercase text-[#F5F5F7] tracking-wide">
            Expert Guides & Walkthroughs
          </h1>
          <p className="text-[#9E9EA8] max-w-3xl leading-relaxed text-sm sm:text-base">
            Master every square mile of Leonida. Browse our complete tactical intelligence archive, heist walkthroughs, secret location maps, and competitive online setups.
          </p>
        </div>

        {/* Category Overview Cards Grid */}
        <div className="space-y-4">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#9E9EA8]">
            Browse By Category
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categoryList.map((catConfig) => {
              const guideCount = counts[catConfig.name] || 0
              const IconComp = catConfig.icon
              return (
                <Link key={catConfig.slug} href={`/guides/${catConfig.slug}`}>
                  <Card
                    padding="sm"
                    variant="standard"
                    interactive
                    className="h-full flex flex-col justify-between hover:border-[#FF8A3D] group transition-all duration-300"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-2.5 rounded-lg ${catConfig.bgClass} ${catConfig.textClass}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#0B0B0F] px-2 py-0.5 rounded text-[#9E9EA8] border border-[rgba(245,245,247,0.14)]">
                          {guideCount} {guideCount === 1 ? "Guide" : "Guides"}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base font-anton uppercase text-[#F5F5F7] group-hover:text-[#FF8A3D] transition-colors">
                          {catConfig.name}
                        </h3>
                        <p className="text-xs text-[#9E9EA8] line-clamp-2 mt-1 leading-relaxed">
                          {catConfig.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-[#FF8A3D] pt-4 group-hover:translate-x-1 transition-transform">
                      <span>Explore</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="w-full h-[1px] bg-gradient-to-r from-[rgba(245,245,247,0.14)] via-transparent to-transparent" />

        {/* All Published Guides Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-anton uppercase text-[#F5F5F7]">
              All Strategy Intelligence ({allGuides.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allGuides.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
