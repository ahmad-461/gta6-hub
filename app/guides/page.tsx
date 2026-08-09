import React from "react"
import Link from "next/link"
import { BookOpen, ShieldAlert, Award, Layers } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export const revalidate = 0 // dynamically server-render

export const metadata = {
  title: "Walkthroughs & Guides",
  description: "Exhaustive Grand Theft Auto VI guides, collectibles pointer, heists strategies, and expert walkthroughs.",
}

export default async function GuidesLandingPage() {
  const supabase = createSupabaseServerClient()

  let categoriesWithCounts: Array<{
    id: string
    name: string
    slug: string
    description: string
    count: number
  }> = []

  try {
    const [
      { data: categoriesData },
      { data: guidesData }
    ] = await Promise.all([
      supabase.from("categories").select("id, name, slug, description"),
      supabase.from("guides").select("category").eq("status", "published")
    ])

    const categories = categoriesData || []
    const guides = guidesData || []

    // Calculate count per category
    categoriesWithCounts = categories.map((cat) => {
      const count = guides.filter((g) => g.category === cat.id).length
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || "Expert walkthroughs and gameplay optimization tactics.",
        count,
      }
    })

    // Sort by count, then by name
    categoriesWithCounts.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  } catch (err) {
    console.error("Error loading guides landing page data:", err)
  }

  // Choose icons dynamically based on category names
  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes("heist") || lower.includes("mission")) return Award
    if (lower.includes("collect") || lower.includes("map")) return Layers
    if (lower.includes("cheat") || lower.includes("weapon")) return ShieldAlert
    return BookOpen
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-grow space-y-12">

      {/* HEADER */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
          Walkthroughs <span className="bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">and Guides</span>
        </h1>
        <p className="text-foreground/60 text-sm sm:text-base leading-relaxed">
          Master every single activity, collectibles search, and high-stakes heist in Vice City.
        </p>
      </div>

      {/* CATEGORIES GRID */}
      {categoriesWithCounts.length === 0 ? (
        <div className="border border-dashed border-card-border p-16 text-center rounded-lg bg-card-bg/50">
          <p className="text-foreground/40 text-lg mb-2 font-bold">No guide categories available.</p>
          <Link href="/" className="text-neon-blue hover:underline text-sm font-semibold">
            Return Home &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categoriesWithCounts.map((cat) => {
            const Icon = getCategoryIcon(cat.name)
            return (
              <Link
                key={cat.id}
                href={`/guides/${cat.slug}`}
                className="group p-8 rounded-lg bg-card-bg border border-card-border hover:border-neon-blue/30 hover:shadow-lg hover:shadow-neon-blue/5 transition-all duration-300 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-neon-blue/10 rounded-lg text-neon-blue group-hover:bg-neon-blue group-hover:text-white transition-all duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] bg-card-border px-2 py-1 rounded font-black tracking-wider uppercase text-foreground/50 group-hover:text-neon-blue transition-colors">
                      {cat.count} {cat.count === 1 ? "Guide" : "Guides"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-neon-blue transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed line-clamp-3">
                      {cat.description}
                    </p>
                  </div>
                </div>
                <div className="text-xs font-semibold text-neon-blue flex items-center space-x-1 pt-4 border-t border-card-border/50">
                  <span>Browse Guides</span>
                  <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

    </div>
  )
}
