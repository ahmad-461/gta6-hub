import React from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Calendar, Clock, ChevronRight, ArrowLeft, Eye } from "lucide-react"
import GuideToc from "@/components/GuideToc"
import GuideContentRenderer from "@/components/GuideContentRenderer"
import JsonLd from "@/components/JsonLd"
import AdSenseInitializer from "@/components/AdSenseInitializer"
import SaveGameButton from "@/components/SaveGameButton"
import { injectAdSenseAds } from "@/lib/adsense"
import { parseAffiliateLinks } from "@/lib/affiliate"

export const revalidate = 3600

interface GuidePageProps {
  params: {
    category: string
    slug: string
  }
}

// Convert guide_category name to slug
function getCategorySlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-")
}

// Map slug to category name
function getCategoryName(slug: string) {
  const map: Record<string, string> = {
    "getting-started": "Getting Started",
    "story": "Story",
    "online": "Online",
    "cheats": "Cheats",
    "secrets": "Secrets",
  }
  return map[slug] || null
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const supabase = createSupabaseServerClient()
  const { data: guide } = await supabase
    .from("guides")
    .select("title, guide_category, seo_title, seo_description, featured_image")
    .eq("slug", params.slug)
    .maybeSingle()

  if (!guide) {
    return {
      title: "Guide Not Found | GTA VI Hub",
    }
  }

  const title = guide.seo_title || `${guide.title} (${guide.guide_category}) | GTA VI Hub`
  const description = guide.seo_description || `Expert walkthrough and strategies for ${guide.title} on GTA VI Hub.`
  const ogImage = guide.featured_image || "/og-image.jpg"

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    }
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

