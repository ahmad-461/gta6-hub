import React from "react"
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Video, Calendar, Eye, FileText } from "lucide-react"

export const revalidate = 3600

export const metadata = {
  title: "GTA VI Trailer Breakdowns | GTA VI Hub",
  description: "Browse our curated, vertical frame-by-frame trailer analysis and annotations of Grand Theft Auto VI.",
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

// Extractor to find video code for rendering fallback card image
function getYoutubeEmbedID(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

export default async function TrailersListPage() {
  const supabase = createSupabaseServerClient()

  // Fetch published breakdowns
  const { data: breakdowns } = await supabase
    .from("trailer_breakdowns")
    .select("id, title, slug, intro, trailer_source_url, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-neon-pink">
          <Video className="w-5 h-5" />
          <span className="text-xs font-black tracking-widest uppercase">Intel Video Registry</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-mono">
          Trailer Breakdowns
        </h1>
        <p className="text-foreground/60 max-w-2xl leading-relaxed text-sm sm:text-base">
          Explore our frame-by-frame annotations, Easter eggs, and deep-dive breakdowns of official Rockstar Games GTA VI footage.
        </p>
      </div>

      {/* Breakdowns List */}
      {breakdowns && breakdowns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {breakdowns.map((tb) => {
            const videoId = getYoutubeEmbedID(tb.trailer_source_url)
            const thumbnailSrc = videoId
              ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
              : "/og-image.jpg"

            return (
              <div
                key={tb.id}
                className="group flex flex-col justify-between bg-card-bg border border-card-border rounded-xl overflow-hidden hover:border-neon-pink/45 transition-all duration-300 shadow-lg"
              >
                <div>
                  {/* Stylized Video Fallback Image block */}
                  <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnailSrc}
                      alt={tb.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

                    {/* Play symbol hover display */}
                    <div className="absolute h-14 w-14 rounded-full border border-white/20 bg-black/60 flex items-center justify-center text-white backdrop-blur-sm group-hover:border-neon-pink group-hover:text-neon-pink shadow-2xl transition duration-300">
                      <Video className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-neon-pink transition-colors line-clamp-1 leading-snug">
                      <Link href={`/trailers/${tb.slug}`}>{tb.title}</Link>
                    </h2>
                    <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed line-clamp-3">
                      {tb.intro || "Comprehensive intelligence timeline cataloging frame observations and speculated items."}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 mt-2 border-t border-card-border/30 flex items-center justify-between text-[11px] text-foreground/45 font-semibold">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-foreground/30" />
                    {formatDate(tb.published_at)}
                  </span>
                  <Link
                    href={`/trailers/${tb.slug}`}
                    className="inline-flex items-center gap-1 text-neon-pink font-extrabold hover:underline uppercase tracking-wider text-xs"
                  >
                    <span>Analyze Breakdown</span>
                    <Eye size={12} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="border border-dashed border-card-border p-16 text-center rounded-xl bg-card-bg/40 max-w-xl mx-auto space-y-3">
          <FileText className="w-12 h-12 text-foreground/20 mx-auto" />
          <h4 className="text-lg font-bold text-white uppercase font-mono">No Active Breakdowns</h4>
          <p className="text-xs text-foreground/50 leading-relaxed">
            Our analysis division hasn&apos;t published any trailer analyses or frame timelines yet. Check back soon after official trailers premiere!
          </p>
        </div>
      )}
    </div>
  )
}
