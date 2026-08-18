import React from "react"
import Link from "next/link"
import Image from "next/image"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { ArrowRight, ShieldCheck, HelpCircle, ShieldAlert } from "lucide-react"
import CountdownTimer from "@/components/CountdownTimer"
import ScrollReveal from "@/components/ScrollReveal"
import SiteDepthIndex from "@/components/SiteDepthIndex"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import CategoryBadge from "@/components/ui/CategoryBadge"
import Badge from "@/components/ui/Badge"
import JsonLd from "@/components/JsonLd"

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

export default async function HomePage() {
  const isDummy = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy-supabase-url.supabase.co")

  let settings: Record<string, string> = {
    countdown_target: "2026-11-19T00:00:00-05:00",
    social_twitter: "https://twitter.com",
    social_reddit: "https://reddit.com",
    social_discord: "https://discord.com",
    social_youtube: "https://youtube.com",
  }
  let latestTeaser: any = null
  let featuredArticle: any = null
  let latestNews: any[] = []
  let sidebarArticles: any[] = []
  let newsCount: number | null = null
  let cheatsCount: number | null = null
  let loreCount: number | null = null

  let confirmedCount = 0
  let rumorCount = 0
  let debunkedCount = 0

  if (!isDummy) {
    try {
      const supabase = createSupabaseServerClient()

      // Fetch categories map for safe resolving
      const { data: categories, error: catErr } = await supabase
        .from("categories")
        .select("id, name, slug")

      if (catErr) {
        console.error("[HomePage Fetch Categories Error]:", catErr)
      }

      const resolveCategory = (catVal?: string | null) => {
        if (!catVal) return null
        const match = (categories || []).find((c) => c.id === catVal || c.slug === catVal)
        return match || { id: catVal, name: catVal, slug: catVal.toLowerCase().replace(/\s+/g, "-") }
      }

      // Fetch Site Depth Index counts safely
      try {
        const { count: artCount, error: artCountErr } = await supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("status", "published")

        if (artCountErr) console.error("[HomePage Article Count Error]:", artCountErr)
        newsCount = artCount
      } catch (e) {
        console.error("Error counting articles:", e)
      }

      try {
        const { count: chCount, error: chCountErr } = await supabase
          .from("cheat_codes")
          .select("id", { count: "exact", head: true })

        if (chCountErr) console.error("[HomePage Cheats Count Error]:", chCountErr)
        cheatsCount = chCount
      } catch (e) {
        console.error("Error counting cheats:", e)
      }

      try {
        const { count: charCount, error: charCountErr } = await supabase
          .from("characters")
          .select("id", { count: "exact", head: true })
          .eq("status", "published")

        if (charCountErr) console.error("[HomePage Character Count Error]:", charCountErr)

        const { count: topicCount, error: topicCountErr } = await supabase
          .from("lore_topics")
          .select("id", { count: "exact", head: true })

        if (topicCountErr) console.error("[HomePage Lore Topics Count Error]:", topicCountErr)

        loreCount = (charCount || 0) + (topicCount || 0)
      } catch (e) {
        console.error("Error counting lore characters/topics:", e)
      }

      // Real-time rumor_status counts directly from articles table
      try {
        const [confRes, rumorRes, debRes] = await Promise.all([
          supabase
            .from("articles")
            .select("id", { count: "exact", head: true })
            .eq("status", "published")
            .eq("rumor_status", "confirmed"),
          supabase
            .from("articles")
            .select("id", { count: "exact", head: true })
            .eq("status", "published")
            .eq("rumor_status", "rumor"),
          supabase
            .from("articles")
            .select("id", { count: "exact", head: true })
            .eq("status", "published")
            .eq("rumor_status", "debunked"),
        ])

        confirmedCount = confRes.count || 0
        rumorCount = rumorRes.count || 0
        debunkedCount = debRes.count || 0
      } catch (e) {
        console.error("Error counting rumor_status fields:", e)
      }

      // 1. Fetch site settings
      const { data: rawSettings, error: settingsError } = await supabase
        .from("site_settings")
        .select("key, value")

      if (settingsError) {
        console.error("[HomePage Site Settings Error]:", settingsError)
      }

      if (rawSettings) {
        settings = rawSettings.reduce((acc, curr) => {
          acc[curr.key] = curr.value
          return acc
        }, {} as Record<string, string>)
      }

      // 2. Fetch latest news teaser
      const { data: teaser, error: teaserError } = await supabase
        .from("articles")
        .select("id, title, slug")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (teaserError) {
        console.error("[HomePage Teaser Error]:", teaserError)
      }

      latestTeaser = teaser

      // 3. Fetch featured article
      let { data: featured, error: featuredError } = await supabase
        .from("articles")
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image,
          published_at,
          category
        `)
        .eq("status", "published")
        .eq("featured", true)
        .maybeSingle()

      if (featuredError) {
        console.error("[HomePage Featured Article Error]:", featuredError)
      }

      if (!featured) {
        const { data: fallbackArt, error: fallbackArtError } = await supabase
          .from("articles")
          .select(`
            id,
            title,
            slug,
            excerpt,
            featured_image,
            published_at,
            category
          `)
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (fallbackArtError) {
          console.error("[HomePage Fallback Featured Article Error]:", fallbackArtError)
        }

        featured = fallbackArt
      }

      if (featured) {
        featuredArticle = {
          ...featured,
          category: resolveCategory(featured.category),
        }
      }

      // 4. Fetch latest news grid (3 published articles)
      const { data: news, error: newsError } = await supabase
        .from("articles")
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image,
          published_at,
          category
        `)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3)

      if (newsError) {
        console.error("[HomePage Latest News Query Error]:", newsError)
      }

      latestNews = (news || []).map((n) => ({
        ...n,
        category: resolveCategory(n.category),
      }))

      // 5. Fetch 5 most recent articles for sidebar
      const { data: sidebarArts, error: sidebarArtsError } = await supabase
        .from("articles")
        .select("id, title, slug, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(5)

      if (sidebarArtsError) {
        console.error("[HomePage Sidebar Articles Error]:", sidebarArtsError)
      }

      sidebarArticles = sidebarArts || []
    } catch (err) {
      console.error("Failed to query Supabase server side:", err)
    }
  } else {
    // Fallback mock counts for dummy/disconnected mode
    confirmedCount = 12
    rumorCount = 18
    debunkedCount = 5

    latestTeaser = {
      title: "Rockstar Games confirms GTA VI development target on schedule",
      slug: "development-target-on-schedule",
    }

    featuredArticle = {
      title: "Vice City Next-Gen: Exploring the state of Leonida",
      slug: "exploring-state-of-leonida",
      excerpt: "Deep dive into the massive open world mapping, from neon-lit Vice City beaches to muddy Grassland trails. Get ready to cruise through the stunning, meticulously designed digital recreation of Florida.",
      featured_image: "/og-image.jpg",
      published_at: new Date().toISOString(),
      category: { name: "Announcements", slug: "announcements" },
    }

    latestNews = [
      {
        id: "m1",
        title: "Lucia and Jason: A breakdown of the dual protagonist system",
        slug: "dual-protagonist-system",
        excerpt: "Analyzing character switching, shared inventories, and cooperative heist mechanics.",
        featured_image: "/og-image.jpg",
        published_at: new Date().toISOString(),
        category: { name: "Leaked Systems", slug: "leaked-systems" },
      },
      {
        id: "m2",
        title: "Official Trailer 1 hits 200 million views on YouTube",
        slug: "trailer-hits-200-million",
        excerpt: "How fans are discovering hidden details in every single frame of the record-breaking trailer.",
        featured_image: "/og-image.jpg",
        published_at: new Date().toISOString(),
        category: { name: "Community", slug: "community" },
      },
      {
        id: "m3",
        title: "Dynamic weather patterns and storm physics detailed",
        slug: "dynamic-weather-patterns",
        excerpt: "How hurricanes, lightning strikes, and tidal waves will affect driving and mission tactics.",
        featured_image: "/og-image.jpg",
        published_at: new Date().toISOString(),
        category: { name: "Leaks", slug: "leaks" },
      },
    ]

    cheatsCount = 15

    sidebarArticles = [
      { id: "s1", title: "GTA VI confirmed for Fall 2025 release window", slug: "fall-2025-release-window", published_at: new Date().toISOString() },
      { id: "s2", title: "New police dispatch and AI pursuit routines analyzed", slug: "police-dispatch-ai", published_at: new Date().toISOString() },
    ]
  }

  const totalRumorStatusCount = confirmedCount + rumorCount + debunkedCount
  const countdownTarget = settings["countdown_target"] || "2026-11-19T00:00:00-05:00"

  // Only duplicate items for continuous marquee animation if there are multiple distinct articles
  const tickerItems =
    latestNews && latestNews.length > 1
      ? [...latestNews, ...latestNews]
      : latestNews || []

  const gridNews = latestNews || []

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gta6-hub-liard.vercel.app"

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    "name": "GTA 6 Hub",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "description": "The ultimate independent fan ecosystem, database, and telemetry hub for Grand Theft Auto VI.",
    "foundingDate": "2024",
    "founder": {
      "@type": "Person",
      "@id": `${siteUrl}/author#person`,
      "name": "Ahmad Khan",
      "url": `${siteUrl}/author`
    },
    "sameAs": [
      "https://github.com/ahmad-461",
      "https://www.linkedin.com/in/ahmad-khan-77441833a"
    ]
  }

  return (
    <div className="flex-grow flex flex-col relative bg-[#0B0710] overflow-hidden text-[#F5F0FA]">
      <JsonLd data={orgSchema} />
      {/* Cinematic Global Noise Texture */}
      <div className="film-grain" />

      {/* Background Atmosphere - Polished to feel restrained and premium with reduced opacity */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Glow Blob 1 (magenta top-right) */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#FF2E88]/05 blur-[140px] z-0" />
        {/* Glow Blob 2 (cyan bottom-left) */}
        <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#00E5FF]/04 blur-[140px] z-0" />
      </div>

      {/* Hero Section */}
      <section
        className="relative min-h-[90vh] flex items-center pt-20 pb-32 px-4 sm:px-6 lg:px-12 overflow-hidden bg-[#0B0710] z-10 border-b border-[rgba(245,240,250,0.14)]"
        style={{
          clipPath: "polygon(0 0, 100% 0, 100% 93%, 0 100%)",
        }}
      >
        {/* Mobile horizontal watermark, centered behind hero text */}
        <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0 overflow-hidden lg:hidden">
          <span className="font-anton text-[11rem] sm:text-[16rem] uppercase leading-none tracking-tighter opacity-[0.02] bg-gradient-to-r from-[#F5F0FA] to-[#FF2E88] bg-clip-text text-transparent">
            VICE
          </span>
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Asymmetric Left Column */}
          <div className="lg:col-span-7 space-y-8 text-left">
            {/* Small mono eyebrow label with a horizontal rule accent */}
            <div className="flex items-center space-x-3 font-mono text-xs text-[#9C8FAE] tracking-widest uppercase">
              <span>UNOFFICIAL INTEL — EST. 2026</span>
              <span className="h-[1px] w-12 bg-[#FF2E88]"></span>
            </div>

            {/* Headline Block */}
            <div className="space-y-1">
              <span className="block text-[#F5F0FA] text-lg sm:text-2xl font-mono tracking-wide">
                The Ultimate
              </span>
              <h1 className="text-6xl sm:text-8xl lg:text-[7.5rem] font-anton font-bold uppercase tracking-tighter leading-[0.92] text-[#F5F0FA]">
                GTA VI
              </h1>
              <span className="block text-4xl sm:text-6xl lg:text-7xl font-anton uppercase tracking-tight bg-gradient-to-r from-[#FF2E88] to-[#00E5FF] bg-clip-text text-transparent leading-[0.92]">
                INTELLIGENCE HUB
              </span>
            </div>

            {/* Supporting Paragraph */}
            <p className="text-base sm:text-lg text-[#9C8FAE] max-w-xl leading-relaxed font-normal">
              The premier hyper-focused fan ecosystem for Grand Theft Auto VI. Access immediate walkthroughs, real-time database lookups, and deep lore map tracing.
            </p>

            {/* Editorial Voice Moment */}
            <div className="pl-4 border-l-2 border-[#FF2E88] max-w-xl space-y-1">
              <span className="block font-mono text-[10px] tracking-widest text-[#FF2E88] uppercase font-bold">
                OUR COVENANT / EDITORIAL CRITERIA
              </span>
              <p className="text-sm text-[#F5F0FA] leading-relaxed font-normal">
                Unlike mass-media outlets chasing algorithmic clicks, GTA 6 Hub is built on raw, verified telemetry and meticulous database indexing. We do not deal in baseless speculation. Our mission is to trace every coordinate of Leonida and map its narrative architecture with zero filler—providing the community with a high-fidelity intelligence layer they can actually trust.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/news" passHref legacyBehavior>
                <Button variant="primary" size="lg">
                  Latest Intelligence
                </Button>
              </Link>
              <Link href="/map" passHref legacyBehavior>
                <Button variant="ghost" size="lg">
                  Explore Leonida
                </Button>
              </Link>
            </div>

            {/* AI Investigator Highlight Link */}
            <div className="flex items-center space-x-2 text-xs font-mono pt-1">
              <span className="text-neon-pink">★</span>
              <span className="text-[#9C8FAE]">ARCHIVE ACCESS MODE:</span>
              <Link
                href="/investigate"
                className="text-[#00E5FF] hover:underline font-bold uppercase tracking-wider flex items-center gap-1 group"
              >
                Query the AI Investigator RAG
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* HUD Countdown Module using Part A Console Card primitive */}
            <Card variant="console" padding="md" showCornerBrackets className="max-w-lg mt-8">
              {/* Pulsing dot + label row */}
              <div className="flex items-center space-x-2 mb-4 font-mono text-[10px] tracking-widest text-cyan">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75 animate-duration-1000"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan"></span>
                </span>
                <span>SYSTEM COUNTDOWN TELEMETRY</span>
              </div>

              {/* Countdown Numbers */}
              <CountdownTimer targetDate={countdownTarget} />
            </Card>
          </div>

          {/* Right Column: Atmospheric vertical text watermark */}
          <div className="lg:col-span-5 flex justify-end h-full relative min-h-[300px] lg:min-h-[500px] hidden lg:flex">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 select-none pointer-events-none z-0">
              <span
                className="font-anton text-[12rem] lg:text-[18rem] uppercase leading-none tracking-tighter opacity-[0.05] bg-gradient-to-b from-[#F5F0FA] to-[#FF2E88] bg-clip-text text-transparent"
                style={{
                  writingMode: "vertical-rl",
                }}
              >
                VICE
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Auto-scrolling Ticker Strip */}
      {tickerItems.length > 0 && (
        <div className="w-full bg-[#150C1F] border-t border-b border-[rgba(245,240,250,0.14)] py-3 overflow-hidden z-20 relative">
          <div className="ticker-marquee whitespace-nowrap flex items-center">
            {tickerItems.map((item, index) => (
              <div key={index} className="inline-flex items-center mx-8 font-mono text-xs text-[#9C8FAE] tracking-wider">
                <span className="inline-block w-2 h-2 bg-[#FF2E88] rounded-full mr-3 animate-pulse" />
                <span className="text-[#00E5FF] font-bold mr-2">LATEST INTEL:</span>
                <Link href={`/news/${item.slug}`} className="hover:text-white transition-colors underline decoration-dotted">
                  {item.title}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Editorial Content Area */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-16 space-y-24 z-10 relative">
        {/* Latest Content Grid Section */}
        <section className="space-y-10">
          <ScrollReveal>
            <div className="flex items-end justify-between border-b border-[rgba(245,240,250,0.14)] pb-4">
              <div className="space-y-1">
                <span className="text-xs font-bold font-mono text-[#FF2E88] uppercase tracking-widest">
                  Hot Off The Press
                </span>
                <h2 className="text-3xl sm:text-4xl font-anton uppercase tracking-normal text-[#F5F0FA]">
                  Latest Intel
                </h2>
              </div>
              <Link
                href="/news"
                className="text-xs font-bold font-mono text-[#00E5FF] hover:underline uppercase tracking-wider flex items-center gap-1.5"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </ScrollReveal>

          {gridNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {gridNews.map((art, index) => (
                <ScrollReveal key={art.id} style={{ transitionDelay: `${index * 100}ms` }}>
                  <Card
                    padding="none"
                    variant="standard"
                    hoverGlow="magenta"
                    interactive
                    className="group flex flex-col justify-between h-full shadow-lg"
                  >
                    <div>
                      <div className="relative w-full h-52 overflow-hidden bg-[#0B0710]">
                        <Image
                          src={getImageUrl(art.featured_image)}
                          alt={art.title}
                          fill
                          className="object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out motion-reduce:group-hover:scale-100"
                          sizes="(max-w-768px) 100vw, (max-w-1200px) 50vw, 30vw"
                        />
                      </div>
                      <div className="p-6 space-y-3">
                        {art.category && (
                          <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#00E5FF]">
                            {(art.category as any).name}
                          </span>
                        )}
                        <h4 className="text-lg font-bold text-[#F5F0FA] group-hover:text-[#FF2E88] transition-colors line-clamp-2 leading-snug">
                          <Link href={`/news/${art.slug}`}>{art.title}</Link>
                        </h4>
                        <p className="text-sm text-[#9C8FAE] leading-relaxed line-clamp-3">
                          {art.excerpt}
                        </p>
                      </div>
                    </div>
                    <div className="p-6 pt-0 mt-4 flex items-center justify-between text-[10px] text-[#9C8FAE]/60 font-mono tracking-widest uppercase">
                      <span>{formatDate(art.published_at)}</span>
                      <Link href={`/news/${art.slug}`} className="text-[#FF2E88] hover:underline font-bold flex items-center gap-1">
                        READ <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center border border-dashed border-[rgba(245,240,250,0.14)] rounded text-[#9C8FAE] text-sm font-mono space-y-2 max-w-xl mx-auto">
              <p className="font-bold text-white uppercase tracking-widest text-sm">AWAITING INTEL FEED TRANSMISSION</p>
              <p className="text-xs text-[#9C8FAE]/80 leading-relaxed">No published news items located in local telemetry registers. (Note: Homepage population depends on Phase 14&apos;s seed.sql database seeding script being executed).</p>
            </div>
          )}
        </section>


        {/* Asymmetrical Staggered Segment: Intel Confidence Snapshot & Quick Updates */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pt-6">

          {/* Asymmetrical Column 1: Intel Confidence Snapshot */}
          <div className="lg:col-span-7 space-y-8">
            <ScrollReveal>
              <Card variant="standard" padding="lg" showCornerBrackets className="space-y-6">
                {/* Header Copy */}
                <div className="space-y-1.5 border-b border-[rgba(245,245,247,0.14)] pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold font-mono text-[#FF8A3D] uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF8A3D] animate-pulse inline-block" />
                      INTEL CONFIDENCE
                    </span>
                    <span className="text-[10px] font-mono text-[#9E9EA8] uppercase tracking-wider">
                      LIVE TELEMETRY
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-anton uppercase text-[#F5F5F7] tracking-wide leading-tight">
                    INTEL CONFIDENCE
                  </h3>
                  <p className="text-xs font-mono text-[#9E9EA8] leading-relaxed">
                    Live breakdown of confirmed vs. speculative coverage
                  </p>
                </div>

                {/* Horizontal Segmented Bar & Telemetry Status */}
                {totalRumorStatusCount > 0 ? (
                  <div className="space-y-4">
                    <div className="h-4 w-full bg-[#0B0B0F] border border-[rgba(245,245,247,0.14)] rounded-full overflow-hidden flex p-0.5 shadow-inner">
                      {confirmedCount > 0 && (
                        <div
                          style={{ width: `${(confirmedCount / totalRumorStatusCount) * 100}%` }}
                          className="h-full bg-emerald-500 transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                          title={`Confirmed: ${confirmedCount}`}
                        />
                      )}
                      {rumorCount > 0 && (
                        <div
                          style={{ width: `${(rumorCount / totalRumorStatusCount) * 100}%` }}
                          className="h-full bg-amber-500 transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                          title={`Unverified Rumors: ${rumorCount}`}
                        />
                      )}
                      {debunkedCount > 0 && (
                        <div
                          style={{ width: `${(debunkedCount / totalRumorStatusCount) * 100}%` }}
                          className="h-full bg-rose-500 transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                          title={`Debunked: ${debunkedCount}`}
                        />
                      )}
                    </div>

                    {/* Raw Counts Labels */}
                    <div className="grid grid-cols-3 gap-3 font-mono text-center">
                      <div className="p-3 rounded bg-[#0B0B0F] border border-emerald-500/25 space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Confirmed
                        </div>
                        <div className="text-2xl font-black text-white">{confirmedCount}</div>
                        <div className="text-[10px] text-[#9E9EA8]">
                          {`${Math.round((confirmedCount / totalRumorStatusCount) * 100)}%`}
                        </div>
                      </div>

                      <div className="p-3 rounded bg-[#0B0B0F] border border-amber-500/25 space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Rumor
                        </div>
                        <div className="text-2xl font-black text-white">{rumorCount}</div>
                        <div className="text-[10px] text-[#9E9EA8]">
                          {`${Math.round((rumorCount / totalRumorStatusCount) * 100)}%`}
                        </div>
                      </div>

                      <div className="p-3 rounded bg-[#0B0B0F] border border-rose-500/25 space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Debunked
                        </div>
                        <div className="text-2xl font-black text-white">{debunkedCount}</div>
                        <div className="text-[10px] text-[#9E9EA8]">
                          {`${Math.round((debunkedCount / totalRumorStatusCount) * 100)}%`}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded bg-[#0B0B0F]/60 border border-dashed border-[rgba(245,245,247,0.14)] text-center font-mono space-y-2">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">
                      CONFIDENCE TELEMETRY OFFLINE
                    </p>
                    <p className="text-[11px] text-[#9E9EA8] leading-relaxed max-w-md mx-auto">
                      Confidence tracking will populate as more intel is verified across Leonida report registries.
                    </p>
                  </div>
                )}

                {/* Footer Link to /intelligence */}
                <div className="pt-2 border-t border-[rgba(245,245,247,0.14)] flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] font-mono text-[#9E9EA8] uppercase tracking-wider">
                    TOTAL LOGGED REPORTS: <strong className="text-white font-bold">{totalRumorStatusCount}</strong>
                  </span>
                  <Link
                    href="/intelligence"
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#FF8A3D] hover:text-[#FF2D8D] uppercase tracking-wider transition-colors"
                  >
                    View Intelligence Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </Card>
            </ScrollReveal>
          </div>

          {/* Asymmetrical Column 2: Recent Updates List */}
          <div className="lg:col-span-5 space-y-8">
            <ScrollReveal>
              <Card variant="standard" padding="lg" className="space-y-6">
                <h4 className="font-bold text-xs font-mono uppercase tracking-widest text-[#9C8FAE] border-b border-[rgba(245,240,250,0.1)] pb-4">
                  Quick Updates
                </h4>
                {sidebarArticles && sidebarArticles.length > 0 ? (
                  <ul className="space-y-4">
                    {sidebarArticles.map((art) => (
                      <li key={art.id} className="group text-sm pb-3 border-b border-[rgba(245,240,250,0.1)] last:border-0 last:pb-0">
                        <Link
                          href={`/news/${art.slug}`}
                          className="font-bold text-[#F5F0FA] group-hover:text-[#FF2E88] transition-colors line-clamp-2 leading-snug"
                        >
                          {art.title}
                        </Link>
                        <span className="text-[10px] font-mono text-[#9C8FAE]/60 font-bold block mt-1 uppercase tracking-widest">
                          {formatDate(art.published_at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs font-mono text-[#9C8FAE]">No recent updates.</p>
                )}
              </Card>
            </ScrollReveal>
          </div>
        </section>

        {/* Site Depth Index Section */}
        <ScrollReveal>
          <SiteDepthIndex
            newsCount={newsCount}
            cheatsCount={cheatsCount}
            loreCount={loreCount}
          />
        </ScrollReveal>
      </div>
    </div>
  )
}
