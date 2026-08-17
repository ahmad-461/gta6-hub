import React from "react"
import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import FaqAccordion, { FaqItem } from "@/components/FaqAccordion"
import EmptyState from "@/components/ui/EmptyState"
import { HelpCircle } from "lucide-react"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Find clear answers to common questions regarding GTA 6 Hub, official GTA VI release details, verification standards, and platform availability.",
}

export default async function FaqPage() {
  const isDummy =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy-supabase-url.supabase.co")

  let faqs: { question: string; answer: string; display_order: number }[] = []

  if (!isDummy) {
    try {
      const supabase = createSupabaseServerClient()
      const { data, error } = await supabase
        .from("site_faqs")
        .select("question, answer, display_order")
        .order("display_order", { ascending: true })

      if (error) {
        console.error("Error fetching site_faqs:", error)
      } else if (data) {
        faqs = data
      }
    } catch (err) {
      console.error("Failed to query site_faqs server-side:", err)
    }
  }

  const faqItems: FaqItem[] = faqs.map((item) => ({
    question: item.question,
    answer: item.answer,
  }))

  return (
    <div className="flex-grow flex flex-col relative bg-[#0B0710] overflow-hidden text-[#F5F0FA] font-mono">
      {/* Cinematic Global Noise Texture */}
      <div className="film-grain opacity-5 pointer-events-none" />

      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#FF2E88]/5 blur-[140px] z-0" />
        <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#FF8A3D]/5 blur-[140px] z-0" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 space-y-10 w-full flex-grow">
        {/* Page Header */}
        <div className="space-y-3 border-b border-[rgba(245,245,247,0.14)] pb-8">
          <div className="flex items-center space-x-2 text-xs font-black tracking-widest text-[#FF8A3D] uppercase">
            <HelpCircle className="w-4 h-4 text-[#FF8A3D]" />
            <span>KNOWLEDGE BASE & SUPPORT</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-anton uppercase text-[#F5F5F7] tracking-wide">
            Frequently Asked Questions
          </h1>

          <p className="text-xs sm:text-sm text-[#9E9EA8] leading-relaxed max-w-2xl">
            Get quick, accurate answers regarding GTA 6 Hub, release timelines, rumor verification confidence tiers, and interactive tools.
          </p>
        </div>

        {/* Content Section */}
        {faqItems.length > 0 ? (
          <FaqAccordion items={faqItems} />
        ) : (
          <EmptyState
            icon={<HelpCircle className="w-12 h-12 text-[#FF8A3D]/40" />}
            title="NO FAQ RECORDS FOUND"
            description="Our intel database currently has no published FAQ entries. Check back soon for updates."
          />
        )}
      </div>
    </div>
  )
}
