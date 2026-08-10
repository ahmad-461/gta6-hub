import React from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Calendar, User, Clock, ChevronRight, Share2, Twitter, MessageCircle, ArrowLeft, Check } from "lucide-react"
import ReadingProgressBar from "@/components/ReadingProgressBar"
import ArticleComments from "@/components/ArticleComments"
import CopyLinkButton from "@/components/CopyLinkButton"

interface ArticlePageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const supabase = createSupabaseServerClient()
  const { data: article } = await supabase
    .from("articles")
    .select("title, excerpt, seo_title, seo_description")
    .eq("slug", params.slug)
    .maybeSingle()

  if (!article) {
    return {
      title: "Article Not Found | GTA VI Hub",
    }
  }

  return {
    title: article.seo_title || article.title,
    description: article.seo_description || article.excerpt || "",
    openGraph: {
      title: article.seo_title || article.title,
      description: article.seo_description || article.excerpt || "",
      type: "article",
    },
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

export default async function ArticlePage({ params }: ArticlePageProps) {
  const supabase = createSupabaseServerClient()

  // 1. Fetch current article + author profile + category
  const { data: article } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      slug,
      content,
      excerpt,
      featured_image,
      published_at,
      updated_at,
      author_id,
      category:categories(id, name, slug)
    `)
    .eq("slug", params.slug)
    .eq("status", "published")
    .maybeSingle()

  if (!article) {
    notFound()
  }

  // 2. Fetch author profile
  let authorName = "GTA VI Team"
  if (article.author_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", article.author_id)
      .maybeSingle()
    if (profile?.name) {
      authorName = profile.name
    }
  }

  // 3. Calculate reading time (200 WPM)
  const wordCount = article.content ? article.content.split(/\s+/).length : 0
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  // 4. Fetch comments (approved only)
  const { data: comments } = await supabase
    .from("comments")
    .select("id, name, content, created_at")
    .eq("article_id", article.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  // 5. Get tag IDs for matching related articles
  const { data: artTags } = await supabase
    .from("article_tags")
    .select("tag_id")
    .eq("article_id", article.id)
  const tagIds = (artTags || []).map((t) => t.tag_id)

  let related: any[] = []
  if (tagIds.length > 0) {
    const { data: relArticles } = await supabase
      .from("article_tags")
      .select("article_id")
      .in("tag_id", tagIds)
      .neq("article_id", article.id)
      .limit(10)
    const relatedIds = (relArticles || []).map((r) => r.article_id)
    if (relatedIds.length > 0) {
      const { data: arts } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, featured_image, published_at")
        .in("id", relatedIds)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3)
      related = arts || []
    }
  }

  if (related.length < 3) {
    const { data: fallback } = await supabase
      .from("articles")
      .select("id, title, slug, excerpt, featured_image, published_at")
      .neq("id", article.id)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(3 - related.length)
    related = [...related, ...(fallback || [])]
  }

  // Construct absolute article URL for sharing
  const articleUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://gta6-hub.vercel.app"}/news/${article.slug}`
  const encodedTitle = encodeURIComponent(article.title)
  const encodedUrl = encodeURIComponent(articleUrl)

  const shareLinks = {
    x: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    reddit: `https://www.reddit.com/submit?title=${encodedTitle}&url=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
  }

  return (
    <div className="relative w-full">
      {/* Reading Progress Bar */}
      <ReadingProgressBar />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-1 sm:space-x-2 text-xs font-bold uppercase tracking-wider text-foreground/40 mb-8 overflow-x-auto whitespace-nowrap pb-2">
          <Link href="/" className="hover:text-neon-pink transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <Link href="/news" className="hover:text-neon-pink transition-colors">
            News
          </Link>
          {article.category && (
            <>
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
              <Link
                href={`/news?category=${(article.category as any).slug}`}
                className="hover:text-neon-pink transition-colors"
              >
                {(article.category as any).name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <span className="text-foreground/80 truncate max-w-[200px] sm:max-w-xs">
            {article.title}
          </span>
        </nav>

        {/* Article Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Article Content Column */}
          <main className="lg:col-span-8 space-y-8">
            {/* Header Content */}
            <div className="space-y-4">
              {article.category && (
                <span className="text-xs font-extrabold uppercase tracking-widest text-neon-pink bg-neon-pink/10 border border-neon-pink/25 rounded-md px-2.5 py-1 inline-block">
                  {(article.category as any).name}
                </span>
              )}
              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                {article.title}
              </h1>

              {/* Author & Read Time Info */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-bold uppercase tracking-wider text-foreground/50 border-y border-card-border/60 py-3">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4 text-neon-blue" />
                  By {authorName}
                </span>
                <span className="hidden sm:inline text-foreground/20">|</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-neon-blue" />
                  Published {formatDate(article.published_at)}
                </span>
                {article.updated_at && article.updated_at !== article.published_at && (
                  <>
                    <span className="hidden sm:inline text-foreground/20">|</span>
                    <span className="text-foreground/40 italic">
                      Updated {formatDate(article.updated_at)}
                    </span>
                  </>
                )}
                <span className="hidden sm:inline text-foreground/20">|</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-neon-blue" />
                  {readTime} Min Read
                </span>
              </div>
            </div>

            {/* Featured Image */}
            <div className="relative w-full h-[280px] sm:h-[480px] rounded-xl overflow-hidden shadow-2xl border border-card-border">
              <Image
                src={getImageUrl(article.featured_image)}
                alt={article.title}
                fill
                className="object-cover"
                priority
                sizes="(max-w-1024px) 100vw, 70vw"
              />
            </div>

            {/* Article Content Area */}
            {/* H2 Headings styled with left border accent using theme's neon accent color */}
            <div className="prose prose-invert max-w-none prose-headings:font-black [&_h2]:border-l-4 [&_h2]:border-neon-pink [&_h2]:pl-4 [&_h2]:my-6 [&_h2]:text-white [&_h2]:font-extrabold [&_h2]:text-2xl [&_p]:leading-relaxed [&_p]:text-foreground/90 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4">
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </div>

            {/* Social Share Row */}
            <div className="flex flex-wrap items-center gap-3 border-y border-card-border/60 py-4">
              <span className="text-xs font-black uppercase tracking-wider text-foreground/50 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-neon-pink" />
                Share Article:
              </span>
              <a
                href={shareLinks.x}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-background border border-card-border hover:border-[#1DA1F2]/50 hover:bg-[#1DA1F2]/10 text-xs font-bold text-white transition-all duration-200"
              >
                <Twitter className="w-3.5 h-3.5 text-[#1DA1F2]" />
                X / Twitter
              </a>
              <a
                href={shareLinks.reddit}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-background border border-card-border hover:border-[#FF4500]/50 hover:bg-[#FF4500]/10 text-xs font-bold text-white transition-all duration-200"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#FF4500]" />
                Reddit
              </a>
              <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-background border border-card-border hover:border-[#25D366]/50 hover:bg-[#25D366]/10 text-xs font-bold text-white transition-all duration-200"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                WhatsApp
              </a>
              <CopyLinkButton url={articleUrl} />
            </div>

            {/* Comments Component */}
            <ArticleComments articleId={article.id} initialComments={comments || []} />
          </main>

          {/* Sidebar Column */}
          <aside className="lg:col-span-4 space-y-6">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neon-pink hover:underline bg-neon-pink/5 border border-neon-pink/20 rounded-lg px-4 py-2.5 w-full justify-center transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" /> Back To All News
            </Link>

            {/* Related Articles Widgets */}
            <div className="bg-card-bg border border-card-border rounded-xl p-6 shadow-md space-y-4">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-foreground/50 border-b border-card-border pb-2">
                Related Articles
              </h3>
              {related && related.length > 0 ? (
                <div className="space-y-4">
                  {related.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/news/${rel.slug}`}
                      className="group flex gap-3 items-start hover:bg-background/40 p-2 rounded-lg transition-all duration-200"
                    >
                      <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 border border-card-border">
                        <Image
                          src={getImageUrl(rel.featured_image)}
                          alt={rel.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="64px"
                        />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-white group-hover:text-neon-pink transition-colors line-clamp-2 leading-snug">
                          {rel.title}
                        </h4>
                        <span className="text-[9px] text-foreground/40 font-bold block">
                          {formatDate(rel.published_at)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-foreground/40 italic">No related articles found.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
