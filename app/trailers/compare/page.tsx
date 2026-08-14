import React from "react"
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { ArrowLeft, Video } from "lucide-react"
import CompareTrailersClient from "./CompareTrailersClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Synchronized Trailer Comparison | GTA VI Hub",
  description: "Compare official GTA VI trailers and breakdowns side-by-side with synchronized dual playback.",
}

export default async function TrailersComparePage() {
  const supabase = createSupabaseServerClient()

  // Fetch all published breakdowns to populate dropdown
  const { data: breakdowns } = await supabase
    .from("trailer_breakdowns")
    .select("id, title, slug, trailer_source_url")
    .eq("status", "published")
    .order("published_at", { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-8 animate-fade-in">
      {/* Header Back Button */}
      <div>
        <Link
          href="/trailers"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-neon-blue hover:text-neon-pink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Breakdowns</span>
        </Link>
      </div>

      {/* Title Details */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-[#FF2D8D]">
          <Video className="w-5 h-5 text-[#FF2D8D] animate-pulse" />
          <span className="text-xs font-black tracking-widest uppercase font-mono">Tactical Split Screen Analyser</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-anton uppercase tracking-tight text-white leading-none">
          Synchronized Trailer Comparison
        </h1>
        <p className="text-[#9E9EA8] max-w-2xl leading-relaxed text-sm sm:text-base">
          Analyze footage side-by-side. Select two official breakdowns or input custom YouTube URLs, and drive both players simultaneously.
        </p>
      </div>

      {/* Main Interactive Client Component */}
      <CompareTrailersClient breakdowns={breakdowns || []} />
    </div>
  )
}
