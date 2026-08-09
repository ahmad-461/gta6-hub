import React from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowLeft, User, Shield, Landmark, Mic, Milestone } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export const revalidate = 0 // dynamically server-render

interface CharacterPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: CharacterPageProps) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: char } = await supabase
      .from("characters")
      .select("name, biography")
      .eq("slug", params.slug)
      .single()

    if (!char) return {}

    return {
      title: `${char.name} - Character Profile`,
      description: `Complete character database entry for ${char.name}. Explore background story, custom role, affiliation, voice actors, and game appearance lore.`,
    }
  } catch (_) {
    return {}
  }
}

export default async function CharacterPage({ params }: CharacterPageProps) {
  const supabase = createSupabaseServerClient()

  let character: any = null

  try {
    const { data } = await supabase
      .from("characters")
      .select("id, name, slug, biography, stats_json, featured_image")
      .eq("slug", params.slug)
      .eq("status", "published")
      .maybeSingle()

    if (!data) {
      return notFound()
    }

    character = data
  } catch (err) {
    console.error("Error loading character details:", err)
    return notFound()
  }

  const stats = character.stats_json || {}

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-10">

      {/* BACK TO CHARACTERS LINK */}
      <div>
        <Link
          href="/characters"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground/50 hover:text-neon-purple uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> All Characters
        </Link>
      </div>

      {/* DETAILED PROFILE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-card-bg border border-card-border p-6 sm:p-10 rounded-lg shadow-2xl">

        {/* CHARACTER IMAGE (COL SPAN 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-card-border shadow-xl bg-brand-dark">
            <Image
              src={character.featured_image || "/placeholder-character.jpg"}
              alt={character.name}
              fill
              priority
              unoptimized
              className="object-cover object-top"
            />
          </div>
        </div>

        {/* DETAILS TABLE & LORE (COL SPAN 8) */}
        <div className="lg:col-span-8 space-y-8 flex flex-col justify-between">

          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-black tracking-widest text-neon-purple uppercase">
                Leonida Database Entry
              </span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
                {character.name}
              </h1>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-black tracking-widest text-white uppercase border-b border-card-border pb-2">
                Biography
              </h3>
              <p className="text-foreground/80 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {character.biography}
              </p>
            </div>
          </div>

          {/* STATS TABLE */}
          <div className="space-y-4 pt-6 border-t border-card-border/50">
            <h3 className="text-sm font-black tracking-widest text-white uppercase">
              Character Statistics
            </h3>

            <div className="border border-card-border rounded-lg overflow-hidden bg-brand-dark/30">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <tbody>

                  <tr className="border-b border-card-border hover:bg-card-bg/30 transition-all">
                    <td className="p-4 font-black uppercase text-foreground/45 flex items-center gap-2 w-1/3 sm:w-1/4">
                      <User className="w-4 h-4 text-neon-purple" />
                      Role / Identity
                    </td>
                    <td className="p-4 font-bold text-white uppercase tracking-wider">
                      {stats.role || "UNKNOWN"}
                    </td>
                  </tr>

                  <tr className="border-b border-card-border hover:bg-card-bg/30 transition-all">
                    <td className="p-4 font-black uppercase text-foreground/45 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-neon-purple" />
                      Status
                    </td>
                    <td className="p-4 font-bold text-white uppercase tracking-wider">
                      {stats.status || "UNKNOWN"}
                    </td>
                  </tr>

                  <tr className="border-b border-card-border hover:bg-card-bg/30 transition-all">
                    <td className="p-4 font-black uppercase text-foreground/45 flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-neon-purple" />
                      Affiliation
                    </td>
                    <td className="p-4 font-bold text-white uppercase tracking-wider">
                      {stats.affiliation || "NONE"}
                    </td>
                  </tr>

                  <tr className="border-b border-card-border hover:bg-card-bg/30 transition-all">
                    <td className="p-4 font-black uppercase text-foreground/45 flex items-center gap-2">
                      <Mic className="w-4 h-4 text-neon-purple" />
                      Voice Actor
                    </td>
                    <td className="p-4 font-bold text-white uppercase tracking-wider">
                      {stats.voice_actor || "UNCONFIRMED"}
                    </td>
                  </tr>

                  <tr className="hover:bg-card-bg/30 transition-all">
                    <td className="p-4 font-black uppercase text-foreground/45 flex items-center gap-2">
                      <Milestone className="w-4 h-4 text-neon-purple" />
                      First Appearance
                    </td>
                    <td className="p-4 font-bold text-white uppercase tracking-wider">
                      {stats.first_appearance || "OFFICIAL TRAILER #1"}
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
