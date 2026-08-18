"use client"

import React from "react"
import Link from "next/link"
import { ShieldCheck, Mail, ArrowRight } from "lucide-react"

export default function PrivacyPage() {
  const privacyToc = [
    { id: "what-we-collect", text: "1. What We Collect", level: 2 },
    { id: "cookies-storage", text: "2. Cookies & Local Storage", level: 2 },
    { id: "third-party", text: "3. Third-Party Services", level: 2 },
    { id: "contact-us", text: "4. Contact Us", level: 2 },
  ]

  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="flex-grow flex flex-col relative bg-[#0B0710] text-[#F5F0FA]">
      {/* No heavy grain overlays or glow blobs on this page for optimized legal readability */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">

        {/* Header Block */}
        <div className="border-b border-[rgba(245,240,250,0.14)] pb-8 mb-12 space-y-4">
          <div className="flex items-center space-x-2.5 font-mono text-xs text-[#00E5FF] tracking-widest uppercase font-bold">
            <ShieldCheck className="w-5 h-5 text-[#00E5FF]" />
            <span>SECURITY DEPLOYMENT & LEGAL</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-anton uppercase tracking-tight text-[#F5F0FA]">
            Privacy Policy
          </h1>
          <p className="text-xs font-mono text-[#9C8FAE]">
            SYSTEM METRIC / LAST MODIFIED: {lastUpdated}
          </p>
        </div>

        {/* Layout Grid: Content + Sticky TOC Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Detailed Policy Text (8 cols) */}
          <div className="lg:col-span-8 space-y-12 text-[#9C8FAE] text-sm leading-relaxed font-normal">

            <section className="space-y-4">
              <p className="text-[#F5F0FA] text-base">
                Welcome to the GTA 6 Hub privacy framework. This policy details how we handle user data, local storage session telemetry, and our absolute commitment to visitor tracking transparency.
              </p>
              <p>
                Our objective is to deliver standard-setting gameplay utilities and news tracking without relying on invasive commercial tracking routines. We believe that your gaming preferences should remain entirely yours.
              </p>
            </section>

            {/* Section 1 */}
            <section id="what-we-collect" className="space-y-4 pt-4 scroll-mt-24">
              <h2 className="text-2xl font-anton uppercase text-[#F5F0FA] tracking-tight border-b border-[rgba(245,240,250,0.08)] pb-2">
                1. What We Collect
              </h2>
              <p>
                To access the general features of GTA 6 Hub, including our news portal, cheats explorer, and lore connection mappings, you are not required to provide any personal data.
              </p>
              <p className="text-[#F5F0FA]">
                The only exceptions where we receive and process specific visitor telemetry are:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-2">
                <li>
                  <strong className="text-white">Community Comments:</strong> To participate in the discussion board, commenting requires submission of a display Name and Email. This is used solely to associate your post and protect against comment spam.
                </li>
                <li>
                  <strong className="text-white">Administrator Accounts:</strong> Supabase Authentication is strictly reserved for internal site editors and administrative operations. No visitor profiles are indexed or collected.
                </li>
                <li>
                  <strong className="text-white">Contact Submissions:</strong> Form fields submitted through our contact terminal (Name, Email, Message) are routed to our secure inbox via Resend.
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section id="cookies-storage" className="space-y-4 pt-4 scroll-mt-24">
              <h2 className="text-2xl font-anton uppercase text-[#F5F0FA] tracking-tight border-b border-[rgba(245,240,250,0.08)] pb-2">
                2. Cookies &amp; Local Storage
              </h2>
              <p>
                We prioritize lightweight client-side storage states instead of tracking cookies. GTA 6 Hub leverages standard browser <code className="text-[#00E5FF] font-mono bg-[#150C1F] px-1.5 py-0.5 rounded">localStorage</code> to persist user preferences locally on your device:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-2">
                <li>
                  <strong className="text-white">Saved Content:</strong> Handled entirely on your local machine to keep your bookmarked articles readable.
                </li>
                <li>
                  <strong className="text-white">Wanted-Level Meter:</strong> Persists interactive telemetry states across pages.
                </li>
                <li>
                  <strong className="text-white">Anonymous Points Tracker:</strong> Coordinates local visitor action points locally prior to sync operations.
                </li>
              </ul>
              <p>
                This data is not transmitted to external profiling systems and remains fully manageable or deletable via your browser&apos;s standard developer utility tools.
              </p>
            </section>

            {/* Section 3 */}
            <section id="third-party" className="space-y-4 pt-4 scroll-mt-24">
              <h2 className="text-2xl font-anton uppercase text-[#F5F0FA] tracking-tight border-b border-[rgba(245,240,250,0.08)] pb-2">
                3. Third-Party Services
              </h2>
              <p>
                We do not sell, rent, or lease any collected names, email addresses, or session profiles to advertising entities.
              </p>
              <p>
                Our infrastructure relies strictly on the following vetted, industry-standard subprocessors to facilitate critical operational features:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-2">
                <li>
                  <strong className="text-white">Supabase SSR:</strong> Handles core cloud hosting tables and secure role access authorization for our editorial managers.
                </li>
                <li>
                  <strong className="text-white">Resend:</strong> Securely dispatches incoming inquiries from our Contact Terminal with basic spam filtering.
                </li>
                <li>
                  <strong className="text-white">Google AdSense (Optional):</strong> Monetization structures are loaded asynchronously only if settings are globally enabled. They respect standard digital advertising policies.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="contact-us" className="space-y-4 pt-4 scroll-mt-24">
              <h2 className="text-2xl font-anton uppercase text-[#F5F0FA] tracking-tight border-b border-[rgba(245,240,250,0.08)] pb-2">
                4. Contact Us
              </h2>
              <p>
                If you have questions regarding this privacy framework, or if you wish to query the status of data sent via our contact terminal, you can reach out directly:
              </p>
              <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded-lg max-w-xl flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xs text-[#9C8FAE]">
                  <Mail className="w-5 h-5 text-[#00E5FF] shrink-0" />
                  <div>
                    <p className="font-bold text-white uppercase font-mono">Email Terminal</p>
                    <p className="text-[10px] text-[#9C8FAE]/60 font-mono">REPLY EXPECTATION: &lt; 24H</p>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="px-4 py-2 bg-transparent hover:bg-[rgba(0,229,255,0.05)] border border-[#00E5FF] text-[#00E5FF] hover:text-white font-bold uppercase tracking-wider text-[10px] rounded transition-all duration-200 font-mono"
                >
                  CONTACT FORM <ArrowRight className="inline-block w-3 h-3 ml-1" />
                </Link>
              </div>
            </section>

          </div>

          {/* Sticky Table of Contents Sidebar (4 cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            {/* Table of contents */}
            <div className="bg-[#150C1F]/60 border border-[rgba(245,240,250,0.1)] rounded-lg p-4 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FF2E88]">Contents</span>
              <ul className="space-y-1 text-xs text-[#9C8FAE]">
                {privacyToc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="hover:text-white transition">
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
