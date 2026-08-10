import React from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Hash, Calendar, Folder, FileText } from "lucide-react"

interface TagPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const supabase = createSupabaseServerClient()
  const { data: tag } = await supabase
    .from("tags")
    .select("name")
    .eq("slug", params.slug)
    .maybeSingle()

  if (!tag) {
    return {
      title: "Tag Not Found | GTA VI Hub",
    }
  }

  return {
    title: `Tag: #${tag.name} | GTA VI Hub`,
    description: `Browse Grand Theft Auto VI news and articles tagged with #${tag.name}.`,
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

function getImageUrl(url?: string | null) {
  if (!url) return "/og-image.jpg"
  return url
}

export default async function TagArchivePage({ params }: TagPageProps) {
  const supabase = createSupabaseServerClient()

  // 1. Fetch tag details
  const { data: tag } = await supabase
    .from("tags")
    .select("id, name, slug")
    .eq("slug", params.slug)
    .maybeSingle()

  if (!tag) {
    notFound()
  }

  // 2. Fetch published articles associated with this tag
  const { data: tagRelations } = await supabase
    .from("article_tags")
    .select("article_id")
    .eq("tag_id", tag.id)

  const articleIds = (tagRelations || []).map((r) => r.article_id)

  let articles: any[] = []
  if (articleIds.length > 0) {
    const { data: arts } = await supabase
      .from("articles")
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image,
        published_at,
        category:categories(id, name, slug)
      `)
      .in("id", articleIds)
      .eq("status", "published")
      .order("published_at", { ascending: false })

    articles = arts || []
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-8">
      {/* Page Header */}
      <div className="space-y-3">
        <span className="text-xs font-black uppercase tracking-widest text-neon-pink bg-neon-pink/10 border border-neon-pink/25 rounded-md px-2.5 py-1 inline-flex items-center gap-1">
          <Hash className="w-3.5 h-3.5 text-neon-pink" /> Tag Archive
        </span>
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
          #{tag.name}
        </h1>
        <p className="text-foreground/60 max-w-2xl leading-relaxed text-sm sm:text-base">
          Browse Grand Theft Auto VI news and rumor articles associated with the hashtag <span className="text-white font-bold">#{tag.name}</span>.
        </p>
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-card-border/60 via-transparent to-transparent" />

      {/* Articles Feed */}
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => (
            <article
              key={art.id}
              className="group flex flex-col justify-between bg-card-bg border border-card-border rounded-xl overflow-hidden hover:border-neon-pink/40 hover:scale-[1.01] transition-all duration-300 shadow-md"
            >
              <div>
                <div className="relative w-full h-48 overflow-hidden">
                  <Image
                    src={getImageUrl(art.featured_image)}
                    alt={art.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-w-768px) 100vw, (max-w-1200px) 50vw, 30vw"
                  />
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neon-pink flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      Article
                    </span>

                    {art.category && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neon-blue flex items-center gap-1">
                        <Folder className="w-3 h-3" />
                        {(art.category as any).name}
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg sm:text-xl font-extrabold text-white group-hover:text-neon-pink transition-colors line-clamp-2 leading-snug">
                    <Link href={`/news/${art.slug}`}>{art.title}</Link>
                  </h2>
                  <p className="text-sm text-foreground/75 leading-relaxed line-clamp-3">
                    {art.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 mt-2 border-t border-card-border/30 flex items-center justify-between text-[11px] text-foreground/40 font-semibold">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-foreground/30" />
                  {formatDate(art.published_at)}
                </span>
                <Link
                  href={`/news/${art.slug}`}
                  className="text-neon-pink font-bold hover:underline uppercase tracking-wider"
                >
                  Read Article &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-card-border p-16 text-center rounded-xl bg-card-bg/40">
          <p className="text-foreground/40 text-lg mb-4">No published articles found matching this hashtag.</p>
          <Link href="/news" className="text-neon-pink hover:underline text-sm font-semibold">
            Explore All News &rarr;
          </Link>
        </div>
      )}
    </div>
  )
}
