import React from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Calendar, User, Clock, ChevronRight, Share2, Twitter, MessageCircle, ArrowLeft } from "lucide-react"
import ReadingProgressBar from "@/components/ReadingProgressBar"
import ArticleComments from "@/components/ArticleComments"
import CopyLinkButton from "@/components/CopyLinkButton"
import JsonLd from "@/components/JsonLd"
import AdSenseInitializer from "@/components/AdSenseInitializer"
import ArticleContentRenderer from "@/components/ArticleContentRenderer"
import { injectAdSenseAds } from "@/lib/adsense"
import { parseAffiliateLinks } from "@/lib/affiliate"

export const revalidate = 3600

interface ArticlePageProps {
  params: {
    slug: string
  }
}

const FALLBACK_ARTICLES: Record<string, any> = {
  "gta-5-vs-gta-6": {
    id: "88888888-8888-8888-8888-888888888899",
    title: "GTA 5 vs GTA 6: How Rockstar's Next Open-World Game Compares",
    slug: "gta-5-vs-gta-6",
    excerpt: "A comprehensive side-by-side technical and gameplay analysis comparing Grand Theft Auto V with Grand Theft Auto VI, covering setting, dual protagonists, AI simulation, graphics, and online features.",
    category: "News",
    rumor_status: "confirmed",
    featured_image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    seo_title: "GTA 5 vs GTA 6: Biggest Differences & What to Expect",
    seo_description: "A detailed GTA 5 vs GTA 6 comparison covering the map, protagonists, graphics, gameplay, world design, vehicles, and everything Rockstar has officially revealed.",
    published_at: "2025-01-01T00:00:00.000Z",
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    content: `<h2>GTA 5 vs GTA 6: How Rockstar's Next Open-World Game Compares</h2>

<p>Grand Theft Auto V revolutionized open-world gaming when it released in 2013, setting commercial and critical benchmarks that have endured for over a decade. Now, with Grand Theft Auto VI scheduled to launch in Fall 2025, Rockstar Games is preparing to deliver its most ambitious title yet. By transitioning from the satire-soaked streets of Los Santos to the sprawling tropical state of Leonida and Vice City, GTA VI promises groundbreaking visual fidelity, enhanced artificial intelligence, and a dynamic criminal narrative. In this comprehensive comparison briefing, we analyze how GTA V and GTA VI compare across setting, protagonists, map scale, graphics, gameplay mechanics, and multiplayer evolution.</p>

<div class="key-facts-card">
  <h3 class="text-sm font-bold uppercase font-mono text-[#FF8A3D] mb-2">⚡ Key Facts & Baseline Comparison</h3>
  <ul class="text-xs space-y-1.5 text-foreground/90">
    <li><strong>Release Window:</strong> GTA V (September 2013) vs. GTA VI (Fall 2025 <span class="status-badge-confirmed">CONFIRMED</span>).</li>
    <li><strong>Primary Setting:</strong> Los Santos & Blaine County vs. Vice City & State of Leonida (<span class="status-badge-confirmed">CONFIRMED</span>).</li>
    <li><strong>Protagonists:</strong> Michael, Franklin, Trevor vs. <a href="/characters">Lucia & Jason</a> (<span class="status-badge-confirmed">CONFIRMED</span>).</li>
    <li><strong>Target Hardware:</strong> 7th/8th Gen baseline vs. Native 9th-Gen (PS5, Xbox Series X|S) (<span class="status-badge-confirmed">CONFIRMED</span>).</li>
    <li><strong>Physics & AI:</strong> RAGE 7 vs. Upgraded RAGE Engine with volumetric weather and dense crowd simulation (<span class="status-badge-reported">REPORTED</span>).</li>
  </ul>
</div>

<h2>GTA 5 vs GTA 6 — At a Glance</h2>

<p>To understand how Rockstar's flagship series has evolved over twelve years, examine the core feature breakdown between both titles. Every detail for GTA VI is rigorously categorized by official verification status.</p>

<div class="article-table-container">
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Grand Theft Auto V</th>
        <th>Grand Theft Auto VI</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Release Date</strong></td>
        <td>September 17, 2013</td>
        <td>Fall 2025 <span class="status-badge-confirmed">CONFIRMED</span></td>
      </tr>
      <tr>
        <td><strong>Setting</strong></td>
        <td>Los Santos & Blaine County (San Andreas)</td>
        <td>Vice City & State of Leonida <span class="status-badge-confirmed">CONFIRMED</span></td>
      </tr>
      <tr>
        <td><strong>Main Protagonists</strong></td>
        <td>Michael De Santa, Franklin Clinton, Trevor Philips</td>
        <td>Lucia & Jason <span class="status-badge-confirmed">CONFIRMED</span></td>
      </tr>
      <tr>
        <td><strong>Map / World Scale</strong></td>
        <td>~29 sq miles (75 km²) land mass</td>
        <td>Significantly larger state-wide map with diverse biomes <span class="status-badge-reported">REPORTED</span></td>
      </tr>
      <tr>
        <td><strong>Graphics & Tech</strong></td>
        <td>7th-Gen Baseline (PS3/Xbox 360) remastered for 8th/9th Gen</td>
        <td>Native 9th-Gen (PS5/Xbox Series X|S) RAGE Engine <span class="status-badge-confirmed">CONFIRMED</span></td>
      </tr>
      <tr>
        <td><strong>Gameplay Mechanics</strong></td>
        <td>Weapon wheel, vehicle physics, character switching</td>
        <td>Realistic carry limits, trunk inventory, prone movement <span class="status-badge-reported">REPORTED</span></td>
      </tr>
      <tr>
        <td><strong>Vehicles & Physics</strong></td>
        <td>Arcade-leaning handling, custom tuning shops</td>
        <td>Advanced interior customization, realistic deformation <span class="status-badge-reported">REPORTED</span></td>
      </tr>
      <tr>
        <td><strong>NPC / Living World</strong></td>
        <td>Standard behavioral loops, scripted events</td>
        <td>Dense crowd simulation, social media integration <span class="status-badge-confirmed">CONFIRMED</span></td>
      </tr>
      <tr>
        <td><strong>Story Focus</strong></td>
        <td>Hollywood heist satire, retired bank robber drama</td>
        <td>Modern criminal duo dynamic, Vice City underworld <span class="status-badge-confirmed">CONFIRMED</span></td>
      </tr>
      <tr>
        <td><strong>Target Platforms</strong></td>
        <td>PS3, Xbox 360, PS4, Xbox One, PS5, Xbox Series X|S, PC</td>
        <td>PlayStation 5, Xbox Series X|S at launch <span class="status-badge-confirmed">CONFIRMED</span></td>
      </tr>
      <tr>
        <td><strong>Online Component</strong></td>
        <td>GTA Online (10+ years of active expansion)</td>
        <td>Next-gen multiplayer evolution <span class="status-badge-unconfirmed">UNCONFIRMED</span></td>
      </tr>
    </tbody>
  </table>
</div>

<h2>1. Setting & World</h2>

<p>Grand Theft Auto V brought players to a satirical version of Southern California with Los Santos and Blaine County. The world offered a stark contrast between urban skyscrapers, wealthy suburban hills, arid deserts, and coastal beaches. While impressive for 2013, San Andreas was bounded by an oceanic perimeter with a single major metropolitan focal point.</p>

<p>In contrast, Grand Theft Auto VI expands to the state level. Set in the fictional state of Leonida—anchored by the neon-drenched metropolis of Vice City—GTA VI introduces a much richer geographic spectrum. Expect vibrant coastal strips, humid marshlands, rural keys, and industrial ports. Based on trailer telemetry and official reveals, Leonida features unprecedented environmental density. Explore mapped points of interest on our interactive <a href="/map">Leonida State Map</a>.</p>

<h2>2. Protagonists & Story</h2>

<p>GTA V made history by introducing three playable main characters: Michael De Santa, Franklin Clinton, and Trevor Philips. Players could swap between them seamlessly during free-roam and missions, weaving together storylines from three distinct socio-economic perspectives.</p>

<p>GTA VI streamlines this approach into an intimate Bonnie and Clyde style criminal pairing featuring <strong>Lucia</strong> and <strong>Jason</strong>. Lucia is notable as the series' first female protagonist in the 3D/HD era. Trailer 1 highlights their mutual trust, criminal partnerships, and high-stakes robberies across Vice City. You can dive deeper into their backgrounds in our <a href="/characters">GTA VI Character Dossiers</a>.</p>

<h2>3. Map & World Design</h2>

<p>GTA V's Los Santos boasted a landmass of approximately 29 square miles. However, a significant portion comprised mountainous terrain and empty hillsides. While visually stunning, interior access was largely restricted to specific story missions and buyable properties.</p>

<p>Reliable community mapping project telemetry and official footage confirm that GTA VI's Leonida is substantially larger and far more accessible. Buildings feature unprecedented interior density, with accessible convenience stores, clubs, pawn shops, and hotels. Environmental features such as tidal water dynamics, weather cycles, and dense foliage elevate world exploration to next-gen standards.</p>

<h2>4. Graphics & Visuals</h2>

<p>GTA V was originally engineered for the PlayStation 3 and Xbox 360, operating under severe memory constraints before receiving enhanced remasters on PS4, PS5, and PC. Despite lighting and texture upgrades, its core rendering pipeline remains rooted in 2013 technology.</p>

<p>GTA VI is built natively for ninth-generation consoles (PS5 and Xbox Series X|S) on Rockstar's latest iteration of the RAGE engine. Trailer 1 showcased real-time global illumination, advanced ray-traced reflections on vehicle chrome, ultra-realistic hair and cloth physics, and physical water dynamics during coastal boat rides.</p>

<h2>5. Gameplay & Immersion</h2>

<p>GTA V featured an arcade-accessible inventory system where characters could carry an entire military arsenal in a hidden weapon wheel. Combat was fast-paced and cover-focused, with classic inputs that long-time fans can reference in our <a href="/cheats">GTA Cheat Codes Directory</a>.</p>

<p>Gameplay leaks and analysis suggest GTA VI adopts immersion mechanics reminiscent of Red Dead Redemption 2. Characters are reported to carry limited weapons on their person, utilizing vehicle trunks and backpacks for heavy equipment storage. Tactical movements like prone crawling, shoulder swapping, and inventory pickup animations further enhance tactical depth.</p>

<h2>6. Vehicles & Transportation</h2>

<p>GTA V featured hundreds of drivable vehicles ranging from sports coupes and military jets to superyachts. Vehicle customization via Los Santos Customs was extensive, allowing engine tuning, armor upgrades, and cosmetic modifications.</p>

<p>GTA VI builds upon this foundation with regional vehicles tailored for Leonida, including Everglades airboats, off-road mud runners, luxury speedboats, and modern street racing tuned cars. Vehicle interiors feature functional digital displays, rear-view mirrors, and detailed steering animations.</p>

<h2>7. NPCs & Living World</h2>

<p>NPCs in GTA V followed structured day-night schedules and reacted to gunshots or erratic driving. However, crowd density was constrained by hardware memory limitations.</p>

<p>In GTA VI, crowd simulation reaches staggering new heights. Vice City Beach is packed with hundreds of uniquely modeled NPCs sunbathing, jogging, and interacting with pets. Furthermore, in-game social media feeds—mimicking TikTok and Instagram—play a central role in how world news and viral Florida moments are shared in real-time.</p>

<h2>8. GTA Online & Multiplayer</h2>

<p>GTA V's defining legacy is GTA Online, which evolved from a buggy 2013 launch into a massive commercial titan with heist updates, nightclub businesses, and custom job creators.</p>

<p>Rockstar Games has not yet officially detailed GTA VI's multiplayer mode. While expectations point toward a next-generation online ecosystem benefiting from modern server architecture, Rockstar remains focused on revealing the single-player experience first. Stay tuned to our <a href="/news">GTA 6 News Directory</a> for official multiplayer updates.</p>

<h2>9. Which Game Is Bigger?</h2>

<p>Declaring one game absolute winner depends on how you define scale. GTA V offers twelve years of accumulated content, dozens of online DLCs, and thousands of playable hours. However, technologically and structurally, GTA VI promises a deeper, more reactive world simulation that will define the next decade of open-world gaming.</p>

<h2>10. GTA 5 vs GTA 6 — Final Verdict</h2>

<p>Grand Theft Auto V set a legendary benchmark that stood the test of time. Grand Theft Auto VI is not merely a visual upgrade; it is a fundamental leap in open-world worldbuilding, character storytelling, and artificial intelligence. As launch approaches in Fall 2025, Leonida promises to be the most immersive digital world ever created.</p>

<div class="quick-take-card">
  <h3 class="text-sm font-bold uppercase font-mono text-[#FF2D8D] mb-2">📌 Quick Take</h3>
  <p class="text-xs text-foreground/90 leading-relaxed">While GTA V defined two generations of open-world gaming, GTA VI represents a generational leap in technology, environmental detail, and character simulation. Moving from Los Santos to Leonida, GTA VI delivers an unprecedented next-gen sandbox.</p>
</div>

<div class="what-we-know-box">
  <h3 class="text-sm font-bold uppercase font-mono text-white mb-3">🔍 What We Know vs What We Expect</h3>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
    <div class="p-3 bg-[#0B0B0F] rounded-lg border border-emerald-500/20">
      <h4 class="font-bold text-emerald-400 font-mono uppercase mb-1">✓ Officially Confirmed</h4>
      <ul class="list-disc pl-4 space-y-1 text-foreground/80">
        <li>Setting: Vice City & State of Leonida</li>
        <li>Protagonists: Lucia & Jason</li>
        <li>Launch Window: Fall 2025 on PS5 & Xbox Series X|S</li>
        <li>In-game social media feed mechanics</li>
      </ul>
    </div>
    <div class="p-3 bg-[#0B0B0F] rounded-lg border border-amber-500/20">
      <h4 class="font-bold text-amber-400 font-mono uppercase mb-1">⚡ Reported / Expected</h4>
      <ul class="list-disc pl-4 space-y-1 text-foreground/80">
        <li>Evolving state map expanding post-launch</li>
        <li>Inventory carry limits & vehicle trunk storage</li>
        <li>Advanced police pursuit AI & memory tracking</li>
        <li>Next-gen GTA Online multiplayer integration</li>
      </ul>
    </div>
  </div>
</div>

<div class="verdict-card">
  <h3 class="text-base font-black uppercase font-mono text-[#00E5FF] mb-2">🏆 Comparison Verdict</h3>
  <p class="text-xs text-foreground/90 leading-relaxed mb-3">GTA V remains an iconic masterpiece. However, GTA VI is set to redefine the genre with realistic dual protagonists, dense world simulation, and unprecedented fidelity. For open-world fans, GTA VI is the ultimate next-gen gaming destination.</p>
  <div class="flex flex-wrap gap-2 text-[10px] font-mono font-bold uppercase">
    <a href="/news" class="px-2.5 py-1 bg-[#FF2D8D]/10 border border-[#FF2D8D]/30 text-[#FF2D8D] rounded hover:bg-[#FF2D8D]/20">Latest News & Intelligence</a>
    <a href="/map" class="px-2.5 py-1 bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] rounded hover:bg-[#00E5FF]/20">Explore Leonida Map</a>
  </div>
</div>`
  }
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const supabase = createSupabaseServerClient()
  let { data: article, error } = await supabase
    .from("articles")
    .select("title, excerpt, seo_title, seo_description, featured_image")
    .eq("slug", params.slug)
    .maybeSingle()

  if (error) {
    console.error("[generateMetadata Supabase Error]:", error)
  }

  if (!article && FALLBACK_ARTICLES[params.slug]) {
    article = FALLBACK_ARTICLES[params.slug]
  }

  if (!article) {
    return {
      title: "Article Not Found | GTA VI Hub",
    }
  }

  const title = article.seo_title || article.title
  const description = article.seo_description || article.excerpt || "Read the latest news and updates on Grand Theft Auto VI."
  const ogImage = article.featured_image || "/og-image.jpg"

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
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

const isUuid = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

export default async function ArticlePage({ params }: ArticlePageProps) {
  const supabase = createSupabaseServerClient()

  // Fetch site setting for AdSense Publisher ID
  const { data: adsenseSetting, error: adsenseError } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "adsense_publisher_id")
    .maybeSingle()
  if (adsenseError) {
    console.error("[ArticlePage AdSense Setting Error]:", adsenseError)
  }
  const publisherId = adsenseSetting?.value || null

  // 1. Fetch current article + author profile
  let article: any = null
  let articleError: any = null

  try {
    const res = await supabase
      .from("articles")
      .select(`
        id,
        title,
        slug,
        content,
        excerpt,
        featured_image,
        published_at,
        created_at,
        updated_at,
        author_id,
        category,
        seo_description,
        rumor_status
      `)
      .eq("slug", params.slug)
      .eq("status", "published")
      .maybeSingle()
    article = res.data
    articleError = res.error
    if (articleError) {
      console.error("[ArticlePage Fetch Article Error]:", articleError)
    }
  } catch (err) {
    console.error("[ArticlePage Supabase Exception]:", err)
  }

  if (!article && FALLBACK_ARTICLES[params.slug]) {
    article = FALLBACK_ARTICLES[params.slug]
  }

  if (!article) {
    notFound()
  }

  // Fetch category info safely if article.category is present
  let categoryData: { id: string; name: string; slug: string } | null = null
  if (article.category) {
    let catQuery = supabase.from("categories").select("id, name, slug")
    if (isUuid(article.category)) {
      catQuery = catQuery.or(`id.eq.${article.category},slug.eq.${article.category}`)
    } else {
      catQuery = catQuery.eq("slug", article.category)
    }

    const { data: catData, error: catError } = await catQuery.maybeSingle()

    if (catError) {
      console.error("[ArticlePage Category Fetch Error]:", catError)
    }

    if (catData) {
      categoryData = catData
    } else {
      categoryData = {
        id: article.category,
        name: article.category,
        slug: article.category.toLowerCase().replace(/\s+/g, "-"),
      }
    }
  }

  // 2. Fetch author profile
  let authorName = "GTA6 Hub Staff"
  if (article.author_id) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", article.author_id)
      .maybeSingle()
    if (profileError) {
      console.error("[ArticlePage Profile Fetch Error]:", profileError)
    }
    if (profile?.name) {
      authorName = profile.name
    }
  }

  // Inject AdSense ads into content if publisher ID is set
  const articleContentWithAds = injectAdSenseAds(article.content, publisherId)

  // Parse Affiliate Links in content
  const { parsedContent: articleContentWithAffiliate, hasAffiliate } = parseAffiliateLinks(articleContentWithAds)

  // Construct JSON-LD Article Schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": article.excerpt || article.seo_description || "Read the latest news and updates on Grand Theft Auto VI.",
    "image": getImageUrl(article.featured_image),
    "datePublished": article.published_at || article.created_at,
    "dateModified": article.updated_at || article.published_at || article.created_at,
    "author": {
      "@type": "Person",
      "name": authorName,
    },
    "publisher": {
      "@type": "Organization",
      "name": "GTA 6 Hub",
      "logo": {
        "@type": "ImageObject",
        "url": `${process.env.NEXT_PUBLIC_SITE_URL || "https://gta6-hub-liard.vercel.app"}/logo.png`
      }
    }
  }

  // 3. Calculate reading time (200 WPM)
  const wordCount = article.content ? article.content.split(/\s+/).length : 0
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  // 4. Fetch comments (approved only)
  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select("id, name, content, created_at")
    .eq("article_id", article.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  if (commentsError) {
    console.error("[ArticlePage Comments Fetch Error]:", commentsError)
  }

  // 5. Get tag IDs for matching related articles
  const { data: artTags, error: artTagsError } = await supabase
    .from("article_tags")
    .select("tag_id")
    .eq("article_id", article.id)

  if (artTagsError) {
    console.error("[ArticlePage Tag Fetch Error]:", artTagsError)
  }

  const tagIds = (artTags || []).map((t) => t.tag_id)

  let related: any[] = []
  if (tagIds.length > 0) {
    const { data: relArticles, error: relError } = await supabase
      .from("article_tags")
      .select("article_id")
      .in("tag_id", tagIds)
      .neq("article_id", article.id)
      .limit(10)

    if (relError) {
      console.error("[ArticlePage Related Article Tags Error]:", relError)
    }

    const relatedIds = (relArticles || []).map((r) => r.article_id)
    if (relatedIds.length > 0) {
      const { data: arts, error: artsError } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, featured_image, published_at")
        .in("id", relatedIds)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3)

      if (artsError) {
        console.error("[ArticlePage Related Articles Query Error]:", artsError)
      }

      related = arts || []
    }
  }

  if (related.length < 3) {
    const { data: fallback, error: fallbackError } = await supabase
      .from("articles")
      .select("id, title, slug, excerpt, featured_image, published_at")
      .neq("id", article.id)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(3 - related.length)

    if (fallbackError) {
      console.error("[ArticlePage Fallback Related Query Error]:", fallbackError)
    }

    related = [...related, ...(fallback || [])]
  }

  // Construct absolute article URL for sharing
  const articleUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://gta6-hub-liard.vercel.app"}/news/${article.slug}`
  const encodedTitle = encodeURIComponent(article.title)
  const encodedUrl = encodeURIComponent(articleUrl)

  const shareLinks = {
    x: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    reddit: `https://www.reddit.com/submit?title=${encodedTitle}&url=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
  }

  return (
    <div className="relative w-full">
      {/* Google AdSense Initializer */}
      <AdSenseInitializer publisherId={publisherId} />

      {/* JSON-LD Structured Data */}
      <JsonLd data={articleSchema} />

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
          {categoryData && (
            <>
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
              <Link
                href={`/news?category=${categoryData.slug}`}
                className="hover:text-neon-pink transition-colors"
              >
                {categoryData.name}
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
              <div className="flex flex-wrap items-center gap-2">
                {categoryData && (
                  <span className="text-xs font-extrabold uppercase tracking-widest text-neon-pink bg-neon-pink/10 border border-neon-pink/25 rounded-md px-2.5 py-1 inline-block">
                    {categoryData.name}
                  </span>
                )}
                {article.rumor_status === "confirmed" && (
                  <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-md px-2.5 py-1 inline-flex items-center gap-1">
                    ✓ Confirmed Info
                  </span>
                )}
                {(article.rumor_status === "rumor" || article.rumor_status === "unconfirmed") && (
                  <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-md px-2.5 py-1 inline-flex items-center gap-1">
                    ⚡ Reported / Unconfirmed
                  </span>
                )}
                {article.rumor_status === "debunked" && (
                  <span className="text-xs font-extrabold uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-2.5 py-1 inline-flex items-center gap-1">
                    ✕ Debunked
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                {article.title}
              </h1>

              {article.excerpt && (
                <p className="text-sm sm:text-base text-foreground/80 font-medium leading-relaxed border-l-2 border-[#FF8A3D] pl-3 py-0.5 my-2">
                  {article.excerpt}
                </p>
              )}

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

            {/* Affiliate Disclosure Notice */}
            {hasAffiliate && (
              <div className="bg-neon-blue/10 border border-neon-blue/20 p-4 rounded-xl text-xs text-foreground/80 flex items-start space-x-2.5 leading-relaxed">
                <span className="text-base flex-shrink-0">🛍️</span>
                <p>
                  <strong className="text-white font-bold">Disclosure:</strong> This page contains affiliate links. If you make a purchase through them, we may earn a small commission at no extra cost to you.
                </p>
              </div>
            )}

            {/* Article Content Area */}
            <ArticleContentRenderer content={articleContentWithAffiliate} />

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

            {/* AdSense Sidebar Slot */}
            {publisherId && (
              <div className="bg-card-bg border border-card-border rounded-xl p-6 shadow-md space-y-2">
                <span className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest block text-center mb-1">
                  Advertisement
                </span>
                <ins className="adsbygoogle"
                     style={{ display: "block" }}
                     data-ad-client={publisherId}
                     data-ad-slot="4444444444"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
              </div>
            )}

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
