import React from "react"
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Video, Calendar, Eye, Play, Film } from "lucide-react"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"
import EmptyState from "@/components/ui/EmptyState"

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

  // Fetch published breakdowns with moments count
  const { data: rawBreakdowns } = await supabase
    .from("trailer_breakdowns")
    .select("id, title, slug, intro, trailer_source_url, published_at, trailer_breakdown_moments(count)")
    .eq("status", "published")
    .order("published_at", { ascending: false })

  const breakdowns = rawBreakdowns || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-[#FF2E88]">
          <Video className="w-4 h-4" />
          <span className="text-xs font-bold tracking-widest uppercase font-mono">
            Intel Video Registry
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-paper font-mono">
          Trailer Breakdowns
        </h1>
        <p className="text-paper-dim/70 max-w-2xl leading-relaxed text-sm sm:text-base">
          Explore our frame-by-frame annotations, Easter eggs, and deep-dive breakdowns of official Rockstar Games GTA VI footage.
        </p>
      </div>

      {/* Breakdowns List */}
      {breakdowns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-2">
          {breakdowns.map((tb, idx) => {
            const videoId = getYoutubeEmbedID(tb.trailer_source_url)
            const thumbnailSrc = videoId
              ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
              : "/og-image.jpg"

            // Get moments count from count aggregate array/object
            const momentsCountArray = tb.trailer_breakdown_moments as unknown as { count: number }[]
            const momentsCount = Array.isArray(momentsCountArray) && momentsCountArray.length > 0
              ? momentsCountArray[0]?.count || 0
              : 0

            return (
              <Card
                key={tb.id}
                padding="none"
                variant="standard"
                className="group flex flex-col justify-between hover:border-[#FF2E88]/60 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 motion-reduce:animate-none motion-reduce:transform-none"
                style={{
                  animationDelay: `${idx * 120}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <div>
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video w-full bg-ink flex items-center justify-center overflow-hidden border-b border-hairline">
                    {/* Official Trailer Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <Badge color="magenta" variant="subtle" className="backdrop-blur-md bg-ink/70">
                        Official Trailer
                      </Badge>
                    </div>

                    {/* Thumbnail Image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnailSrc}
                      alt={tb.title}
                      className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-[1.04] transition-transform duration-500 ease-out motion-reduce:group-hover:scale-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent pointer-events-none" />

                    {/* Play Button Overlay */}
                    <div className="absolute h-14 w-14 rounded-full border-2 border-[#FF8A3D] bg-ink/80 backdrop-blur-md flex items-center justify-center text-[#FF8A3D] shadow-[0_0_15px_rgba(255,138,61,0.35)] group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(255,138,61,0.65)] group-hover:border-[#FF8A3D] transition-all duration-300 animate-pulse motion-reduce:animate-none motion-reduce:group-hover:scale-100">
                      <Play className="w-6 h-6 fill-[#FF8A3D] translate-x-0.5" />
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-3">
                    <h2 className="text-lg sm:text-xl font-bold text-paper font-mono group-hover:text-[#FF2E88] transition-colors line-clamp-1 leading-snug">
                      <Link href={`/trailers/${tb.slug}`}>{tb.title}</Link>
                    </h2>
                    <p className="text-xs sm:text-sm text-paper-dim/80 leading-relaxed line-clamp-3 font-sans">
                      {tb.intro || "Comprehensive intelligence timeline cataloging frame observations and speculated items."}
                    </p>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="p-6 pt-0 mt-2 border-t border-hairline/50 flex items-center justify-between text-[11px] text-paper-dim/60 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-paper-dim/40" />
                    {formatDate(tb.published_at)}
                  </span>

                  {momentsCount > 0 && (
                    <span className="flex items-center gap-1 text-[#00E5FF] font-semibold">
                      <Film className="w-3.5 h-3.5" />
                      {momentsCount} {momentsCount === 1 ? "Moment" : "Moments"}
                    </span>
                  )}

                  <Link
                    href={`/trailers/${tb.slug}`}
                    className="inline-flex items-center gap-1 text-[#FF8A3D] font-bold hover:text-[#FF2E88] uppercase tracking-wider text-xs transition-colors"
                  >
                    <span>Analyze</span>
                    <Eye size={12} />
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Film className="w-10 h-10" />}
          title="No Active Transmissions"
          description="No transmissions logged yet. Standing by for new footage."
          className="max-w-xl mx-auto my-12"
        />
      )}
    </div>
  )
}
