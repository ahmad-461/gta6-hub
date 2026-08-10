import React from "react"
import Link from "next/link"
import Image from "next/image"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Calendar, MessageSquare, ArrowRight, Twitter, Youtube, Disc, MessageCircle } from "lucide-react"
import CountdownTimer from "@/components/CountdownTimer"
import CommunityPollWidget from "@/components/CommunityPollWidget"

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
      excerpt: "Deep dive into the massive open world mapping, from neon-lit Vice City beaches to muddy Grassland trails.",
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

  // Map settings keys for socials
  const socials = [
    { key: "social_twitter", name: "X / Twitter", icon: Twitter, color: "text-[#1DA1F2] hover:bg-[#1DA1F2]/10" },
    { key: "social_reddit", name: "Reddit", icon: MessageCircle, color: "text-[#FF4500] hover:bg-[#FF4500]/10" },
    { key: "social_discord", name: "Discord", icon: Disc, color: "text-[#5865F2] hover:bg-[#5865F2]/10" },
    { key: "social_youtube", name: "YouTube", icon: Youtube, color: "text-[#FF0000] hover:bg-[#FF0000]/10" },
  ].filter((s) => settings[s.key])

  return (
    <div className="flex-grow flex flex-col">
      {/* Cinematic Hero */}
      <section className="relative min-h-[420px] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-card-bg/85 via-background to-background border-b border-card-border overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-neon-pink/15 to-neon-blue/15 blur-[120px] rounded-full pointer-events-none animate-pulse" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          {latestTeaser && (
            <div className="inline-flex items-center gap-2 bg-neon-pink/10 border border-neon-pink/20 text-neon-pink px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-neon-pink/15 transition-all duration-300">
              <span className="uppercase tracking-wider font-bold">Latest News:</span>
              <Link href={`/news/${latestTeaser.slug}`} className="hover:underline truncate max-w-[200px] sm:max-w-md">
                {latestTeaser.title} &rarr;
              </Link>
            </div>
          )}

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            The Ultimate{" "}
            <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">
              GTA VI Hub
            </span>
          </h1>
          <p className="text-base sm:text-lg text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Your premium, real-time fan network for Grand Theft Auto VI. Stay connected with dynamic cheat codes, comprehensive walkthroughs, leaks, and lore.
          </p>

          <div className="pt-2">
            <p className="text-[10px] sm:text-xs text-foreground/40 font-extrabold uppercase tracking-widest mb-1.5">
              Leonida Release Countdown
            </p>
            <CountdownTimer targetDate={countdownTarget} />
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-8 space-y-12">
            {/* Featured Article */}
            {featuredArticle && (
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-card-border pb-2">
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                    Featured Article
                  </h2>
                  <span className="text-xs font-bold text-neon-pink uppercase tracking-widest px-2.5 py-1 bg-neon-pink/10 border border-neon-pink/25 rounded-md">
                    Featured
                  </span>
                </div>

                <div className="group block bg-card-bg border border-card-border rounded-xl overflow-hidden shadow-lg hover:border-neon-pink/45 transition-all duration-300">
                  <div className="relative w-full h-64 sm:h-96">
                    <Image
                      src={getImageUrl(featuredArticle.featured_image)}
                      alt={featuredArticle.title}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      priority
                      sizes="(max-w-1024px) 100vw, 70vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                  </div>

                  <div className="p-6 space-y-4">
                    {featuredArticle.category && (
                      <span className="inline-block text-xs font-bold uppercase tracking-wider text-neon-blue">
                        {(featuredArticle.category as any).name}
                      </span>
                    )}
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-neon-pink transition-colors duration-200">
                      <Link href={`/news/${featuredArticle.slug}`}>
                        {featuredArticle.title}
                      </Link>
                    </h3>
                    <p className="text-foreground/75 text-sm sm:text-base leading-relaxed line-clamp-3">
                      {featuredArticle.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-foreground/40 font-semibold">
                        {formatDate(featuredArticle.published_at)}
                      </span>
                      <Link
                        href={`/news/${featuredArticle.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-neon-pink hover:underline"
                      >
                        Read Full Article <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Latest News Grid */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-card-border pb-2">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                  Latest News
                </h2>
                <Link
                  href="/news"
                  className="text-xs font-bold text-neon-pink hover:underline uppercase tracking-wider inline-flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {latestNews && latestNews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {latestNews.map((art) => (
                    <article
                      key={art.id}
                      className="group flex flex-col justify-between bg-card-bg border border-card-border rounded-xl overflow-hidden hover:border-neon-pink/30 transition-all duration-300"
                    >
                      <div>
                        <div className="relative w-full h-48">
                          <Image
                            src={getImageUrl(art.featured_image)}
                            alt={art.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-w-768px) 100vw, (max-w-1200px) 50vw, 30vw"
                          />
                        </div>
                        <div className="p-4 space-y-2">
                          {art.category && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neon-blue">
                              {(art.category as any).name}
                            </span>
                          )}
                          <h4 className="font-extrabold text-white group-hover:text-neon-pink transition-colors line-clamp-2">
                            <Link href={`/news/${art.slug}`}>{art.title}</Link>
                          </h4>
                          <p className="text-xs text-foreground/60 leading-relaxed line-clamp-3">
                            {art.excerpt}
                          </p>
                        </div>
                      </div>
                      <div className="p-4 pt-0 border-t border-card-border/30 mt-4 flex items-center justify-between text-[10px] text-foreground/40 font-semibold">
                        <span>{formatDate(art.published_at)}</span>
                        <Link href={`/news/${art.slug}`} className="text-neon-pink hover:underline font-bold">
                          Read More &rarr;
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-card-border rounded-xl text-foreground/40 text-sm">
                  No standard articles published yet.
                </div>
              )}
            </section>

            {/* Latest Guides Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-card-border pb-2">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                  Featured Guides
                </h2>
                <Link
                  href="/guides"
                  className="text-xs font-bold text-neon-blue hover:underline uppercase tracking-wider inline-flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {latestGuides && latestGuides.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {latestGuides.map((guide) => (
                    <article
                      key={guide.id}
                      className="group flex flex-col justify-between bg-card-bg border border-card-border rounded-xl overflow-hidden hover:border-neon-blue/30 transition-all duration-300"
                    >
                      <div>
                        <div className="relative w-full h-40">
                          <Image
                            src={getImageUrl(guide.featured_image)}
                            alt={guide.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-w-768px) 100vw, 30vw"
                          />
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
                            <span className="text-neon-purple">{guide.guide_category}</span>
                            <span className={`px-1.5 py-0.5 rounded ${
                              guide.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400" :
                              guide.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-400" :
                              "bg-rose-500/10 text-rose-400"
                            }`}>
                              {guide.difficulty}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-white group-hover:text-neon-blue transition-colors line-clamp-2 text-sm sm:text-base">
                            <Link href={`/guides/${guide.guide_category.toLowerCase().replace(/\s+/g, "-")}/${guide.slug}`}>
                              {guide.title}
                            </Link>
                          </h4>
                        </div>
                      </div>
                      <div className="p-4 pt-0 mt-2">
                        <Link
                          href={`/guides/${guide.guide_category.toLowerCase().replace(/\s+/g, "-")}/${guide.slug}`}
                          className="block text-center w-full py-1.5 rounded bg-background border border-card-border text-xs font-bold hover:bg-neon-blue/5 hover:border-neon-blue/30 text-neon-blue transition-all duration-200"
                        >
                          Read Walkthrough
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-card-border rounded-xl text-foreground/40 text-sm">
                  No expert guides published yet.
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Social Links Widget */}
            {socials.length > 0 && (
              <div className="bg-card-bg border border-card-border rounded-xl p-6 shadow-md">
                <h3 className="font-extrabold text-xs uppercase tracking-widest text-foreground/50 mb-4">
                  Follow GTA VI HUB
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {socials.map((s) => {
                    const Icon = s.icon
                    return (
                      <a
                        key={s.key}
                        href={settings[s.key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center space-x-2.5 p-2 rounded-lg bg-background border border-card-border transition-all duration-200 group font-bold text-sm ${s.color}`}
                      >
                        <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                        <span className="text-white group-hover:text-inherit">{s.name}</span>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Community Poll Widget */}
            {activePoll && (
              <CommunityPollWidget
                initialPoll={{
                  id: activePoll.id,
                  question: activePoll.question,
                  options_json: activePoll.options_json as string[],
                  votes_json: activePoll.votes_json as Record<string, number>,
                }}
              />
            )}

            {/* Most Recent Content */}
            <div className="bg-card-bg border border-card-border rounded-xl p-6 shadow-md space-y-4">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-foreground/50 border-b border-card-border pb-2">
                Recent Updates
              </h3>
              {sidebarArticles && sidebarArticles.length > 0 ? (
                <ul className="space-y-3">
                  {sidebarArticles.map((art) => (
                    <li key={art.id} className="group text-sm">
                      <Link
                        href={`/news/${art.slug}`}
                        className="font-bold text-white group-hover:text-neon-pink transition-colors line-clamp-2 leading-snug"
                      >
                        {art.title}
                      </Link>
                      <span className="text-[10px] text-foreground/40 font-semibold block mt-1">
                        {formatDate(art.published_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-foreground/40">No recent updates.</p>
              )}
            </div>

            {/* Latest Comments Widget */}
            <div className="bg-card-bg border border-card-border rounded-xl p-6 shadow-md space-y-4">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-foreground/50 border-b border-card-border pb-2">
                Latest Comments
              </h3>
              {sidebarComments && sidebarComments.length > 0 ? (
                <ul className="space-y-4">
                  {sidebarComments.map((com) => (
                    <li key={com.id} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-neon-blue">{com.name}</span>
                        <span className="text-[10px] text-foreground/40">{formatDate(com.created_at)}</span>
                      </div>
                      <p className="text-foreground/80 text-xs italic line-clamp-2 leading-relaxed">
                        &ldquo;{com.content}&rdquo;
                      </p>
                      {com.articles && (
                        <div className="text-[9px] text-foreground/40">
                          on{" "}
                          <Link href={`/news/${(com.articles as any).slug}`} className="hover:underline text-neon-pink font-semibold">
                            {(com.articles as any).title}
                          </Link>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-foreground/40">No comments posted yet.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
