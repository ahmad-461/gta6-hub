import React from "react"
import Link from "next/link"
import Image from "next/image"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Calendar, MessageSquare, ArrowRight, Twitter, Youtube, Disc, MessageCircle, Flame, ShieldAlert, Award, Star } from "lucide-react"
import CountdownTimer from "@/components/CountdownTimer"
import CommunityPollWidget from "@/components/CommunityPollWidget"
import ParallaxWatermark from "@/components/ParallaxWatermark"
import ScrollReveal from "@/components/ScrollReveal"

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

  if (!isDummy) {
    try {
      const supabase = createSupabaseServerClient()

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

  const socials = [
    { key: "social_twitter", name: "X / Twitter", icon: Twitter, color: "text-[#1DA1F2] hover:bg-[#1DA1F2]/10" },
    { key: "social_reddit", name: "Reddit", icon: MessageCircle, color: "text-[#FF4500] hover:bg-[#FF4500]/10" },
    { key: "social_discord", name: "Discord", icon: Disc, color: "text-[#5865F2] hover:bg-[#5865F2]/10" },
    { key: "social_youtube", name: "YouTube", icon: Youtube, color: "text-[#FF0000] hover:bg-[#FF0000]/10" },
  ].filter((s) => settings[s.key])

  return (
    <div className="flex-grow flex flex-col relative bg-[#0d0c10] overflow-hidden">
      {/* Cinematic Global Noise Texture */}
      <div className="film-grain" />

      {/* Hero: Asymmetric Layout with Giant Typography and Scroll Parallax Watermark */}
      <section className="relative min-h-[90vh] flex items-center py-20 px-4 sm:px-6 lg:px-12 border-b border-card-border overflow-hidden mesh-glow-1">
        {/* Parallax Background Typography */}
        <div className="absolute right-0 top-1/4 select-none pointer-events-none z-0 overflow-hidden w-full max-w-4xl h-full hidden lg:block opacity-[0.06]">
          <ParallaxWatermark
            text="LEONIDA"
            className="text-[20rem] font-black tracking-tighter text-stroke-neon-pink select-none uppercase leading-none"
          />
        </div>

        <div className="absolute left-1/4 top-1/3 w-[500px] h-[500px] bg-neon-pink/10 blur-[130px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute right-10 bottom-10 w-[400px] h-[400px] bg-neon-blue/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Asymmetric Left Main Text Column */}
          <div className="lg:col-span-8 space-y-8 text-left">
            {latestTeaser && (
              <div className="inline-flex items-center gap-3 bg-neon-pink/10 border border-neon-pink/30 text-neon-pink px-4 py-1.5 rounded-md text-xs font-bold hover:bg-neon-pink/15 transition-all duration-300 transform -rotate-1 shadow-md">
                <span className="uppercase tracking-widest font-black text-[10px] bg-neon-pink text-black px-1.5 py-0.5 rounded">
                  NEW
                </span>
                <Link href={`/news/${latestTeaser.slug}`} className="hover:underline truncate max-w-[200px] sm:max-w-md">
                  {latestTeaser.title}
                </Link>
              </div>
            )}

            {/* Giant Stacked Typographic Treatment */}
            <div className="space-y-2">
              <h1 className="text-5xl sm:text-7xl lg:text-[7.5rem] font-black uppercase tracking-tighter leading-none text-white font-sans">
                ENTER THE{" "}
                <span className="block text-stroke-neon-pink text-stroke-neon-pink">
                  NEXT-GEN
                </span>{" "}
                <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent glow-pink-text">
                  LEONIDA
                </span>
              </h1>
            </div>

            <p className="text-lg sm:text-xl text-foreground/80 max-w-2xl leading-relaxed font-medium">
              The premier hyper-focused fan ecosystem for Grand Theft Auto VI. Access immediate walkthroughs, real-time database lookups, and deep lore map tracing.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/news"
                className="px-8 py-4 bg-neon-pink hover:bg-neon-pink/90 text-white font-black uppercase tracking-wider text-sm rounded transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,127,0.5)] transform -skew-x-12"
              >
                <span className="inline-block transform skew-x-12">Latest News</span>
              </Link>
              <Link
                href="/cheats"
                className="px-8 py-4 bg-transparent hover:bg-neon-blue/10 border-2 border-neon-blue text-neon-blue font-black uppercase tracking-wider text-sm rounded transition-all duration-300 transform -skew-x-12"
              >
                <span className="inline-block transform skew-x-12">Cheat Finder</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Giant Asymmetric Badge / Callout */}
          <div className="lg:col-span-4 flex justify-end">
            <div className="relative p-8 bg-card-bg/60 backdrop-blur-md border border-card-border rounded-2xl max-w-sm w-full shadow-2xl transform lg:rotate-3 hover:rotate-0 transition-transform duration-500 hover:border-neon-pink/40">
              <div className="absolute -top-4 -left-4 bg-neon-pink text-black text-xs font-black px-3 py-1 uppercase tracking-widest rounded-md shadow-md">
                Active System
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-neon-blue">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="text-xs font-extrabold uppercase tracking-widest">
                    Interactive Map Live
                  </span>
                </div>
                <h3 className="text-2xl font-black uppercase text-white tracking-tight">
                  Lore Connections
                </h3>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  Analyze and trace dynamic relationships between core protagonists, hidden secrets, and physical locations within the city.
                </p>
                <Link
                  href="/lore-map"
                  className="inline-flex items-center gap-2 text-xs font-black text-neon-pink uppercase tracking-widest hover:underline pt-2"
                >
                  Explore Lore Map <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spotlight: Dramatic Split-Screen Featured Article */}
      {featuredArticle && (
        <section className="relative border-b border-card-border overflow-hidden bg-gradient-to-r from-card-bg via-background to-background">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
              {/* Left Cinematic Diagonal Sliced Image Block */}
              <div className="lg:col-span-7 relative overflow-hidden diagonal-split-left min-h-[350px] lg:min-h-full group">
                <Image
                  src={getImageUrl(featuredArticle.featured_image)}
                  alt={featuredArticle.title}
                  fill
                  className="object-cover group-hover:scale-[1.05] transition-transform duration-1000 ease-out"
                  priority
                  sizes="(max-w-1024px) 100vw, 60vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent lg:hidden" />
              </div>

              {/* Right Typographic Content Block */}
              <div className="lg:col-span-5 flex flex-col justify-center p-8 lg:p-12 space-y-6 relative z-10">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-neon-pink uppercase tracking-widest px-3 py-1 bg-neon-pink/15 border border-neon-pink/30 rounded">
                    Spotlight Article
                  </span>
                  {featuredArticle.category && (
                    <span className="text-xs font-extrabold uppercase tracking-widest text-neon-blue">
                      {(featuredArticle.category as any).name}
                    </span>
                  )}
                </div>

                <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-tight hover:text-neon-pink transition-colors">
                  <Link href={`/news/${featuredArticle.slug}`}>
                    {featuredArticle.title}
                  </Link>
                </h2>

                <p className="text-foreground/80 text-base leading-relaxed line-clamp-4">
                  {featuredArticle.excerpt}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-card-border/60">
                  <span className="text-xs text-foreground/40 font-bold uppercase tracking-wider">
                    Published: {formatDate(featuredArticle.published_at)}
                  </span>
                  <Link
                    href={`/news/${featuredArticle.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-neon-pink hover:underline uppercase tracking-widest"
                  >
                    Read Article <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* High-Impact Full-Bleed Cinematic Countdown Timer Section */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-[#111015] to-[#0c0b0f] border-b border-card-border overflow-hidden mesh-glow-2">
        <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-neon-blue/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-xs font-black uppercase tracking-widest mb-2">
              <Flame className="w-4 h-4 animate-bounce" /> Time Remaining Until Launch
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight leading-none">
              Count down to Leonida
            </h2>
            <p className="text-foreground/70 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Every second counts. Prepare for the largest open world sandbox experience in virtual history.
            </p>
            <div className="pt-6">
              <CountdownTimer targetDate={countdownTarget} />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Main Multi-Column Editorial Layout without Generic Sidebars */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-20 space-y-24">

        {/* News Grid Block */}
        <section className="space-y-12">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-card-border pb-4">
              <div className="space-y-1">
                <span className="text-xs font-black text-neon-pink uppercase tracking-widest">
                  Hot Off The Press
                </span>
                <h2 className="text-4xl font-black uppercase tracking-tight text-white leading-none">
                  Latest Insights
                </h2>
              </div>
              <Link
                href="/news"
                className="text-xs font-bold text-neon-pink hover:underline uppercase tracking-wider inline-flex items-center gap-1 bg-neon-pink/10 px-3 py-1.5 rounded border border-neon-pink/20"
              >
                View Newsroom <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </ScrollReveal>

          {latestNews && latestNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestNews.map((art, index) => (
                <ScrollReveal key={art.id} style={{ transitionDelay: `${index * 100}ms` }}>
                  <article className="group flex flex-col justify-between bg-[#15131a] border border-card-border rounded-xl overflow-hidden hover:border-neon-pink/30 hover:shadow-[0_0_30px_rgba(255,0,127,0.05)] transition-all duration-300">
                    <div>
                      <div className="relative w-full h-56 overflow-hidden">
                        <Image
                          src={getImageUrl(art.featured_image)}
                          alt={art.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          sizes="(max-w-768px) 100vw, (max-w-1200px) 50vw, 30vw"
                        />
                      </div>
                      <div className="p-6 space-y-3">
                        {art.category && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-neon-blue">
                            {(art.category as any).name}
                          </span>
                        )}
                        <h4 className="text-xl font-black text-white group-hover:text-neon-pink transition-colors line-clamp-2 leading-snug">
                          <Link href={`/news/${art.slug}`}>{art.title}</Link>
                        </h4>
                        <p className="text-sm text-foreground/60 leading-relaxed line-clamp-3">
                          {art.excerpt}
                        </p>
                      </div>
                    </div>
                    <div className="p-6 pt-0 border-t border-card-border/30 mt-4 flex items-center justify-between text-[11px] text-foreground/40 font-bold uppercase tracking-wider">
                      <span>{formatDate(art.published_at)}</span>
                      <Link href={`/news/${art.slug}`} className="text-neon-pink hover:underline font-extrabold flex items-center gap-1">
                        Read <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center border border-dashed border-card-border rounded-xl text-foreground/40 text-sm">
              No news items posted yet. Check back soon.
            </div>
          )}
        </section>

        {/* Dynamic Walkthroughs section */}
        <section className="space-y-12">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-card-border pb-4">
              <div className="space-y-1">
                <span className="text-xs font-black text-neon-blue uppercase tracking-widest">
                  Pro Walkthroughs
                </span>
                <h2 className="text-4xl font-black uppercase tracking-tight text-white leading-none">
                  Expert Guides
                </h2>
              </div>
              <Link
                href="/guides"
                className="text-xs font-bold text-neon-blue hover:underline uppercase tracking-wider inline-flex items-center gap-1 bg-neon-blue/10 px-3 py-1.5 rounded border border-neon-blue/20"
              >
                Browse All Guides <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </ScrollReveal>

          {latestGuides && latestGuides.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestGuides.map((guide, index) => (
                <ScrollReveal key={guide.id} style={{ transitionDelay: `${index * 100}ms` }}>
                  <article className="group flex flex-col justify-between bg-[#15131a] border border-card-border rounded-xl overflow-hidden hover:border-neon-blue/30 hover:shadow-[0_0_30px_rgba(0,240,255,0.05)] transition-all duration-300">
                    <div>
                      <div className="relative w-full h-48 overflow-hidden">
                        <Image
                          src={getImageUrl(guide.featured_image)}
                          alt={guide.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          sizes="(max-w-768px) 100vw, 30vw"
                        />
                      </div>
                      <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                          <span className="text-neon-purple">{guide.guide_category}</span>
                          <span className={`px-2 py-0.5 rounded ${
                            guide.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            guide.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}>
                            {guide.difficulty}
                          </span>
                        </div>
                        <h4 className="text-lg font-black text-white group-hover:text-neon-blue transition-colors line-clamp-2 leading-snug">
                          <Link href={`/guides/${guide.guide_category.toLowerCase().replace(/\s+/g, "-")}/${guide.slug}`}>
                            {guide.title}
                          </Link>
                        </h4>
                      </div>
                    </div>
                    <div className="p-6 pt-0 mt-2">
                      <Link
                        href={`/guides/${guide.guide_category.toLowerCase().replace(/\s+/g, "-")}/${guide.slug}`}
                        className="block text-center w-full py-2.5 rounded bg-background border border-card-border text-xs font-black uppercase tracking-wider hover:bg-neon-blue/5 hover:border-neon-blue/30 text-neon-blue transition-all duration-200"
                      >
                        Read Walkthrough
                      </Link>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center border border-dashed border-card-border rounded-xl text-foreground/40 text-sm">
              No expert guides published yet.
            </div>
          )}
        </section>

        {/* Asymmetrical Staggered Segment: Community Poll, Recent updates & Social hubs */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pt-12">

          {/* Asymmetrical Column 1: Community Voice */}
          <div className="lg:col-span-7 space-y-8">
            <ScrollReveal>
              <div className="space-y-1 mb-6">
                <span className="text-xs font-black text-neon-pink uppercase tracking-widest">
                  Have Your Say
                </span>
                <h3 className="text-3xl font-black uppercase text-white tracking-tight">
                  Player Opinion
                </h3>
              </div>
              {activePoll && (
                <div className="transform hover:scale-[1.01] transition-transform duration-300">
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
              <div className="bg-[#15131a] border border-card-border rounded-xl p-8 space-y-6">
                <div className="border-b border-card-border pb-4">
                  <h4 className="font-black text-xs uppercase tracking-widest text-foreground/50">
                    Latest Intel / Comment Stream
                  </h4>
                </div>
                {sidebarComments && sidebarComments.length > 0 ? (
                  <ul className="space-y-6 divider-y divide-card-border/30">
                    {sidebarComments.map((com) => (
                      <li key={com.id} className="space-y-2 pt-1 first:pt-0">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-black text-neon-blue">{com.name}</span>
                          <span className="text-[10px] text-foreground/40 font-bold">{formatDate(com.created_at)}</span>
                        </div>
                        <p className="text-foreground/80 text-sm italic leading-relaxed">
                          &ldquo;{com.content}&rdquo;
                        </p>
                        {com.articles && (
                          <div className="text-[10px] text-foreground/40">
                            on{" "}
                            <Link href={`/news/${(com.articles as any).slug}`} className="hover:underline text-neon-pink font-bold uppercase tracking-wider">
                              {(com.articles as any).title}
                            </Link>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-foreground/40">No live comments stream.</p>
                )}
              </div>
            </ScrollReveal>
          </div>

          {/* Asymmetrical Column 2: Recent Updates List & High-Impact Social Cards */}
          <div className="lg:col-span-5 space-y-8">
            <ScrollReveal>
              <div className="bg-[#15131a] border border-card-border rounded-xl p-8 space-y-6">
                <h4 className="font-black text-xs uppercase tracking-widest text-foreground/50 border-b border-card-border pb-4">
                  Quick Updates
                </h4>
                {sidebarArticles && sidebarArticles.length > 0 ? (
                  <ul className="space-y-4">
                    {sidebarArticles.map((art) => (
                      <li key={art.id} className="group text-sm pb-3 border-b border-card-border/30 last:border-0 last:pb-0">
                        <Link
                          href={`/news/${art.slug}`}
                          className="font-black text-white group-hover:text-neon-pink transition-colors line-clamp-2 leading-snug"
                        >
                          {art.title}
                        </Link>
                        <span className="text-[10px] text-foreground/40 font-bold block mt-1 uppercase tracking-widest">
                          {formatDate(art.published_at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-foreground/40">No recent updates.</p>
                )}
              </div>
            </ScrollReveal>

            {/* Gorgeous Cinematic Social Blocks */}
            {socials.length > 0 && (
              <ScrollReveal>
                <div className="bg-[#15131a] border border-card-border rounded-xl p-8 space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-neon-pink">
                      Join The Syndicate
                    </span>
                    <h4 className="font-black text-lg text-white uppercase tracking-tight">
                      Fan Networks
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {socials.map((s) => {
                      const Icon = s.icon
                      return (
                        <a
                          key={s.key}
                          href={settings[s.key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex flex-col items-center justify-center p-4 rounded-lg bg-background border border-card-border transition-all duration-300 group font-bold text-xs gap-2 text-center hover:border-white/20 hover:-translate-y-1 ${s.color}`}
                        >
                          <Icon className="w-6 h-6 transition-transform group-hover:scale-110" />
                          <span className="text-white uppercase tracking-wider font-extrabold">{s.name}</span>
                        </a>
                      )
                    })}
                  </div>
                </div>
              </ScrollReveal>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
