import React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { Shield, ShieldCheck, HelpCircle, ShieldAlert, Cpu, RefreshCw, Mail, CheckCircle2, FileText } from "lucide-react"
import JsonLd from "@/components/JsonLd"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"

export const metadata: Metadata = {
  title: "Editorial Standards & Verification Policy | GTA 6 Hub",
  description: "Learn how GTA 6 Hub verifies information, classifies rumors, maintains AI transparency, and enforces strict corrections policies.",
  openGraph: {
    title: "Editorial Standards & Verification Policy",
    description: "Our complete verification process, rumor status taxonomy, AI transparency disclosure, and corrections framework.",
  },
}

export default function EditorialStandardsPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gta6-hub-liard.vercel.app"

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
        "name": "Editorial Standards",
        "item": `${siteUrl}/editorial-standards`,
      },
    ],
  }

  return (
    <div className="flex-grow flex flex-col relative bg-[#0B0710] overflow-hidden text-[#F5F0FA]">
      <JsonLd data={breadcrumbSchema} />

      <div className="film-grain opacity-5 pointer-events-none" />

      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#00E5FF]/08 blur-[130px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#FF2E88]/08 blur-[130px]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 space-y-16">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 font-mono text-xs text-[#9C8FAE] uppercase tracking-wider">
          <Link href="/" className="hover:text-[#00E5FF] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#F5F0FA]">Editorial Standards</span>
        </nav>

        {/* Hero Header */}
        <div className="space-y-6 max-w-3xl text-left">
          <div className="flex items-center space-x-3 font-mono text-xs text-[#FF2E88] tracking-widest uppercase font-bold">
            <Shield className="w-4 h-4 text-[#FF2E88]" />
            <span>TRUST & CREDIBILITY PROTOCOL</span>
            <span className="h-[1px] w-12 bg-[#FF2E88]" />
          </div>

          <h1 className="text-4xl sm:text-6xl font-anton uppercase tracking-tight text-[#F5F0FA]">
            EDITORIAL STANDARDS & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#00E5FF] to-[#FF2E88] bg-clip-text text-transparent">
              VERIFICATION PROCESS
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#9C8FAE] leading-relaxed font-normal">
            At GTA 6 Hub, we believe that reader trust is earned through rigor, accountability, and epistemic honesty. In an era where gaming news is often dominated by sensationalized clickbait and automated rumor recycling, our editorial team adheres to a strict protocol for sourcing, fact-checking, and status classification.
          </p>
        </div>

        {/* Policy Section 1: Verification & Sourcing */}
        <Card variant="standard" padding="lg" className="space-y-6 bg-[#150C1F] border-[rgba(245,240,250,0.14)]">
          <div className="flex items-center space-x-3 border-b border-[rgba(245,240,250,0.08)] pb-4">
            <CheckCircle2 className="w-6 h-6 text-[#00E5FF]" />
            <h2 className="text-2xl font-anton uppercase text-[#F5F0FA]">
              1. Information Verification & Sourcing Strategy
            </h2>
          </div>

          <div className="space-y-4 text-sm text-[#9C8FAE] leading-relaxed">
            <p>
              We prioritize primary sources above all else. Every factual claim published across our news feed, lore maps, and character directories is evaluated according to source authority:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-sans">
              <li>
                <strong className="text-white font-bold">Primary Official Disclosures:</strong> Direct press releases from Rockstar Games, official announcements on Rockstar Newswire, SEC filings by Take-Two Interactive, or official trailer media releases.
              </li>
              <li>
                <strong className="text-white font-bold">Technical Trailer Telemetry:</strong> Objective, frame-by-frame observational data extracted directly from high-bitrate official video releases (e.g. licensed vehicles, real-time lighting rendering, coordinate typography).
              </li>
              <li>
                <strong className="text-white font-bold">Vetted Investigative Journalism:</strong> Reports from established Bloomberg, IGN, or Eurogamer investigative reporters with documented records of insider accuracy.
              </li>
            </ul>
            <p>
              We do not publish unverified social media posts, anonymous Reddit threads, or synthetic leaks without explicit secondary corroboration and clear labeling.
            </p>
          </div>
        </Card>

        {/* Policy Section 2: Rumor Taxonomy */}
        <Card variant="standard" padding="lg" className="space-y-6 bg-[#150C1F] border-[rgba(245,240,250,0.14)]">
          <div className="flex items-center space-x-3 border-b border-[rgba(245,240,250,0.08)] pb-4">
            <FileText className="w-6 h-6 text-[#FF8A3D]" />
            <h2 className="text-2xl font-anton uppercase text-[#F5F0FA]">
              2. Content Status Taxonomy
            </h2>
          </div>

          <p className="text-sm text-[#9C8FAE] leading-relaxed">
            To ensure zero ambiguity, every report, feature breakdown, and rumor card is explicitly tagged with a standardized status badge:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* Confirmed */}
            <div className="p-4 rounded-xl bg-[#0B0710] border border-emerald-500/30 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold uppercase">
                <ShieldCheck className="w-4 h-4" />
                <span>CONFIRMED</span>
              </div>
              <p className="text-[#9C8FAE] text-[11px] leading-relaxed font-sans">
                Officially verified by Rockstar Games or Take-Two Interactive through press releases, trailers, or SEC financial filings.
              </p>
            </div>

            {/* Reported / Unconfirmed */}
            <div className="p-4 rounded-xl bg-[#0B0710] border border-amber-500/30 space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 font-bold uppercase">
                <HelpCircle className="w-4 h-4" />
                <span>REPORTED / RUMOR</span>
              </div>
              <p className="text-[#9C8FAE] text-[11px] leading-relaxed font-sans">
                Backed by credible investigative reporting or corroborating insider data, but awaiting direct first-party confirmation.
              </p>
            </div>

            {/* Debunked */}
            <div className="p-4 rounded-xl bg-[#0B0710] border border-rose-500/30 space-y-2">
              <div className="flex items-center space-x-2 text-rose-400 font-bold uppercase">
                <ShieldAlert className="w-4 h-4" />
                <span>DEBUNKED</span>
              </div>
              <p className="text-[#9C8FAE] text-[11px] leading-relaxed font-sans">
                Proven false, fabricated, or formally refuted by primary studio representatives or evidence-based analysis.
              </p>
            </div>

            {/* Speculation */}
            <div className="p-4 rounded-xl bg-[#0B0710] border border-[#00E5FF]/30 space-y-2">
              <div className="flex items-center space-x-2 text-[#00E5FF] font-bold uppercase">
                <Shield className="w-4 h-4" />
                <span>SPECULATION</span>
              </div>
              <p className="text-[#9C8FAE] text-[11px] leading-relaxed font-sans">
                Theoretical analytical deduction or community hypothesis based on pattern analysis and series history.
              </p>
            </div>
          </div>
        </Card>

        {/* Policy Section 3: AI Transparency Disclosure */}
        <Card variant="standard" padding="lg" className="space-y-6 bg-[#150C1F] border-[rgba(245,240,250,0.14)]">
          <div className="flex items-center space-x-3 border-b border-[rgba(245,240,250,0.08)] pb-4">
            <Cpu className="w-6 h-6 text-[#00E5FF]" />
            <h2 className="text-2xl font-anton uppercase text-[#F5F0FA]">
              3. AI Assistance & Disclosure
            </h2>
          </div>

          <div className="space-y-4 text-sm text-[#9C8FAE] leading-relaxed">
            <p>
              GTA 6 Hub utilizes specialized artificial intelligence tools (including our interactive AI Investigator RAG system and editorial assistance models). We maintain full transparency regarding AI deployment:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-sans">
              <li>
                <strong className="text-white font-bold">Human Review Mandatory:</strong> AI assists with drafting summaries, organizing structured data, and querying site embeddings. However, <span className="text-[#00E5FF] font-semibold">100% of published articles, guides, and dossiers are thoroughly reviewed, edited, and fact-checked by human editor Ahmad Khan</span> prior to publishing.
              </li>
              <li>
                <strong className="text-white font-bold">RAG Retrieval Boundary:</strong> The AI Investigator tool operates strictly against our indexed, verified database documents. RAG responses transmit source document links and similarity metrics directly in the interface.
              </li>
            </ul>
          </div>
        </Card>

        {/* Policy Section 4: Corrections & Updates */}
        <Card variant="standard" padding="lg" className="space-y-6 bg-[#150C1F] border-[rgba(245,240,250,0.14)]">
          <div className="flex items-center space-x-3 border-b border-[rgba(245,240,250,0.08)] pb-4">
            <RefreshCw className="w-6 h-6 text-[#FF2E88]" />
            <h2 className="text-2xl font-anton uppercase text-[#F5F0FA]">
              4. Corrections & Revision Policy
            </h2>
          </div>

          <div className="space-y-4 text-sm text-[#9C8FAE] leading-relaxed">
            <p>
              If we get something wrong, we fix it promptly and transparently. Our correction policy dictates:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-sans">
              <li>
                <strong className="text-white font-bold">Visible Timestamps:</strong> Every article page prominently displays both original publication date and the &quot;Last Updated&quot; / &quot;Last Verified&quot; timestamp whenever content is modified.
              </li>
              <li>
                <strong className="text-white font-bold">Substantive Corrections:</strong> Significant factual corrections are annotated with an Editor&apos;s Note at the bottom or top of the article detailing what was corrected and why.
              </li>
              <li>
                <strong className="text-white font-bold">Status Transitions:</strong> As rumors transition into official confirmation or debunked status, we update the status badge and log the transition in our intelligence records.
              </li>
            </ul>
          </div>
        </Card>

        {/* Policy Section 5: Reader Corrections & Contact */}
        <Card variant="console" padding="lg" className="space-y-4 text-center max-w-2xl mx-auto">
          <Mail className="w-8 h-8 text-[#FF8A3D] mx-auto" />
          <h3 className="text-xl font-anton uppercase text-white">
            REPORT AN INACCURACY
          </h3>
          <p className="text-xs text-[#9C8FAE] leading-relaxed font-sans">
            Spot a factual error or broken reference? We welcome community scrutiny. Contact our editor directly at{" "}
            <a href="mailto:ahmad.khan8747763@gmail.com" className="text-[#00E5FF] underline font-mono font-bold">
              ahmad.khan8747763@gmail.com
            </a>{" "}
            or utilize our <Link href="/contact" className="text-[#FF2E88] underline font-mono font-bold">Contact Page</Link>.
          </p>
        </Card>
      </div>
    </div>
  )
}