export default async function GuidePage({ params }: GuidePageProps) {
  const categoryName = getCategoryName(params.category)
  if (!categoryName) {
    notFound()
  }

  const supabase = createSupabaseServerClient()

  // Fetch site setting for AdSense Publisher ID
  const { data: adsenseSetting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "adsense_publisher_id")
    .maybeSingle()
  const publisherId = adsenseSetting?.value || null

  // Fetch guide detail
  const { data: guide } = await supabase
    .from("guides")
    .select(`
      id,
      title,
      slug,
      content,
      difficulty,
      guide_category,
      word_count,
      toc,
      featured_image,
      published_at,
      author_id,
      seo_title,
      seo_description,
      faq
    `)
    .eq("slug", params.slug)
    .eq("guide_category", categoryName)
    .eq("status", "published")
    .maybeSingle()

  if (!guide) {
    notFound()
  }

  // Fetch author
  let authorName = "GTA6 Hub Staff"
  if (guide.author_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", guide.author_id)
      .maybeSingle()
    if (profile?.name) {
      authorName = profile.name
    }
  }

  // Construct JSON-LD Structured Schemas
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": guide.title,
    "description": guide.seo_description || `Expert walkthrough and strategies for ${guide.title} on GTA VI Hub.`,
    "image": getImageUrl(guide.featured_image),
    "datePublished": guide.published_at,
    "dateModified": guide.published_at,
    "author": {
      "@type": "Person",
      "name": authorName,
    },
    "publisher": {
      "@type": "Organization",
      "name": "GTA 6 Hub",
      "logo": {
        "@type": "ImageObject",
        "url": `${process.env.NEXT_PUBLIC_SITE_URL || "https://gta6-hub.vercel.app"}/logo.png`
      }
    }
  }

  let faqSchema: any = null
  if (Array.isArray(guide.faq) && guide.faq.length > 0) {
    faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": guide.faq.map((item: any) => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    }
  }

  // Inject AdSense ads into content if publisher ID is set
  const guideContentWithAds = injectAdSenseAds(guide.content, publisherId)

  // Parse Affiliate Links in content
  const { parsedContent: guideContentWithAffiliate, hasAffiliate } = parseAffiliateLinks(guideContentWithAds)

  // Calculate read time based on word_count
  const readTime = Math.max(1, Math.ceil((guide.word_count || 1) / 200))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow space-y-8">
      {/* Google AdSense Initializer */}
      <AdSenseInitializer publisherId={publisherId} />

      {/* JSON-LD Structured Data */}
      <JsonLd data={articleSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-1 sm:space-x-2 text-xs font-bold uppercase tracking-wider text-foreground/40 overflow-x-auto whitespace-nowrap pb-2">
        <Link href="/" className="hover:text-neon-blue transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 flex-shrink-0" />
        <Link href="/guides" className="hover:text-neon-blue transition-colors">
          Guides
        </Link>
        <ChevronRight className="w-3 h-3 flex-shrink-0" />
        <Link href={`/guides/${params.category}`} className="hover:text-neon-blue transition-colors">
          {guide.guide_category}
        </Link>
        <ChevronRight className="w-3 h-3 flex-shrink-0" />
        <span className="text-foreground/80 truncate max-w-[200px] sm:max-w-xs">
          {guide.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Guide Article Column */}
        <main className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-neon-blue bg-neon-blue/10 border border-neon-blue/25 rounded-md px-2.5 py-1">
                {guide.guide_category}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest rounded-md px-2.5 py-1 ${
                guide.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" :
                guide.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-400 border border-amber-500/25" :
                "bg-rose-500/10 text-rose-400 border border-rose-500/25"
              }`}>
                {guide.difficulty}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              {guide.title}
            </h1>

            {/* Metadata Section */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-bold uppercase tracking-wider text-foreground/50 border-y border-card-border/60 py-3">
              <span>By {authorName}</span>
              <span className="text-foreground/20">|</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-neon-blue" />
                {formatDate(guide.published_at)}
              </span>
              <span className="text-foreground/20">|</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-neon-blue" />
                {readTime} Min Read ({guide.word_count} words)
              </span>
              <span className="text-foreground/20">|</span>
              <SaveGameButton
                slug={guide.slug}
                title={guide.title}
                type="guide"
                categoryName={guide.guide_category}
                categorySlug={params.category}
              />
            </div>
          </div>

          {/* Featured Image */}
          <div className="relative w-full h-[260px] sm:h-[420px] rounded-xl overflow-hidden shadow-2xl border border-card-border">
            <Image
              src={getImageUrl(guide.featured_image)}
              alt={guide.title}
              fill
              className="object-cover"
              priority
              sizes="(max-w-1024px) 100vw, 70vw"
            />
          </div>

          {/* Affiliate Disclosure Notice */}
          {hasAffiliate && (
            <div className="bg-neon-blue/10 border border-neon-blue/20 p-4 rounded-xl text-xs text-foreground/80 flex items-start space-x-2.5 leading-relaxed">
              <span className="text-base flex-shrink-0">🛍️</span>
              <p>
                <strong className="text-white font-bold">Disclosure:</strong> This page contains affiliate links. If you make a purchase through them, we may earn a small commission at no extra cost to you.
              </p>
            </div>
          )}

          {/* Guide Content with spoiler clicks & step numbers */}
          <GuideContentRenderer content={guideContentWithAffiliate} />
        </main>

        {/* Sidebar Column (with sticky table of contents) */}
        <aside className="lg:col-span-4 space-y-6">
          <Link
            href={`/guides/${params.category}`}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neon-blue hover:underline bg-neon-blue/5 border border-neon-blue/20 rounded-lg px-4 py-2.5 w-full justify-center transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" /> Back To {guide.guide_category}
          </Link>

          {/* AdSense Sidebar Slot */}
          {publisherId && (
            <div className="bg-card-bg border border-card-border rounded-xl p-6 shadow-md space-y-2">
              <span className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest block text-center mb-1">
                Advertisement
              </span>
              <ins className="adsbygoogle"
                   style={{ display: "block" }}
                   data-ad-client={publisherId}
                   data-ad-slot="5555555555"
                   data-ad-format="auto"
                   data-full-width-responsive="true"></ins>
            </div>
          )}

          {/* Table of Contents Widget */}
          <GuideToc toc={(guide.toc || []) as any[]} />
        </aside>
      </div>
    </div>
  )
}
