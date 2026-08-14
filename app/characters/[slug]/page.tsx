import React from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { ArrowLeft, User, ShieldAlert, Users, Mic, Landmark } from "lucide-react"
import DossierShareButton from "@/components/DossierShareButton"

export const revalidate = 3600

interface CharacterPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: CharacterPageProps): Promise<Metadata> {
  const supabase = createSupabaseServerClient()
  const { data: char } = await supabase
    .from("characters")
    .select("name, biography")
    .eq("slug", params.slug)
    .maybeSingle()

  if (!char) {
    return {
      title: "Character Not Found | GTA VI Hub",
    }
  }

  const domain = "https://gta6-hub-liard.vercel.app"

  return {
    title: `${char.name} - Profile & Biography | GTA VI Hub`,
    description: `Full lore, biography, statistics, and voice actor information for ${char.name} on GTA VI Hub.`,
    openGraph: {
      title: `${char.name} - Profile & Biography | GTA VI Hub`,
      description: `Full lore, biography, statistics, and voice actor information for ${char.name} on GTA VI Hub.`,
      images: [
        {
          url: `${domain}/api/og/character/${params.slug}`,
          width: 1200,
          height: 630,
          alt: `${char.name} Intel Dossier`,
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${char.name} - Profile & Biography | GTA VI Hub`,
      description: `Full lore, biography, statistics, and voice actor information for ${char.name} on GTA VI Hub.`,
      images: [`${domain}/api/og/character/${params.slug}`],
    }
  }
}

function getImageUrl(url?: string | null) {
  if (!url) return "/og-image.jpg"
  return url
}

export default async function CharacterProfilePage({ params }: CharacterPageProps) {
  const supabase = createSupabaseServerClient()

  // Fetch character details where status = 'published'
  const { data: char } = await supabase
    .from("characters")
    .select("id, name, slug, biography, featured_image, stats_json")
    .eq("slug", params.slug)
    .eq("status", "published")
    .maybeSingle()

  if (!char) {
    notFound()
  }

  const stats = (char.stats_json || {}) as Record<string, string>

  // Stats rows mapping
  const statsRows = [
    { label: "Role", value: stats.role || "Unknown", icon: User },
    { label: "Status", value: stats.status || "Unknown", icon: ShieldAlert },
    { label: "Affiliation", value: stats.affiliation || "None / Unknown", icon: Users },
    { label: "Voice Actor", value: stats.voice_actor || stats.voiceActor || "TBA", icon: Mic },
    { label: "First Appearance", value: stats.first_appearance || stats.firstAppearance || "Trailer 1", icon: Landmark },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-8">
      {/* Back Button */}
      <div>
        <Link
          href="/characters"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground/45 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Characters
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Portrait and Stats Card */}
        <div className="md:col-span-5 space-y-6">
          <div className="relative w-full h-[320px] sm:h-[480px] rounded-2xl overflow-hidden border border-card-border shadow-2xl">
            <Image
              src={getImageUrl(char.featured_image)}
              alt={char.name}
              fill
              className="object-cover object-top"
              priority
              sizes="(max-w-768px) 100vw, 40vw"
            />
          </div>

          {/* Stats Card */}
          <div className="bg-card-bg border border-card-border rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white border-b border-card-border pb-2.5">
              Profile Summary
            </h3>
            <div className="space-y-3.5">
              {statsRows.map((row, index) => {
                const Icon = row.icon
                return (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-foreground/45 flex items-center gap-2 font-bold uppercase tracking-wide text-xs">
                      <Icon className="w-4 h-4 text-neon-purple flex-shrink-0" />
                      {row.label}
                    </span>
                    <span className="text-white font-extrabold text-right ml-4">
                      {row.value}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Character Details / Biography */}
        <div className="md:col-span-7 space-y-6 bg-card-bg/40 border border-card-border rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-neon-purple block">
                GTA VI Core Cast
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {char.name}
              </h1>
            </div>

            {/* Share Dossier Interactive Button */}
            <div className="shrink-0">
              <DossierShareButton slug={char.slug} characterName={char.name} />
            </div>
          </div>

          <div className="w-full h-[1px] bg-gradient-to-r from-card-border via-transparent to-transparent" />

          <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-foreground/95 prose-p:mb-5 [&_p]:mb-4 [&_h2]:text-white [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:mt-6 [&_h2]:mb-3">
            {/* If the biography is rich text HTML, render it safely. Otherwise, just wrap it. */}
            {char.biography.startsWith("<") ? (
              <div dangerouslySetInnerHTML={{ __html: char.biography }} />
            ) : (
              <p className="whitespace-pre-line">{char.biography}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
