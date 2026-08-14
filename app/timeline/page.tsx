import React from "react"
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Calendar, ShieldCheck, ArrowRight, Clock, FileText } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Declassified Timeline | GTA VI Hub",
  description: "A chronological record of everything officially confirmed about Grand Theft Auto VI.",
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

export default async function DeclassifiedTimelinePage() {
  const supabase = createSupabaseServerClient()

  // Fetch confirmed facts / articles sorted newest-to-oldest
  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, published_at")
    .eq("rumor_status", "confirmed")
    .eq("status", "published")
    .order("published_at", { ascending: false })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-12">
      {/* Page Header */}
      <div className="relative p-8 rounded-2xl bg-[#16161B] border border-[rgba(245,245,247,0.14)] overflow-hidden shadow-2xl">
        {/* Subtle decorative grid/mesh or visual accents */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2D8D]/5 via-transparent to-[#FF8A3D]/5 pointer-events-none" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#FF8A3D]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-4 max-w-3xl">
          <div className="flex items-center space-x-2 text-[#FF8A3D] font-mono text-xs font-bold tracking-widest uppercase">
            <ShieldCheck className="w-5 h-5 animate-pulse" />
            <span>AUTHENTICATED TRANSMISSION LAYER</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-anton text-[#F5F5F7] tracking-tight uppercase leading-none">
            Declassified Timeline
          </h1>

          <p className="text-sm sm:text-base text-[#9E9EA8] leading-relaxed">
            A chronological record of everything officially confirmed about Grand Theft Auto VI. Every item featured here represents authenticated releases, official announcements, or legally verified publisher disclosures — filtered from rumors and speculation.
          </p>
        </div>
      </div>

      {/* Main Timeline Section */}
      {articles && articles.length > 0 ? (
        <div className="relative pl-6 sm:pl-10 border-l-2 border-[#FF8A3D]/25 space-y-12 py-4">
          {articles.map((art, idx) => (
            <div key={art.id} className="relative group">
              {/* Timeline outer node indicator */}
              <span className="absolute -left-[31px] sm:-left-[47px] top-1.5 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#0B0B0F] border-2 border-[#FF8A3D] text-[#FF8A3D] group-hover:bg-[#FF8A3D] group-hover:text-[#0B0B0F] transition-all duration-300 shadow-[0_0_8px_rgba(255,138,61,0.3)]">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>

              {/* Entry Card */}
              <div className="relative bg-[#16161B] hover:bg-[#1C1C24] border border-[rgba(245,245,247,0.14)] hover:border-[#FF8A3D]/45 rounded-xl p-6 transition-all duration-300 shadow-lg flex flex-col md:flex-row gap-6 justify-between items-start overflow-hidden">
                {/* Declassified Stamp Seal overlay */}
                <div className="absolute -right-4 -bottom-4 md:right-8 md:bottom-auto md:top-6 select-none pointer-events-none opacity-25 group-hover:opacity-40 transition-opacity duration-300">
                  <div className="rotate-[15deg] border-4 border-dashed border-[#FF8A3D] px-4 py-2 text-xs font-mono font-black tracking-widest text-[#FF8A3D] rounded uppercase select-none flex flex-col items-center justify-center leading-none">
                    <span className="text-[10px] opacity-75">GOVT APPROVED</span>
                    <span className="text-base font-extrabold mt-0.5">DECLASSIFIED</span>
                    <span className="text-[8px] opacity-50 mt-1">VERIFIED FACTS</span>
                  </div>
                </div>

                <div className="space-y-3 max-w-xl pr-0 md:pr-16 relative z-10">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#FF8A3D]">
                    <Calendar className="w-4 h-4 shrink-0 text-[#FF8A3D]/70" />
                    <span>{formatDate(art.published_at)}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-anton text-[#F5F5F7] group-hover:text-[#FF2D8D] transition-colors leading-snug">
                    <Link href={`/news/${art.slug}`}>{art.title}</Link>
                  </h2>

                  <p className="text-sm text-[#9E9EA8] leading-relaxed line-clamp-3 font-sans">
                    {art.excerpt || "Official briefing regarding verified GTA 6 status, coordinates, or publishing updates."}
                  </p>
                </div>

                <div className="w-full md:w-auto shrink-0 self-end md:self-center relative z-10">
                  <Link
                    href={`/news/${art.slug}`}
                    className="w-full md:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-mono font-extrabold bg-[#0B0B0F] border border-[#FF8A3D]/30 hover:border-[#FF2D8D] hover:bg-[#FF2D8D] text-white transition-all duration-300 uppercase tracking-widest"
                  >
                    <span>Read Record</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-[rgba(245,245,247,0.14)] p-16 text-center rounded-2xl bg-[#16161B] max-w-xl mx-auto space-y-4">
          <FileText className="w-12 h-12 text-[#9E9EA8]/30 mx-auto" />
          <h4 className="text-lg font-mono font-bold text-white uppercase tracking-wider">No Confirmed Timeline Records</h4>
          <p className="text-xs text-[#9E9EA8] leading-relaxed">
            Our data synchronizer hasn&apos;t mapped any verified timeline entries yet. Check back soon for official Rockstar updates!
          </p>
        </div>
      )}
    </div>
  )
}
