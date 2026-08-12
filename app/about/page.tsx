import React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { ArrowRight, Github, Linkedin, Shield } from "lucide-react"
import SiteDepthIndex from "@/components/SiteDepthIndex"

export const metadata: Metadata = {
  title: "About the Intelligence Hub",
  description: "Learn more about the mission, data architecture, and creators behind GTA 6 Hub.",
}

export default async function AboutPage() {
  const isDummy = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy-supabase-url.supabase.co")

  let newsCount: number | null = null
  let guidesCount: number | null = null
  let loreCount: number | null = null

  if (!isDummy) {
    try {
      const supabase = createSupabaseServerClient()

      try {
        const { count: artCount } = await supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("status", "published")
        newsCount = artCount
      } catch (e) {
        console.error("Error counting articles on about page:", e)
      }

      try {
        const { count: gdCount } = await supabase
          .from("guides")
          .select("id", { count: "exact", head: true })
          .eq("status", "published")
        guidesCount = gdCount
      } catch (e) {
        console.error("Error counting guides on about page:", e)
      }

      try {
        const { count: charCount } = await supabase
          .from("characters")
          .select("id", { count: "exact", head: true })
          .eq("status", "published")
        const { count: topicCount } = await supabase
          .from("lore_topics")
          .select("id", { count: "exact", head: true })
        loreCount = (charCount || 0) + (topicCount || 0)
      } catch (e) {
        console.error("Error counting lore characters/topics on about page:", e)
      }
    } catch (err) {
      console.error("Failed to query Supabase server side inside about page:", err)
    }
  }

  return (
    <div className="flex-grow flex flex-col relative bg-[#0B0710] overflow-hidden text-[#F5F0FA]">
      {/* Cinematic Global Noise Texture */}
      <div className="film-grain opacity-5 pointer-events-none" />

      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Glow Blob 1 (magenta left) */}
        <div className="absolute top-[20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-[#FF2E88]/5 blur-[140px] z-0" />
        {/* Glow Blob 2 (cyan right) */}
        <div className="absolute bottom-[20%] right-[-15%] w-[600px] h-[600px] rounded-full bg-[#00E5FF]/5 blur-[140px] z-0" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 space-y-20">
        {/* Section 1: Strong Opening Statement */}
        <section className="space-y-6 max-w-4xl text-left pt-8">
          <div className="flex items-center space-x-3 font-mono text-xs text-[#FF2E88] tracking-widest uppercase font-bold">
            <span>SITE MISSION</span>
            <span className="h-[1px] w-12 bg-[#FF2E88]" />
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-anton uppercase tracking-tight leading-[0.95] text-[#F5F0FA]">
            THE INTEL LAYER FOR <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#FF2E88] to-[#00E5FF] bg-clip-text text-transparent">
              THE NEXT GENERATION
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#9C8FAE] leading-relaxed font-normal max-w-3xl">
            GTA 6 Hub was founded with a singular, uncompromised focus: to build a high-fidelity database-first ecosystem for the most anticipated virtual playground in history. While generic gaming sites rely on automated scraping and click-driven rumor loops, we deliver raw, curated, and structured telemetry directly to players.
          </p>

          <p className="text-sm text-[#9C8FAE]/80 leading-relaxed font-normal max-w-3xl">
            From our fully-interactive Lore Connections map powered by dynamic D3.js, to custom vehicle specifications benchmarking checklists, and pro-grade mission walkthroughs—our entire infrastructure is built to respect your intelligence and optimize your open-world operational execution.
          </p>
        </section>

        {/* Section 2: Reusable Site Depth Index */}
        <SiteDepthIndex
          newsCount={newsCount}
          guidesCount={guidesCount}
          loreCount={loreCount}
        />

        {/* Section 3: Creator Section & Standing Disclaimer Side-by-Side */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4 items-stretch">
          {/* Creator Profile */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] rounded p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#00E5FF]/10 to-transparent blur-xl pointer-events-none" />

            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold font-mono text-[#00E5FF] uppercase tracking-widest">
                  CORE DEVELOPER
                </span>
                <h3 className="text-2xl font-anton uppercase text-[#F5F0FA]">
                  Ahmad Khan
                </h3>
              </div>
              <p className="text-sm text-[#9C8FAE] leading-relaxed">
                Computer Science student and builder of GTA6 Hub — designed, built, and shipped as a full-stack portfolio project utilizing a modern React server framework, real-time database architecture, and advanced visual mapping.
              </p>
            </div>

            {/* Developer Social Treatment (reusing footer style) */}
            <div className="pt-6 mt-8 border-t border-[rgba(245,240,250,0.08)] flex flex-wrap gap-6 font-mono text-xs">
              <a
                href="https://github.com/ahmad-461"
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex items-center space-x-2 text-[#9C8FAE] hover:text-white transition-colors py-1 group"
              >
                <Github className="w-4 h-4 text-[#00E5FF]" />
                <span>GitHub</span>
                <span className="absolute bottom-0 left-0 h-[1.5px] bg-[#FF2E88] w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </a>

              <a
                href="https://www.linkedin.com/in/ahmad-khan-77441833a"
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex items-center space-x-2 text-[#9C8FAE] hover:text-white transition-colors py-1 group"
              >
                <Linkedin className="w-4 h-4 text-[#00E5FF]" />
                <span>LinkedIn</span>
                <span className="absolute bottom-0 left-0 h-[1.5px] bg-[#FF2E88] w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </a>
            </div>
          </div>

          {/* Credibility / Standing Fan Disclaimer */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] rounded p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#FF2E88]/10 to-transparent blur-xl pointer-events-none" />

            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold font-mono text-[#FF2E88] uppercase tracking-widest flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#FF2E88]" /> CREDIBILITY DISCLOSURE
                </span>
                <h3 className="text-2xl font-anton uppercase text-[#F5F0FA]">
                  UNOFFICIAL FAN PORTAL
                </h3>
              </div>
              <p className="text-sm text-[#9C8FAE] leading-relaxed">
                We are proud to be entirely unofficial, fan-operated, and self-funded. By remaining independent from Rockstar Games and Take-Two Interactive, GTA 6 Hub provides completely objective analysis, unaltered leak updates, and genuine commentary free from corporate sanitization.
              </p>
            </div>

            <p className="text-[10px] text-[#9C8FAE]/50 font-mono leading-relaxed mt-8 pt-4 border-t border-[rgba(245,240,250,0.08)]">
              All product names, logos, and brands are property of their respective owners. Rockstar Games, Grand Theft Auto, and Leonida are trademarks of Take-Two Interactive.
            </p>
          </div>
        </section>

        {/* Section 4: Visual Call-To-Action Block */}
        <section className="relative border border-[#00E5FF]/30 bg-[#150C1F]/40 backdrop-blur-md rounded p-12 text-center max-w-4xl mx-auto overflow-hidden">
          {/* Accent Reticles */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00E5FF]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00E5FF]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00E5FF]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00E5FF]" />

          <div className="space-y-6 max-w-xl mx-auto">
            <h3 className="text-3xl font-anton uppercase text-[#F5F0FA] tracking-normal">
              READY TO COMMENCE OPERATIONS?
            </h3>
            <p className="text-sm text-[#9C8FAE] leading-relaxed">
              Unlock the latest satellite news coverage, trace complex story networks, and deploy professional interactive tools.
            </p>
            <div className="pt-2">
              <Link
                href="/news"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#FF2E88] hover:bg-[#FF2E88]/90 text-white font-bold uppercase tracking-wider text-xs rounded transition-all duration-300 font-mono shadow-[0_4px_20px_rgba(255,46,136,0.3)] hover:shadow-[0_4px_30px_rgba(255,46,136,0.5)] active:scale-95 duration-100"
              >
                EXPLORE LATEST INTEL <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
