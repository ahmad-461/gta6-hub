import React from "react"
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Compass, BookOpen, Globe, Zap, EyeOff, Award, ChevronRight } from "lucide-react"

export const metadata = {
  title: "Walkthroughs & Guides | GTA VI Hub",
  description: "Complete walkthroughs, missions, secrets, collectibles search, and multiplayer tips for Grand Theft Auto VI.",
}

const CATEGORIES = [
  {
    name: "Getting Started",
    slug: "getting-started",
    description: "Essential tips, controller setups, and rookie advice to survive the Leonida streets.",
    icon: Compass,
    color: "border-emerald-500/30 text-emerald-400 hover:border-emerald-500/60 hover:bg-emerald-500/5",
  },
  {
    name: "Story",
    slug: "story",
    description: "Full walkthroughs of Lucia and Jason's main heists, side missions, and optional events.",
    icon: BookOpen,
    color: "border-blue-500/30 text-blue-400 hover:border-blue-500/60 hover:bg-blue-500/5",
  },
  {
    name: "Online",
    slug: "online",
    description: "Cooperative jobs guides, multiplayer business setups, rankings, and crew strategies.",
    icon: Globe,
    color: "border-purple-500/30 text-purple-400 hover:border-purple-500/60 hover:bg-purple-500/5",
  },
  {
    name: "Cheats",
    slug: "cheats",
    description: "Detailed input directories and spawn mechanics for PS5, Xbox Series X/S, and PC.",
    icon: Zap,
    color: "border-yellow-500/30 text-yellow-400 hover:border-yellow-500/60 hover:bg-yellow-500/5",
  },
  {
    name: "Secrets",
    slug: "secrets",
    description: "Collectible item locations, unique vehicle spawns, and Easter eggs hidden across Leonida.",
    icon: EyeOff,
    color: "border-rose-500/30 text-rose-400 hover:border-rose-500/60 hover:bg-rose-500/5",
  },
]

export default async function GuidesPage() {
  const supabase = createSupabaseServerClient()

  // Fetch counts of published guides per category
  const { data: guides } = await supabase
    .from("guides")
    .select("guide_category")
    .eq("status", "published")

  const counts = (guides || []).reduce((acc, curr) => {
    const cat = curr.guide_category
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-8">
      {/* Page Header */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white flex items-center gap-2">
          <Award className="w-8 h-8 sm:w-12 sm:h-12 text-neon-blue" />
          Guides & Walkthroughs
        </h1>
        <p className="text-foreground/60 max-w-2xl leading-relaxed text-sm sm:text-base">
          Unlock the full potential of your gameplay. Browse expert-tier narrative guides, complete collectibles pointers, weapon tuning, and online tactics.
        </p>
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-card-border/60 via-transparent to-transparent" />

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const guideCount = counts[cat.name] || 0
          return (
            <Link
              key={cat.slug}
              href={`/guides/${cat.slug}`}
              className={`p-6 rounded-xl bg-card-bg border flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 shadow-md group ${cat.color}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-background/60 rounded-lg">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-background/50 px-2.5 py-1 rounded-md text-foreground/50 border border-card-border/40">
                    {guideCount} {guideCount === 1 ? "Guide" : "Guides"}
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-extrabold text-white group-hover:text-inherit">
                    {cat.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider pt-6 group-hover:translate-x-1.5 transition-transform duration-200">
                <span>Explore Category</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
