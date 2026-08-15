import React from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { ArrowLeft, User, ShieldAlert, Users, Mic, Landmark, FileText } from "lucide-react"
import DossierShareButton from "@/components/DossierShareButton"
import Badge from "@/components/ui/Badge"

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
    title: `${char.name} - Profile & Intelligence Dossier | GTA VI Hub`,
    description: `Full lore, biography, statistics, and voice actor information for ${char.name} on GTA VI Hub.`,
    openGraph: {
      title: `${char.name} - Profile & Intelligence Dossier | GTA VI Hub`,
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
      title: `${char.name} - Profile & Intelligence Dossier | GTA VI Hub`,
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

  const role = stats.role || "Target of Interest"
  const status = stats.status || "Active"
  const affiliation = stats.affiliation || "Vice City Operative"
  const voiceActor = stats.voice_actor || stats.voiceActor || "TBA"
  const firstAppearance = stats.first_appearance || stats.firstAppearance || "Trailer 1"

  // Stats rows mapping
  const statsRows = [
    { label: "Role / Classification", value: role, icon: User },
    { label: "Current Status", value: status, icon: ShieldAlert },
    { label: "Primary Affiliation", value: affiliation, icon: Users },
    { label: "Voice Actor / Performer", value: voiceActor, icon: Mic },
    { label: "First Cataloged", value: firstAppearance, icon: Landmark },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow space-y-8 font-sans">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/characters"
          className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-paper-dim hover:text-[#FF2E88] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Personnel Index
        </Link>
        <div className="flex items-center gap-2">
          <Badge color="magenta" variant="subtle">
            CONFIDENTIAL
          </Badge>
          <span className="text-xs font-mono text-paper-dim/60 hidden sm:inline">
            FILE #{char.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Portrait Hero & Tactical Data Grid */}
        <div className="lg:col-span-5 space-y-6">
          {/* Portrait Hero Card */}
          <div className="relative w-full h-[450px] sm:h-[580px] rounded-2xl overflow-hidden border border-[rgba(245,240,250,0.14)] bg-ink shadow-2xl group">
            <Image
              src={getImageUrl(char.featured_image)}
              alt={char.name}
              fill
              quality={90}
              className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent opacity-90" />
            <div className="absolute bottom-6 left-6 right-6 space-y-2">
              <span className="text-xs font-mono font-bold tracking-widest text-[#FF8A3D] uppercase block">
                {affiliation}
              </span>
              <h1 className="text-4xl sm:text-5xl font-anton uppercase text-white tracking-wide">
                {char.name}
              </h1>
            </div>
          </div>

          {/* Stats & Intelligence Table Card */}
          <div className="bg-ink-2 border border-[rgba(245,240,250,0.14)] rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[rgba(245,240,250,0.1)] pb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FF2E88]" />
                Tactical Breakdown
              </h3>
              <Badge color="green" variant="subtle">
                VERIFIED DATA
              </Badge>
            </div>

            <div className="space-y-4">
              {statsRows.map((row, index) => {
                const Icon = row.icon
                return (
                  <div key={index} className="flex justify-between items-center text-xs sm:text-sm border-b border-[rgba(245,240,250,0.05)] pb-3 last:border-0 last:pb-0">
                    <span className="text-paper-dim font-mono flex items-center gap-2 uppercase tracking-wide">
                      <Icon className="w-4 h-4 text-[#FF8A3D] flex-shrink-0" />
                      {row.label}
                    </span>
                    <span className="text-white font-mono font-bold text-right ml-4">
                      {row.value}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Character Details / Long-form Biography */}
        <div className="lg:col-span-7 space-y-8 bg-ink-2/60 border border-[rgba(245,240,250,0.14)] rounded-2xl p-6 sm:p-10 shadow-2xl">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(245,240,250,0.1)] pb-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge color="magenta" variant="filled">
                  {role}
                </Badge>
                <Badge color="yellow" variant="subtle">
                  STATUS: {status}
                </Badge>
              </div>
              <h2 className="text-3xl sm:text-5xl font-anton uppercase text-white tracking-wider">
                {char.name}
              </h2>
            </div>

            {/* Share Dossier Interactive Button */}
            <div className="shrink-0">
              <DossierShareButton slug={char.slug} characterName={char.name} />
            </div>
          </div>

          {/* Dossier Prose Biography */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#FF8A3D]">
              Classified Field Background
            </h3>
            <div className="prose prose-invert max-w-none text-paper leading-relaxed text-base sm:text-lg prose-p:mb-6 [&_p]:mb-6 [&_h2]:text-white [&_h2]:font-anton [&_h2]:text-2xl [&_h2]:uppercase [&_h2]:mt-8 [&_h2]:mb-4 [&_strong]:text-white [&_strong]:font-bold">
              {/* If the biography is rich text HTML, render it safely. Otherwise, wrap paragraphs. */}
              {char.biography.startsWith("<") ? (
                <div dangerouslySetInnerHTML={{ __html: char.biography }} />
              ) : (
                <p className="whitespace-pre-line text-paper/90 font-sans leading-relaxed">
                  {char.biography}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
