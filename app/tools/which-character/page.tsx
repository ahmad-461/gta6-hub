import React, { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, Swords } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import QuizClient from "./QuizClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "GTA 6 Character Quiz - Find Your Alter-Ego",
  description: "Take the 8-question personality and playstyle quiz to see which Grand Theft Auto VI protagonist or character matches your crime style.",
}

async function getPublishedCharacters() {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("characters")
      .select("id, name, slug, biography, stats_json, featured_image")
      .eq("status", "published")

    if (error || !data) {
      console.warn("Failed to fetch characters from Supabase, or table is empty:", error)
      return []
    }

    return data
  } catch (err) {
    console.warn("Error connecting to Supabase in which-character page:", err)
    return []
  }
}

export default async function CharacterQuizPage() {
  const characters = await getPublishedCharacters()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow">
      <div className="mb-8">
        <Link
          href="/tools"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-neon-blue hover:text-neon-pink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tools</span>
        </Link>
      </div>

      <div className="mb-8 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2 justify-center sm:justify-start">
          <Swords className="w-8 h-8 text-neon-pink mx-auto sm:mx-0 animate-bounce" />
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Which Character Are You?
          </h1>
        </div>
        <p className="text-foreground/60 max-w-2xl">
          Discover your Grand Theft Auto 6 identity! Find out if you share Lucia&apos;s calculated master planning, Jason&apos;s high-octane tactical chaos, or another syndicate operator&apos;s street smarts.
        </p>
      </div>

      <Suspense fallback={
        <div className="bg-card-bg/60 border border-card-border p-12 rounded-xl text-center space-y-4 backdrop-blur-sm min-h-[300px] flex flex-col justify-center items-center">
          <div className="w-12 h-12 border-4 border-neon-pink/20 border-t-neon-pink rounded-full animate-spin" />
          <p className="text-foreground/60 text-sm">Initializing character database files...</p>
        </div>
      }>
        <QuizClient dbCharacters={characters} />
      </Suspense>
    </div>
  )
}
