import React from "react"
import Link from "next/link"
import Image from "next/image"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { ArrowRight } from "lucide-react"
import CountdownTimer from "@/components/CountdownTimer"
import CommunityPollWidget from "@/components/CommunityPollWidget"
import ScrollReveal from "@/components/ScrollReveal"
import SiteDepthIndex from "@/components/SiteDepthIndex"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"

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
  let latestGuides: any[] = []
  let sidebarArticles: any[] = []
  let sidebarComments: any[] = []
  let activePoll: any = null
  let newsCount: number | null = null
  let guidesCount: number | null = null
  let loreCount: number | null = null

  if (!isDummy) {
    try {
      const supabase = createSupabaseServerClient()

      // Fetch Site Depth Index counts safely
      try {
        const { count: artCount } = await supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("status", "published")
        newsCount = artCount
      } catch (e) {
        console.error("Error counting articles:", e)
      }

      try {
        const { count: gdCount } = await supabase
          .from("guides")
          .select("id", { count: "exact", head: true })
          .eq("status", "published")
        guidesCount = gdCount
      } catch (e) {
        console.error("Error counting guides:", e)
      }

      try {
        const { count: charCount } = await supabase
          .from("characters")
          .select("id", { count: "exact", head: true })
          .eq("status", "published")
        const { count: topicCount } = await supabase
          .from("lore_topics")
          .select("id", { count: "exact", head: true })
        loreCount = (charCount || 0) + (topicCount || 0)
      } catch (e) {
        console.error("Error counting lore characters/topics:", e)
      }

      // 1. Fetch site settings
      const { data: rawSettings } = await supabase
        .from("site_settings")
        .select("key, value")

      if (rawSettings) {
        settings = rawSettings.reduce((acc, curr) => {
          acc[curr.key] = curr.value
          return acc
        }, {} as Record<string, string>)
      }

      // 2. Fetch latest news teaser
      const { data: teaser } = await supabase
        .from("articles")
        .select("id, title, slug")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      latestTeaser = teaser

      // 3. Fetch featured article
      let { data: featured } = await supabase
        .from("articles")
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image,
          published_at,
          category:categories(name, slug)
        `)
        .eq("status", "published")
        .eq("featured", true)
        .maybeSingle()

      if (!featured) {
        const { data: fallbackArt } = await supabase
          .from("articles")
          .select(`
            id,
            title,
            slug,
            excerpt,
            featured_image,
            published_at,
            category:categories(name, slug)
          `)
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        featured = fallbackArt
      }
      featuredArticle = featured

      // 4. Fetch latest news grid (6 published articles)
      const { data: news } = await supabase
        .from("articles")
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image,
          published_at,
          category:categories(name, slug)
        `)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(6)

      latestNews = news || []

      // 5. Fetch latest guides (3 published guides)
      const { data: guides } = await supabase
        .from("guides")
        .select(`
          id,
          title,
          slug,
          guide_category,
          difficulty,
          featured_image,
          published_at
        `)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3)

      latestGuides = guides || []

      // 6. Fetch 5 most recent content items (articles/guides) for sidebar
      const { data: sidebarArts } = await supabase
        .from("articles")
        .select("id, title, slug, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(5)

      sidebarArticles = sidebarArts || []

      // 7. Fetch 5 latest approved comments for sidebar
      const { data: comments } = await supabase
        .from("comments")
        .select(`
          id,
          article_id,
          name,
          content,
          created_at,
          articles:articles(title, slug)
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(5)

      sidebarComments = comments || []

      // 8. Fetch community poll
      const { data: poll } = await supabase
        .from("polls")
        .select("id, question, options_json, votes_json")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      activePoll = poll
    } catch (err) {
      console.error("Failed to query Supabase server side:", err)
    }
  } else {
    // Set beautifully styled fallback mock data when DB is missing
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

    latestGuides = [
      {
        id: "g1",
        title: "Rookie to Kingpin: 10 essential tips for getting started",
        slug: "rookie-to-kingpin-tips",
        guide_category: "Getting Started",
        difficulty: "Beginner",
        featured_image: "/og-image.jpg",
        published_at: new Date().toISOString(),
      },
      {
        id: "g2",
        title: "Leonida Hidden Packages: All 100 location coordinates",
        slug: "hidden-packages-locations",
        guide_category: "Secrets",
        difficulty: "Advanced",
        featured_image: "/og-image.jpg",
        published_at: new Date().toISOString(),
      },
    ]

    sidebarArticles = [
      { id: "s1", title: "GTA VI confirmed for Fall 2025 release window", slug: "fall-2025-release-window", published_at: new Date().toISOString() },
      { id: "s2", title: "New police dispatch and AI pursuit routines analyzed", slug: "police-dispatch-ai", published_at: new Date().toISOString() },
    ]

    sidebarComments = [
      { id: "c1", name: "ViceCityLover", content: "Can't wait to explore the neon beaches!", created_at: new Date().toISOString() },
      { id: "c2", name: "LeonidaRacer", content: "The driving physics look incredibly realistic.", created_at: new Date().toISOString() },
    ]

    activePoll = {
      id: "poll-mock",
      question: "Which gameplay feature are you most excited for in GTA VI?",
      options_json: ["Dual Protagonist Switching", "Expanded Leonida Map", "Realistic Police AI", "Cooperative Heists"],
      votes_json: {
        "Dual Protagonist Switching": 142,
        "Expanded Leonida Map": 311,
        "Realistic Police AI": 95,
        "Cooperative Heists": 204,
      },
    }
  }

  const countdownTarget = settings["countdown_target"] || "2026-11-19T00:00:00-05:00"

  // Duplicate items for seamless continuous ticker scroll
  const tickerItems = latestNews && latestNews.length > 0 ? [...latestNews, ...latestNews] : []

  // Use up to 3 latest news articles specifically
  const gridNews = latestNews ? latestNews.slice(0, 3) : []

  return (
    <div className="flex-grow flex flex-col relative bg-[#0B0710] overflow-hidden text-[#F5F0FA]">
      {/* Cinematic Global Noise Texture */}
      <div className="film-grain" />

      {/* Background Atmosphere - Polished to feel restrained and premium with reduced opacity */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Glow Blob 1 (magenta top-right) - Reduced from bg-[#FF2E88]/10 to bg-[#FF2E88]/05 */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#FF2E88]/05 blur-[140px] z-0" />
        {/* Glow Blob 2 (cyan bottom-left) - Reduced from bg-[#00E5FF]/8 to bg-[#00E5FF]/04 */}
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

      {/* Featured Article Spotlight */}
      {featuredArticle && (
        <section
          className="relative bg-[#150C1F] border-b border-[rgba(245,240,250,0.14)] py-12 lg:py-0 overflow-hidden z-20"
          style={{
            clipPath: "polygon(0 0, 100% 0, 100% 93%, 0 100%)",
          }}
        >
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[550px] items-stretch">
              {/* Left Cinematic Image Block */}
              <div className="lg:col-span-7 relative overflow-hidden diagonal-split-left min-h-[350px] lg:min-h-full group">
                <Image
                  src={getImageUrl(featuredArticle.featured_image)}
                  alt={featuredArticle.title}
                  fill
                  className="object-cover group-hover:scale-[1.01] transition-transform duration-700 ease-out motion-reduce:group-hover:scale-100"
                  priority
                  sizes="(max-w-1024px) 100vw, 60vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#150C1F] via-[#150C1F]/40 to-transparent lg:hidden" />

                {/* Small bordered "Featured" tag overlay */}
                <div className="absolute top-6 left-6 z-30 font-mono text-[10px] tracking-widest text-[#FF2E88] bg-[#0B0710]/90 border border-[#FF2E88] px-3 py-1 uppercase rounded-sm shadow-xl">
                  Featured Article
                </div>
              </div>

              {/* Right Typographic Content Block */}
              <div className="lg:col-span-5 flex flex-col justify-center p-8 lg:p-12 space-y-6 relative z-10 bg-[#150C1F]">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold font-mono text-[#FF2E88] uppercase tracking-widest">
                    SPOTLIGHT INTEL
                  </span>
                  {featuredArticle.category && (
                    <>
                      <span className="text-[#9C8FAE] font-mono text-xs">/</span>
                      <span className="text-xs font-bold font-mono text-[#00E5FF] uppercase tracking-widest">
                        {(featuredArticle.category as any).name}
                      </span>
                    </>
                  )}
                </div>

                <h2 className="text-3xl sm:text-5xl font-anton uppercase text-[#F5F0FA] tracking-normal leading-[0.95] hover:text-[#FF2E88] transition-colors">
                  <Link href={`/news/${featuredArticle.slug}`}>
                    {featuredArticle.title}
                  </Link>
                </h2>

                <p className="text-[#9C8FAE] text-sm sm:text-base leading-relaxed line-clamp-4">
                  {featuredArticle.excerpt}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-[rgba(245,240,250,0.1)]">
                  <span className="text-[10px] text-[#9C8FAE]/60 font-mono tracking-widest uppercase">
                    PUBLISHED: {formatDate(featuredArticle.published_at)}
                  </span>
                  <Link
                    href={`/news/${featuredArticle.slug}`}
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#FF2E88] hover:underline uppercase tracking-wider font-mono"
                  >
                    READ ARTICLE <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
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
            <div className="p-12 text-center border border-dashed border-[rgba(245,240,250,0.14)] rounded text-[#9C8FAE] text-sm font-mono">
              No news items posted yet. Check back soon.
            </div>
          )}
        </section>

        {/* Dynamic Walkthroughs section */}
        <section className="space-y-10">
          <ScrollReveal>
            <div className="flex items-end justify-between border-b border-[rgba(245,240,250,0.14)] pb-4">
              <div className="space-y-1">
                <span className="text-xs font-bold font-mono text-[#00E5FF] uppercase tracking-widest">
                  Pro Walkthroughs
                </span>
                <h2 className="text-3xl sm:text-4xl font-anton uppercase tracking-normal text-[#F5F0FA]">
                  Expert Guides
                </h2>
              </div>
              <Link
                href="/guides"
                className="text-xs font-bold font-mono text-[#00E5FF] hover:underline uppercase tracking-wider flex items-center gap-1.5"
              >
                Browse All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </ScrollReveal>

          {latestGuides && latestGuides.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestGuides.map((guide, index) => (
                <ScrollReveal key={guide.id} style={{ transitionDelay: `${index * 100}ms` }}>
                  <Card
                    padding="none"
                    variant="standard"
                    hoverGlow="cyan"
                    interactive
                    className="group flex flex-col justify-between h-full shadow-lg"
                  >
                    <div>
                      <div className="relative w-full h-48 overflow-hidden bg-[#0B0710]">
                        <Image
                          src={getImageUrl(guide.featured_image)}
                          alt={guide.title}
                          fill
                          className="object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out motion-reduce:group-hover:scale-100"
                          sizes="(max-w-768px) 100vw, 30vw"
                        />
                      </div>
                      <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-bold font-mono uppercase tracking-wider">
                          <span className="text-[#FF2E88]">{guide.guide_category}</span>
                          <span className={`px-2 py-0.5 rounded ${
                            guide.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            guide.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}>
                            {guide.difficulty}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-[#F5F0FA] group-hover:text-[#00E5FF] transition-colors line-clamp-2 leading-snug">
                          <Link href={`/guides/${guide.guide_category.toLowerCase().replace(/\s+/g, "-")}/${guide.slug}`}>
                            {guide.title}
                          </Link>
                        </h4>
                      </div>
                    </div>
                    <div className="p-6 pt-0 mt-2">
                      <Link
                        href={`/guides/${guide.guide_category.toLowerCase().replace(/\s+/g, "-")}/${guide.slug}`}
                        className="block text-center w-full py-2.5 rounded bg-[#0B0710] border border-[rgba(245,240,250,0.14)] text-xs font-bold font-mono uppercase tracking-wider hover:bg-[#00E5FF]/5 hover:border-[#00E5FF] text-[#00E5FF] transition-all duration-200"
                      >
                        Read Walkthrough
                      </Link>
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center border border-dashed border-[rgba(245,240,250,0.14)] rounded text-[#9C8FAE] text-sm font-mono">
              No expert guides published yet.
            </div>
          )}
        </section>

        {/* Asymmetrical Staggered Segment: Community Poll, Recent updates & Social hubs */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pt-6">

          {/* Asymmetrical Column 1: Community Voice */}
          <div className="lg:col-span-7 space-y-8">
            <ScrollReveal>
              <div className="space-y-1 mb-6">
                <span className="text-xs font-bold font-mono text-[#FF2E88] uppercase tracking-widest">
                  Have Your Say
                </span>
                <h3 className="text-3xl font-anton uppercase text-[#F5F0FA] tracking-normal">
                  Player Opinion
                </h3>
              </div>
              {activePoll && (
                <div className="transform hover:scale-[1.01] transition-transform duration-300 motion-reduce:transform-none">
                  <CommunityPollWidget
                    initialPoll={{
                      id: activePoll.id,
                      question: activePoll.question,
                      options_json: activePoll.options_json as string[],
                      votes_json: activePoll.votes_json as Record<string, number>,
                    }}
                  />
                </div>
              )}
            </ScrollReveal>

            {/* Live Comments Stream */}
            <ScrollReveal>
              <Card variant="standard" padding="lg" className="space-y-6">
                <div className="border-b border-[rgba(245,240,250,0.1)] pb-4">
                  <h4 className="font-bold text-xs font-mono uppercase tracking-widest text-[#9C8FAE]">
                    Latest Intel / Comment Stream
                  </h4>
                </div>
                {sidebarComments && sidebarComments.length > 0 ? (
                  <ul className="space-y-6 divide-y divide-[rgba(245,240,250,0.1)]">
                    {sidebarComments.map((com) => (
                      <li key={com.id} className="space-y-2 pt-4 first:pt-0">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold font-mono text-[#00E5FF]">{com.name}</span>
                          <span className="text-[10px] font-mono text-[#9C8FAE]/60 font-bold">{formatDate(com.created_at)}</span>
                        </div>
                        <p className="text-[#F5F0FA]/85 text-sm italic leading-relaxed">
                          &ldquo;{com.content}&rdquo;
                        </p>
                        {com.articles && (
                          <div className="text-[10px] font-mono text-[#9C8FAE]/60">
                            on{" "}
                            <Link href={`/news/${(com.articles as any).slug}`} className="hover:underline text-[#FF2E88] font-bold uppercase tracking-wider">
                              {(com.articles as any).title}
                            </Link>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs font-mono text-[#9C8FAE]">No live comments stream.</p>
                )}
              </Card>
            </ScrollReveal>
          </div>

          {/* Asymmetrical Column 2: Recent Updates List & High-Impact Social Cards */}
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
            guidesCount={guidesCount}
            loreCount={loreCount}
          />
        </ScrollReveal>
      </div>
    </div>
  )
}
