import React from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Calendar, Clock, ChevronRight, ArrowLeft } from "lucide-react"
import PageBanner from "@/components/PageBanner"
import GuideToc from "@/components/GuideToc"
import GuideContentRenderer from "@/components/GuideContentRenderer"
import JsonLd from "@/components/JsonLd"
import AdSenseInitializer from "@/components/AdSenseInitializer"
import CategoryBadge, { getCategoryConfig } from "@/components/ui/CategoryBadge"
import Badge from "@/components/ui/Badge"
import GuideCard, { GuideCardItem } from "@/components/GuideCard"
import FaqAccordion, { FaqItem } from "@/components/FaqAccordion"
import { injectAdSenseAds } from "@/lib/adsense"
import { parseAffiliateLinks } from "@/lib/affiliate"

export const revalidate = 3600

interface GuidePageProps {
  params: {
    category: string
    slug: string
  }
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
    },
  }
}

function formatDate(dateStr?: string | null) {
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
  const catConfig = getCategoryConfig(params.category)
  if (!catConfig) {
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
      updated_at,
      author_id,
      seo_title,
      seo_description,
      faq
    `)
    .eq("slug", params.slug)
    .eq("guide_category", catConfig.name)
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

  // Related Guides Query (Same category first, fill up to 3 with latest published overall)
  const { data: sameCatGuides } = await supabase
    .from("guides")
    .select("id, title, slug, guide_category, difficulty, excerpt, featured_image, published_at, updated_at")
    .eq("guide_category", catConfig.name)
    .eq("status", "published")
    .neq("id", guide.id)
    .order("published_at", { ascending: false })
    .limit(3)

  let relatedGuides: GuideCardItem[] = sameCatGuides || []

  if (relatedGuides.length < 3) {
    const existingIds = [guide.id, ...relatedGuides.map((g) => g.id)]
    const { data: fallbackGuides } = await supabase
      .from("guides")
      .select("id, title, slug, guide_category, difficulty, excerpt, featured_image, published_at, updated_at")
      .eq("status", "published")
      .not("id", "in", `(${existingIds.join(",")})`)
      .order("published_at", { ascending: false })
      .limit(3 - relatedGuides.length)

    if (fallbackGuides) {
      relatedGuides = [...relatedGuides, ...fallbackGuides]
    }
  }

  // Construct JSON-LD Structured Schemas
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: guide.title,
    description: guide.seo_description || `Expert walkthrough and strategies for ${guide.title} on GTA VI Hub.`,
    image: getImageUrl(guide.featured_image),
    datePublished: guide.published_at,
    dateModified: guide.updated_at || guide.published_at,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "GTA 6 Hub",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://gta6-hub-liard.vercel.app"}/logo.png`,
      },
    },
  }

  const faqItems: FaqItem[] = Array.isArray(guide.faq) ? (guide.faq as FaqItem[]) : []
  let faqSchema: any = null
  if (faqItems.length > 0) {
    faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    }
  }

  // Inject AdSense ads into content if publisher ID is set
  const guideContentWithAds = injectAdSenseAds(guide.content, publisherId)

  // Parse Affiliate Links in content
  const { parsedContent: guideContentWithAffiliate, hasAffiliate } = parseAffiliateLinks(guideContentWithAds)

  // Calculate read time based on word_count
  const readTime = Math.max(1, Math.ceil((guide.word_count || 1) / 200))

  const difficultyBadgeColor =
    guide.difficulty === "Beginner"
      ? "green"
      : guide.difficulty === "Intermediate"
      ? "yellow"
      : "magenta"

  return (
    <div className="w-full flex-grow flex flex-col space-y-6 pb-12">
      {/* Mini-Hero Page Banner (Phase 15) */}
      <PageBanner pathname={`/guides/${catConfig.slug}/${params.slug}`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        {/* Google AdSense Initializer */}
        <AdSenseInitializer publisherId={publisherId} />

        {/* JSON-LD Structured Data */}
        <JsonLd data={articleSchema} />
        {faqSchema && <JsonLd data={faqSchema} />}

        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 text-xs font-mono font-bold uppercase tracking-wider text-[#9E9EA8] overflow-x-auto whitespace-nowrap pb-2">
          <Link href="/" className="hover:text-[#FF8A3D] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 flex-shrink-0 text-[#9E9EA8]/50" />
          <Link href="/guides" className="hover:text-[#FF8A3D] transition-colors">
            Guides
          </Link>
          <ChevronRight className="w-3 h-3 flex-shrink-0 text-[#9E9EA8]/50" />
          <Link href={`/guides/${catConfig.slug}`} className="hover:text-[#FF8A3D] transition-colors">
            {guide.guide_category}
          </Link>
          <ChevronRight className="w-3 h-3 flex-shrink-0 text-[#9E9EA8]/50" />
          <span className="text-[#F5F5F7] truncate max-w-[200px] sm:max-w-xs">
            {guide.title}
          </span>
        </nav>

        {/* Clean Image-Above-Content Hero Layout */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={guide.guide_category} size="md" variant="subtle" />
              {guide.difficulty && (
                <Badge color={difficultyBadgeColor} variant="filled">
                  {guide.difficulty}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-anton uppercase text-[#F5F5F7] leading-[1.05] tracking-wide">
              {guide.title}
            </h1>

            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-mono font-bold uppercase tracking-wider text-[#9E9EA8] border-y border-[rgba(245,245,247,0.14)] py-3">
              <span>By {authorName}</span>
              <span className="text-[rgba(245,245,247,0.2)]">|</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#FF8A3D]" />
                Last Verified: {formatDate(guide.updated_at || guide.published_at)}
              </span>
              <span className="text-[rgba(245,245,247,0.2)]">|</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#FF8A3D]" />
                {readTime} Min Read ({guide.word_count || 0} words)
              </span>
            </div>
          </div>

          {/* Full-width High-Res Featured Image */}
          <div className="relative w-full h-[280px] sm:h-[450px] lg:h-[500px] rounded-xl overflow-hidden shadow-2xl border border-[rgba(245,245,247,0.14)] bg-[#16161B]">
            <Image
              src={getImageUrl(guide.featured_image)}
              alt={guide.title}
              fill
              quality={90}
              className="object-cover"
              priority
              sizes="(max-width: 1280px) 100vw, 1200px"
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Article Body Column */}
          <main className="lg:col-span-8 space-y-8">
            {/* Affiliate Disclosure Notice */}
            {hasAffiliate && (
              <div className="bg-[#FF8A3D]/10 border border-[#FF8A3D]/25 p-4 rounded-xl text-xs font-mono text-[#F5F5F7] flex items-start space-x-2.5 leading-relaxed">
                <span className="text-base flex-shrink-0">🛍️</span>
                <p>
                  <strong className="text-[#FF8A3D] font-bold">Disclosure:</strong> This page contains affiliate links. If you make a purchase through them, we may earn a small commission at no extra cost to you.
                </p>
              </div>
            )}

            {/* Guide Body Content with H2 Step Numbers & Spoiler mark clicks */}
            <GuideContentRenderer content={guideContentWithAffiliate} />

            {/* FAQ Accordion Section (Only rendered if faq has entries) */}
            <FaqAccordion items={faqItems} />

            {/* Related Guides Section */}
            {relatedGuides.length > 0 && (
              <section className="space-y-4 pt-8 border-t border-[rgba(245,245,247,0.14)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-anton uppercase text-[#F5F5F7] tracking-wide">
                    Related Strategy Guides
                  </h2>
                  <Link
                    href={`/guides/${catConfig.slug}`}
                    className="text-xs font-mono font-bold uppercase text-[#FF8A3D] hover:underline"
                  >
                    View All {guide.guide_category} &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedGuides.map((relGuide) => (
                    <GuideCard key={relGuide.id} guide={relGuide} />
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* Sidebar Column (with sticky table of contents) */}
          <aside className="lg:col-span-4 space-y-6">
            <Link
              href={`/guides/${catConfig.slug}`}
              className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#FF8A3D] hover:text-[#FF2D8D] bg-[#16161B] border border-[rgba(245,245,247,0.14)] hover:border-[#FF8A3D]/40 rounded-lg px-4 py-3 w-full justify-center transition-all duration-200 shadow-md"
            >
              <ArrowLeft className="w-4 h-4" /> Back To {guide.guide_category}
            </Link>

            {/* AdSense Sidebar Slot */}
            {publisherId && (
              <div className="bg-[#16161B] border border-[rgba(245,245,247,0.14)] rounded-xl p-6 shadow-md space-y-2">
                <span className="text-[9px] font-mono font-bold text-[#9E9EA8]/50 uppercase tracking-widest block text-center mb-1">
                  Advertisement
                </span>
                <ins
                  className="adsbygoogle"
                  style={{ display: "block" }}
                  data-ad-client={publisherId}
                  data-ad-slot="5555555555"
                  data-ad-format="auto"
                  data-full-width-responsive="true"
                ></ins>
              </div>
            )}

            {/* Sticky Table of Contents Widget */}
            <GuideToc toc={(guide.toc || []) as any[]} />
          </aside>
        </div>
      </div>
    </div>
  )
}
