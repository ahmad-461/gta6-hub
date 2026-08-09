import React from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Calendar, User, Clock, ArrowLeft, RefreshCw } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import ReadingProgressBar from "@/components/ReadingProgressBar"
import SocialShareRow from "@/components/SocialShareRow"
import CommentsSection from "@/components/CommentsSection"

export const revalidate = 0 // dynamically server-render

interface ArticlePageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: ArticlePageProps) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: article } = await supabase
      .from("articles")
      .select("title, excerpt, seo_title, seo_description")
      .eq("slug", params.slug)
      .single()

    if (!article) return {}

    return {
      title: article.seo_title || article.title,
      description: article.seo_description || article.excerpt || `Read the latest news coverage on GTA VI Hub.`,
    }
  } catch (_) {
    return {}
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const supabase = createSupabaseServerClient()

  let article: any = null
  let relatedArticles: any[] = []
  let comments: any[] = []

  try {
    // 1. Fetch current article + author profile + category
    const { data: articleData } = await supabase
      .from("articles")
      .select(`
        id,
        title,
        content,
        excerpt,
        featured_image,
        published_at,
        updated_at,
        category ( id, name, slug ),
        profiles:author_id ( name )
      `)
      .eq("slug", params.slug)
      .eq("status", "published")
      .maybeSingle()

    if (!articleData) {
      return notFound()
    }

    article = articleData

    // 2. Fetch approved comments
    const { data: commentsData } = await supabase
      .from("comments")
      .select("id, name, content, created_at")
      .eq("article_id", article.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })

    comments = commentsData || []

    // 3. Fetch related articles matched by shared tags
    const { data: articleTags } = await supabase
      .from("article_tags")
      .select("tag_id")
      .eq("article_id", article.id)

    const tagIds = articleTags?.map((t) => t.tag_id) || []

    if (tagIds.length > 0) {
      const { data: relatedData } = await supabase
        .from("article_tags")
        .select(`
          articles (
            id, title, slug, excerpt, featured_image, published_at, category ( name, slug )
          )
        `)
        .in("tag_id", tagIds)
        .neq("article_id", article.id)
        .limit(3)

      if (relatedData) {
        relatedArticles = relatedData
          .map((r: any) => r.articles)
          .filter(Boolean)
          .filter((v, i, self) => self.findIndex((t) => t.id === v.id) === i) // deduplicate
      }
    }

    // Fallback to most recent articles if we have fewer than 3 related articles
    if (relatedArticles.length < 3) {
      const excludeIds = [article.id, ...relatedArticles.map((r) => r.id)]
      const { data: fallbackData } = await supabase
        .from("articles")
        .select(`
          id, title, slug, excerpt, featured_image, published_at, category ( name, slug )
        `)
        .eq("status", "published")
        .not("id", "in", `(${excludeIds.join(",")})`)
        .order("published_at", { ascending: false })
        .limit(3 - relatedArticles.length)

      if (fallbackData) {
        relatedArticles = [...relatedArticles, ...fallbackData]
      }
    }
  } catch (err) {
    console.error("Error loading article details:", err)
    return notFound()
  }

  // Calculate Reading Time (200 WPM)
  const wordCount = article.content ? article.content.split(/\s+/).length : 0
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const categoryName = article.category?.name || "General"
  const categorySlug = article.category?.slug || ""

  return (
    <div className="w-full flex-grow bg-background text-foreground relative pb-20">
      {/* Scroll Reading Progress Bar */}
      <ReadingProgressBar />

      {/* ARTICLE WRAPPER */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* BACK ACTION & BREADCRUMB */}
        <div className="space-y-4">
          <Link
            href="/news"
            className="inline-flex items-center gap-1 text-xs font-bold text-foreground/50 hover:text-neon-pink uppercase tracking-widest transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back To News
          </Link>

          <nav className="text-xs font-semibold uppercase tracking-wider text-foreground/40 flex flex-wrap items-center gap-2">
            <Link href="/" className="hover:text-neon-pink">Home</Link>
            <span>&gt;</span>
            <Link href="/news" className="hover:text-neon-pink">News</Link>
            <span>&gt;</span>
            {categorySlug ? (
              <Link href={`/news?category=${categorySlug}`} className="hover:text-neon-pink">{categoryName}</Link>
            ) : (
              <span>{categoryName}</span>
            )}
            <span>&gt;</span>
            <span className="text-foreground/60 line-clamp-1">{article.title}</span>
          </nav>
        </div>

        {/* TITLE & META */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-bold text-foreground/50 border-y border-card-border py-4">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-neon-pink" />
              BY {article.profiles?.name || "STAFF WRITER"}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-neon-pink" />
              PUBLISHED: {formatDate(article.published_at)}
            </span>
            {article.updated_at && article.updated_at !== article.published_at && (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-neon-pink" />
                UPDATED: {formatDate(article.updated_at)}
              </span>
            )}
            <span className="flex items-center gap-1.5 ml-auto">
              <Clock className="w-4 h-4 text-neon-pink" />
              {readTime} MIN READ
            </span>
          </div>
        </div>

        {/* FEATURED IMAGE */}
        <div className="relative w-full h-[250px] sm:h-[450px] rounded-lg overflow-hidden border border-card-border">
          <Image
            src={article.featured_image || "/placeholder-featured.jpg"}
            alt={article.title}
            fill
            priority
            unoptimized
            loading="eager"
            className="object-cover"
          />
        </div>

        {/* CONTENT */}
        <div
          className="article-content text-foreground/90 text-base sm:text-lg leading-relaxed space-y-6"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* SOCIAL SHARE ROW */}
        <SocialShareRow title={article.title} />

        {/* RELATED ARTICLES */}
        {relatedArticles.length > 0 && (
          <div className="pt-12 space-y-6">
            <h3 className="text-lg font-black tracking-wider text-white uppercase flex items-center gap-3">
              <span className="w-1 h-6 bg-neon-pink" />
              Related Articles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => (
                <div
                  key={rel.id}
                  className="group bg-card-bg border border-card-border hover:border-neon-pink/30 rounded overflow-hidden transition-all duration-300 flex flex-col"
                >
                  <div className="relative h-32 w-full bg-brand-dark">
                    <Image
                      src={rel.featured_image || "/placeholder-card.jpg"}
                      alt={rel.title}
                      fill
                      unoptimized
                      loading="lazy"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      {rel.category && (
                        <span className="text-[9px] font-bold text-neon-pink tracking-widest uppercase">
                          {rel.category.name}
                        </span>
                      )}
                      <Link href={`/news/${rel.slug}`}>
                        <h4 className="text-xs sm:text-sm font-bold text-white hover:text-neon-pink transition-colors line-clamp-2">
                          {rel.title}
                        </h4>
                      </Link>
                    </div>
                    <span className="text-[10px] text-foreground/45 font-bold uppercase block pt-1 border-t border-card-border">
                      {formatDate(rel.published_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DISCUSSION & COMMENTS SECTION */}
        <div className="pt-12">
          <CommentsSection articleId={article.id} initialComments={comments} />
        </div>

      </article>
    </div>
  )
}
