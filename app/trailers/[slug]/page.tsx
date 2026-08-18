import React from "react"
import Link from "next/link"
import NextImage from "next/image"
import { notFound } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { ArrowLeft, Clock, Video, Calendar, Sparkles, Play, ShieldAlert } from "lucide-react"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"
import JsonLd from "@/components/JsonLd"

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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gta6-hub-liard.vercel.app"

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Trailers",
        "item": `${siteUrl}/trailers`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": tb.title,
        "item": `${siteUrl}/trailers/${tb.slug}`,
      },
    ],
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow space-y-10 animate-fade-in">
      <JsonLd data={breadcrumbSchema} />
      {/* Back to Trailers */}
      <div>
        <Link
          href="/trailers"
          className="inline-flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider text-[#00E5FF] hover:text-[#FF2E88] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Breakdowns</span>
        </Link>
      </div>

      {/* Title Details */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <Badge color="magenta" variant="subtle">
            <Video className="w-3 h-3 mr-1" />
            Official Rockstar Footage
          </Badge>
          <span className="text-paper-dim/40">•</span>
          <span className="flex items-center gap-1 text-paper-dim/70">
            <Calendar className="w-3.5 h-3.5 text-paper-dim/40" />
            <span>{formatDate(tb.published_at)}</span>
          </span>
          <span className="text-paper-dim/40">•</span>
          <span className="text-[#00E5FF] font-semibold">{moments?.length || 0} Key Moments Cataloged</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-paper font-mono leading-tight">
          {tb.title}
        </h1>

        <Card variant="standard" padding="md" className="bg-ink-2/60 border-hairline leading-relaxed text-sm sm:text-base text-paper-dim/90">
          {tb.intro || "Comprehensive intelligence timeline cataloging frame observations and speculated items."}
        </Card>
      </div>

      {/* Responsive YouTube Iframe Embed Container */}
      {embedUrl ? (
        <div className="space-y-2">
          <Card
            variant="standard"
            padding="none"
            className="aspect-video w-full rounded-xl overflow-hidden border-2 border-[#FF2E88]/30 bg-ink relative shadow-[0_0_30px_rgba(255,46,136,0.12)]"
          >
            <iframe
              src={embedUrl}
              title={tb.title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </Card>
          <p className="text-[10px] text-paper-dim/40 text-right font-mono uppercase tracking-widest px-1">
            Source Registry: {tb.trailer_source_url}
          </p>
        </div>
      ) : (
        <Card variant="standard" padding="lg" className="aspect-video w-full bg-ink border border-hairline flex flex-col items-center justify-center text-center space-y-3">
          <Video className="w-12 h-12 text-paper-dim/30" />
          <h4 className="text-sm font-bold text-paper font-mono uppercase">Video Player Fallback</h4>
          <p className="text-xs text-paper-dim/60 max-w-sm">
            Could not parse matching YouTube embed ID. You can watch directly at:{" "}
            <a href={tb.trailer_source_url} target="_blank" className="text-[#FF2E88] hover:underline" rel="noreferrer">
              {tb.trailer_source_url}
            </a>
          </p>
        </Card>
      )}

      {/* Vertical Declassified Timeline */}
      <div className="space-y-8 pt-6">
        <div className="flex items-center space-x-2 text-[#FF8A3D] font-mono text-xs uppercase tracking-widest font-bold">
          <ShieldAlert className="w-4 h-4" />
          <span>Declassified Timeline Analysis</span>
        </div>

        <div className="border-l-2 border-[#FF2E88]/40 ml-3.5 sm:ml-5 pl-8 sm:pl-10 space-y-12 relative">
          {moments && moments.length > 0 ? (
            moments.map((m, idx) => (
              <div
                key={m.id}
                className="relative group animate-in fade-in slide-in-from-left-4 duration-500 motion-reduce:animate-none motion-reduce:transform-none"
                style={{
                  animationDelay: `${idx * 150}ms`,
                  animationFillMode: "backwards",
                }}
              >
                {/* Timeline node dot indicator */}
                <span className="absolute -left-[45px] sm:-left-[53px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-ink border-2 border-[#FF2E88] text-[10px] font-mono font-bold text-[#FF2E88] group-hover:scale-110 group-hover:bg-[#FF2E88] group-hover:text-white transition-all shadow-[0_0_15px_rgba(255,46,136,0.35)]">
                  {idx + 1}
                </span>

                <div className="space-y-4">
                  {/* Moment details bar */}
                  <div className="flex items-center space-x-3 text-xs font-mono">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00E5FF]/10 text-[#00E5FF] rounded-md font-bold tracking-wider uppercase border border-[#00E5FF]/20 shadow-[0_0_10px_rgba(0,229,255,0.1)]">
                      <Clock size={12} className="text-[#00E5FF]" />
                      <span>{m.timestamp_label}</span>
                    </span>
                    <span className="text-[10px] text-paper-dim/50 uppercase tracking-widest font-bold">
                      DECLASSIFIED RECORD #{idx + 1}
                    </span>
                  </div>

                  {/* Screenshot card display */}
                  {m.screenshot_image && (
                    <Card padding="none" variant="standard" className="aspect-video relative rounded-xl overflow-hidden border border-hairline bg-ink max-w-xl shadow-xl">
                      <NextImage
                        src={m.screenshot_image}
                        alt={`Timestamp screenshot at ${m.timestamp_label}`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 600px"
                      />
                    </Card>
                  )}

                  {/* Written analysis */}
                  <Card padding="md" variant="standard" className="max-w-2xl leading-relaxed text-sm text-paper-dim/90 relative bg-ink-2/80 border-hairline">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#FF2E88] rounded-l opacity-80" />
                    <p className="whitespace-pre-line text-sm text-paper/90 font-sans">
                      {m.annotation_text}
                    </p>
                  </Card>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-paper-dim/50 font-mono italic">No moments timeline annotated for this segment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Highlights Banner */}
      <Card variant="console" padding="md" className="mt-16 border-dashed border-hairline text-center max-w-2xl mx-auto space-y-2">
        <Sparkles className="w-6 h-6 text-[#FF8A3D] mx-auto animate-pulse motion-reduce:animate-none" />
        <h4 className="text-sm font-bold text-paper uppercase font-mono tracking-wider">Continuous Video Mapping</h4>
        <p className="text-xs text-paper-dim/70 leading-relaxed font-sans">
          Our editorial intelligence continuously tracks footage leaks and frames. Watch the top embedded YouTube stream while scrolling matching vertical annotations to capture hidden details in true context.
        </p>
      </Card>
    </div>
  )
}
