import React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Github, Linkedin, Mail, ShieldCheck, ArrowRight, BookOpen, CheckCircle, Award } from "lucide-react"
import JsonLd from "@/components/JsonLd"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"

export const metadata: Metadata = {
  title: "Ahmad Khan — Author & Founder Dossier | GTA 6 Hub",
  description: "Official author profile and editorial credentials for Ahmad Khan, Founder and Lead Editor of GTA 6 Hub.",
  openGraph: {
    title: "Ahmad Khan — Author Dossier",
    description: "Official author profile and editorial credentials for Ahmad Khan, Founder & Editor of GTA 6 Hub.",
  },
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

export default async function AuthorPage() {
  const isDummy =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy-supabase-url.supabase.co")

  let articles: any[] = []

  if (!isDummy) {
    try {
      const supabase = createSupabaseServerClient()
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, featured_image, published_at, category, rumor_status")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(6)

      if (error) {
        console.error("[AuthorPage Articles Fetch Error]:", error)
      } else {
        articles = data || []
      }
    } catch (err) {
      console.error("[AuthorPage Exception]:", err)
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gta6-hub-liard.vercel.app"

  // Person Schema JSON-LD
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl}/author#person`,
    "name": "Ahmad Khan",
    "jobTitle": "Founder & Editor",
    "worksFor": {
      "@type": "Organization",
      "name": "GTA 6 Hub",
      "url": siteUrl,
    },
    "url": `${siteUrl}/author`,
    "sameAs": [
      "https://github.com/ahmad-461",
      "https://www.linkedin.com/in/ahmad-khan-77441833a",
    ],
    "knowsAbout": [
      "Grand Theft Auto VI",
      "Game Development Analysis",
      "Open World Systems Architecture",
      "Full Stack Web Development",
    ],
  }

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Author",
        "item": `${siteUrl}/author`,
      },
    ],
  }

  return (
    <div className="flex-grow flex flex-col relative bg-[#0B0710] overflow-hidden text-[#F5F0FA]">
      <JsonLd data={personSchema} />
      <JsonLd data={breadcrumbSchema} />

      <div className="film-grain opacity-5 pointer-events-none" />

      {/* Atmospheric Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#FF2E88]/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#00E5FF]/10 blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 space-y-16">
        {/* Header Breadcrumb */}
        <nav className="flex items-center space-x-2 font-mono text-xs text-[#9C8FAE] uppercase tracking-wider">
          <Link href="/" className="hover:text-[#00E5FF] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#F5F0FA]">Author Profile</span>
        </nav>

        {/* Hero Profile Dossier */}
        <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] rounded-2xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FF2E88]/15 via-[#00E5FF]/10 to-transparent blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left: Avatar & Badges */}
            <div className="md:col-span-4 flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-[#FF2E88] via-purple-600 to-[#00E5FF] p-1 shadow-[0_0_30px_rgba(255,46,136,0.3)]">
                  <div className="w-full h-full rounded-full bg-[#0B0710] flex items-center justify-center font-anton text-4xl sm:text-5xl text-white">
                    AK
                  </div>
                </div>
                <div className="absolute bottom-1 right-1 p-2 rounded-full bg-[#0B0710] border border-[#00E5FF] text-[#00E5FF] shadow-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-1 font-mono">
                <h1 className="text-2xl sm:text-3xl font-anton uppercase text-[#F5F0FA]">
                  Ahmad Khan
                </h1>
                <p className="text-xs text-[#00E5FF] font-bold uppercase tracking-widest">
                  Founder & Lead Editor
                </p>
                <p className="text-[10px] text-[#9C8FAE]/70 uppercase tracking-wider">
                  GTA 6 Hub Editorial Directorate
                </p>
              </div>

              {/* Verified Connect Links */}
              <div className="flex items-center gap-3 pt-2 font-mono text-xs">
                <a
                  href="https://github.com/ahmad-461"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B0710] border border-[rgba(245,240,250,0.14)] text-[#9C8FAE] hover:text-[#00E5FF] hover:border-[#00E5FF]/50 transition-all"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/ahmad-khan-77441833a"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B0710] border border-[rgba(245,240,250,0.14)] text-[#9C8FAE] hover:text-[#00E5FF] hover:border-[#00E5FF]/50 transition-all"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </a>
                <a
                  href="mailto:ahmad.khan8747763@gmail.com"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B0710] border border-[rgba(245,240,250,0.14)] text-[#9C8FAE] hover:text-[#00E5FF] hover:border-[#00E5FF]/50 transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span>Contact</span>
                </a>
              </div>
            </div>

            {/* Right: Detailed Bio & Credentials */}
            <div className="md:col-span-8 space-y-6 text-left">
              <div className="space-y-2 border-b border-[rgba(245,240,250,0.1)] pb-4">
                <div className="flex items-center space-x-2 font-mono text-xs text-[#FF8A3D]">
                  <Award className="w-4 h-4" />
                  <span className="font-bold uppercase tracking-widest">VERIFIED AUTHOR DOSSIER</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-anton uppercase text-[#F5F0FA]">
                  EDITORIAL BACKGROUND & PURPOSE
                </h2>
              </div>

              <div className="space-y-4 text-sm text-[#9C8FAE] leading-relaxed">
                <p>
                  Ahmad Khan is the founder and lead editor of GTA 6 Hub. Dedicated to delivering high-fidelity, database-first coverage for Grand Theft Auto VI, Ahmad launched the site to provide players, researchers, and gaming enthusiasts with objective telemetry, interactive state mapping, and frame-by-frame trailer breakdowns.
                </p>
                <p>
                  With a background in computer science and full-stack web software architecture, Ahmad engineered GTA 6 Hub from the ground up utilizing Next.js Server Components, real-time database indexing, and custom AI vector retrieval. His editorial focus strictly separates confirmed official disclosures from unverified rumors, upholding a clear, transparent verification standard across every article published.
                </p>
              </div>

              {/* Guiding Principles Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-xs">
                <div className="p-3 rounded-lg bg-[#0B0710] border border-[rgba(245,240,250,0.1)] flex items-start space-x-2.5">
                  <CheckCircle className="w-4 h-4 text-[#00E5FF] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block uppercase">Primary Source First</span>
                    <span className="text-[11px] text-[#9C8FAE]/80">Traceable references to Rockstar Games and Take-Two filings.</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#0B0710] border border-[rgba(245,240,250,0.1)] flex items-start space-x-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#FF2E88] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block uppercase">Epistemic Transparency</span>
                    <span className="text-[11px] text-[#9C8FAE]/80">Explicit Confirmed, Reported, and Debunked labeling.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Published Articles */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-[rgba(245,240,250,0.14)] pb-4">
            <div className="space-y-1">
              <span className="text-xs font-bold font-mono text-[#00E5FF] uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                BYLINE CATALOG
              </span>
              <h2 className="text-2xl sm:text-3xl font-anton uppercase text-[#F5F0FA]">
                Articles & Briefings by Ahmad Khan
              </h2>
            </div>
            <Link
              href="/news"
              className="text-xs font-mono font-bold text-[#FF2E88] hover:underline flex items-center gap-1 uppercase"
            >
              Browse All News <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((art) => (
                <Card key={art.id} variant="standard" padding="none" interactive className="group flex flex-col justify-between h-full">
                  <div>
                    <div className="relative w-full h-48 overflow-hidden bg-[#0B0710]">
                      <Image
                        src={art.featured_image || "/og-image.jpg"}
                        alt={art.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-[#00E5FF] font-bold uppercase tracking-wider">
                          {art.category || "Intel"}
                        </span>
                        {art.rumor_status === "confirmed" && (
                          <Badge color="cyan" variant="subtle">✓ Confirmed</Badge>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white group-hover:text-[#FF2E88] transition-colors line-clamp-2 leading-snug">
                        <Link href={`/news/${art.slug}`}>{art.title}</Link>
                      </h3>
                      <p className="text-xs text-[#9C8FAE] line-clamp-3 leading-relaxed">
                        {art.excerpt}
                      </p>
                    </div>
                  </div>
                  <div className="p-5 pt-0 flex items-center justify-between text-[10px] font-mono text-[#9C8FAE]/60">
                    <span>{formatDate(art.published_at)}</span>
                    <Link href={`/news/${art.slug}`} className="text-[#FF2E88] font-bold hover:underline flex items-center gap-1">
                      READ <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-[rgba(245,240,250,0.14)] rounded-xl font-mono text-xs text-[#9C8FAE]">
              No articles cataloged at this moment. Explore our full news feed at <Link href="/news" className="text-[#00E5FF] underline">/news</Link>.
            </div>
          )}
        </section>

        {/* Links to Editorial Standards */}
        <div className="p-6 rounded-xl bg-[#150C1F]/60 border border-[rgba(245,240,250,0.14)] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-white font-bold block uppercase">How We Review & Fact-Check Intel</span>
            <p className="text-[#9C8FAE] text-[11px]">Learn about our verification criteria, rumor status taxonomy, and AI transparency policy.</p>
          </div>
          <Link
            href="/editorial-standards"
            className="px-4 py-2 rounded bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 font-bold hover:bg-[#00E5FF]/20 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <span>Read Editorial Standards</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
