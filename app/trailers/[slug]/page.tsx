import React from "react"
import Link from "next/link"
import NextImage from "next/image"
import { notFound } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { ArrowLeft, Clock, Play, Award, Video, Eye, Calendar, Sparkles } from "lucide-react"

export const revalidate = 3600

interface TrailerDetailPageProps {
  params: {
    slug: string
  }
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

export default async function TrailerDetailPage({ params }: TrailerDetailPageProps) {
  const supabase = createSupabaseServerClient()

  // 1. Fetch breakdown
  const { data: tb } = await supabase
    .from("trailer_breakdowns")
    .select("id, title, slug, trailer_source_url, intro, published_at")
    .eq("slug", params.slug)
    .eq("status", "published")
    .maybeSingle()

  if (!tb) {
    notFound()
  }

  // 2. Fetch moments
  const { data: moments } = await supabase
    .from("trailer_breakdown_moments")
    .select("*")
    .eq("breakdown_id", tb.id)
    .order("order", { ascending: true })

  const videoId = getYoutubeEmbedID(tb.trailer_source_url)
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow space-y-10 animate-fade-in">
      {/* Back to Trailers */}
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
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/50">
          <span className="flex items-center gap-1">
            <Video className="w-3.5 h-3.5 text-neon-pink" />
            <span>OFFICIAL ROCKSTAR FOOTAGE</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(tb.published_at)}</span>
          </span>
          <span>•</span>
          <span className="text-neon-blue font-semibold">{moments?.length || 0} Key Moments Cataloged</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-mono leading-tight">
          {tb.title}
        </h1>

        <p className="text-sm sm:text-base text-foreground/85 leading-relaxed bg-[#100e16]/40 border border-card-border p-5 rounded-xl">
          {tb.intro || "Comprehensive intelligence timeline cataloging frame observations and speculated items."}
        </p>
      </div>

      {/* Responsive YouTube Iframe Embed */}
      {embedUrl ? (
        <div className="space-y-2">
          <div className="aspect-video w-full rounded-xl overflow-hidden border-2 border-card-border/80 bg-black relative shadow-2xl">
            <iframe
              src={embedUrl}
              title={tb.title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="text-[10px] text-foreground/45 text-right font-mono uppercase tracking-widest px-1">
            Embed URL: {tb.trailer_source_url}
          </p>
        </div>
      ) : (
        <div className="aspect-video w-full rounded-xl bg-black border border-card-border flex flex-col items-center justify-center p-8 text-center space-y-3">
          <Video className="w-12 h-12 text-foreground/20" />
          <h4 className="text-sm font-bold text-white uppercase">Video Player Fallback</h4>
          <p className="text-xs text-foreground/50 max-w-sm">
            Could not parse matching YouTube embed ID. You can watch directly at: <a href={tb.trailer_source_url} target="_blank" className="text-neon-pink hover:underline" rel="noreferrer">{tb.trailer_source_url}</a>
          </p>
        </div>
      )}

      {/* vertical timeline of moments */}
      <div className="space-y-12 pt-6">
        <div className="border-l-2 border-neon-pink/30 ml-3.5 sm:ml-5 pl-8 sm:pl-10 space-y-16 relative">
          {moments && moments.length > 0 ? (
            moments.map((m, idx) => (
              <div key={m.id} className="relative group animate-in fade-in duration-300">
                {/* Timeline node dot indicator */}
                <span className="absolute -left-[45px] sm:-left-[53px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black border border-neon-pink text-[10px] font-black text-neon-pink group-hover:scale-110 group-hover:bg-neon-pink group-hover:text-black transition shadow-[0_0_12px_rgba(255,0,127,0.25)]">
                  {idx + 1}
                </span>

                <div className="space-y-4">
                  {/* Moment details bar */}
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-neon-blue/15 text-neon-blue rounded-md font-mono font-bold tracking-wider uppercase border border-neon-blue/10">
                      <Clock size={12} />
                      {m.timestamp_label}
                    </span>
                    <span className="text-[10px] text-foreground/45 uppercase tracking-widest font-mono">
                      TIMELINE TARGET FILE
                    </span>
                  </div>

                  {/* Screenshot card display */}
                  {m.screenshot_image && (
                    <div className="aspect-video relative rounded-xl overflow-hidden border border-card-border/80 bg-black/60 max-w-xl shadow-lg">
                      <NextImage
                        src={m.screenshot_image}
                        alt={`Timestamp screenshot at ${m.timestamp_label}`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 600px"
                      />
                    </div>
                  )}

                  {/* Written analysis */}
                  <div className="bg-card-bg border border-card-border/80 p-5 rounded-xl max-w-2xl leading-relaxed text-sm text-foreground/80 relative">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-neon-pink rounded-l-xl opacity-80" />
                    <p className="whitespace-pre-line text-sm text-foreground/90">
                      {m.annotation_text}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-foreground/45 italic">No momentos timeline annotated for this segment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic bottom highlights banner */}
      <div className="mt-16 p-6 rounded-xl border border-dashed border-card-border bg-card-bg/20 text-center max-w-2xl mx-auto space-y-2">
        <Sparkles className="w-6 h-6 text-neon-yellow mx-auto animate-pulse" />
        <h4 className="text-sm font-extrabold text-white uppercase font-mono">Continuous Video Mapping</h4>
        <p className="text-xs text-foreground/50 leading-relaxed">
          Our editorial intelligence continuously tracks footage leaks and frames. Watch the top embedded YouTube stream while scrolling matching vertical annotations to capture hidden details in true context.
        </p>
      </div>
    </div>
  )
}
