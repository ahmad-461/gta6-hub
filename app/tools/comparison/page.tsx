import React from "react"
import Link from "next/link"
import { ArrowLeft, GitCompare, Info } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import ImageComparisonSlider from "@/components/ImageComparisonSlider"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "GTA 5 vs GTA 6 Comparison",
  description: "Detailed side-by-side comparison of features, map size, graphics, platforms, and gameplay between GTA V and GTA VI.",
}

interface ComparisonRow {
  label: string
  gta5: string
  gta6: string
}

const DEFAULT_COMPARISON: ComparisonRow[] = [
  {
    label: "Release Year",
    gta5: "2013 (PS3/Xbox 360), later ported to PS4/PS5/Xbox One/XSX/PC",
    gta6: "2025 (Confirmed for PS5 and Xbox Series X|S)"
  },
  {
    label: "Map Size & Setting",
    gta5: "81 km² — Los Santos & Blaine County (Southern California)",
    gta6: "Estimated 150+ km² — State of Leonida (Vice City & surrounding Florida keys/wetlands)"
  },
  {
    label: "Graphics & Physics Engine",
    gta5: "Rockstar Advanced Game Engine (RAGE 7/8)",
    gta6: "Next-gen RAGE 9 (Upgraded water/mud physics, realistic hair/cloth, volumetric clouds)"
  },
  {
    label: "Protagonists",
    gta5: "3 Male Protagonists (Michael, Franklin, Trevor) with dynamic switching",
    gta6: "2 Protagonists (Lucia & Jason) — Bonnie & Clyde inspired crime duo, first female lead"
  },
  {
    label: "Players in GTA Online",
    gta5: "Up to 30 players per lobby",
    gta6: "Expected next-gen expansion (64+ player lobbies rumored, deeper world persistence)"
  },
  {
    label: "Target Platforms",
    gta5: "Originally PS3 & 360; currently active on PC, PS5, and Xbox Series X|S",
    gta6: "Dedicated to next-gen consoles: PlayStation 5 and Xbox Series X|S at launch"
  },
  {
    label: "NPC & Crowd AI Density",
    gta5: "Standard pathfinding, identical schedules, lower crowd density on streets",
    gta6: "Highly advanced AI, unique daily routines, massive crowd/beach density, reactive wildlife"
  },
  {
    label: "Key Features",
    gta5: "Multi-protagonist heists, stock market, property purchasing, extensive vehicle modding",
    gta6: "Co-op robbery systems, social media simulation network, highly interactive building interiors"
  }
]

async function getComparisonData(): Promise<ComparisonRow[]> {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "gta_comparison")
      .single()

    if (error || !data?.value) {
      return DEFAULT_COMPARISON
    }

    const parsed = JSON.parse(data.value)
    if (Array.isArray(parsed)) {
      return parsed as ComparisonRow[]
    }
    return DEFAULT_COMPARISON
  } catch (err) {
    console.warn("Failed to fetch GTA Comparison settings from Supabase, using defaults.", err)
    return DEFAULT_COMPARISON
  }
}

export default async function ComparisonPage() {
  const comparisonData = await getComparisonData()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow">
      <div className="mb-8">
        <Link
          href="/tools"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-neon-blue hover:text-neon-pink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tools</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <GitCompare className="w-8 h-8 text-neon-pink" />
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              GTA 5 vs GTA 6 Comparison
            </h1>
          </div>
          <p className="text-foreground/60 max-w-2xl">
            See how Grand Theft Auto VI is pushing the boundaries of technology, gameplay, and scale compared to its legendary predecessor.
          </p>
        </div>
        <div className="bg-card-bg/50 border border-card-border p-3.5 rounded-lg flex items-start space-x-2.5 max-w-sm">
          <Info className="w-5 h-5 text-neon-purple shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/70">
            This data is managed dynamically in our admin settings panel and updates in real-time as new leaks and official press releases emerge.
          </p>
        </div>
      </div>

      {/* Interactive Visual Comparison Slider */}
      <div className="mb-12">
        <ImageComparisonSlider />
      </div>

      {/* Comparison Grid/Table */}
      <div className="border border-card-border rounded-xl overflow-hidden bg-card-bg/60 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-neon-pink/10 via-neon-purple/10 to-neon-blue/10 border-b border-card-border text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                <th className="py-4 px-6 w-1/4">Specification</th>
                <th className="py-4 px-6 w-3/8 text-neon-yellow">Grand Theft Auto V (GTA 5)</th>
                <th className="py-4 px-6 w-3/8 text-neon-pink">Grand Theft Auto VI (GTA 6)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border/80 text-sm">
              {comparisonData.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-white/5 transition-colors duration-150"
                >
                  <td className="py-4.5 px-6 font-bold text-white/95 align-top">
                    {row.label}
                  </td>
                  <td className="py-4.5 px-6 text-foreground/80 leading-relaxed align-top">
                    {row.gta5}
                  </td>
                  <td className="py-4.5 px-6 text-foreground/90 font-medium leading-relaxed align-top bg-neon-pink/[0.02]">
                    {row.gta6}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Call to Action */}
      <div className="mt-12 text-center p-8 bg-gradient-to-b from-card-bg/40 to-background border border-card-border rounded-xl">
        <h3 className="text-xl font-extrabold text-white mb-2">Want to keep exploring Leonida?</h3>
        <p className="text-foreground/60 max-w-md mx-auto text-sm mb-6">
          Track upcoming missions, compare cars in your garage, or find interactive cheat codes.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/tools/car-compare"
            className="px-6 py-2.5 rounded-md text-xs font-bold bg-card-bg border border-neon-blue text-neon-blue hover:bg-neon-blue/10 transition-all duration-200"
          >
            Car Comparator
          </Link>
          <Link
            href="/tools/mission-tracker"
            className="px-6 py-2.5 rounded-md text-xs font-bold bg-gradient-to-r from-neon-pink to-neon-purple hover:brightness-110 text-white transition-all duration-200"
          >
            Launch Mission Tracker
          </Link>
        </div>
      </div>
    </div>
  )
}
