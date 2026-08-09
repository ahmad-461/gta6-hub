import React from "react"
import Link from "next/link"
import { ArrowLeft, ShieldAlert } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import CheatFinderClient, { CheatCode } from "./CheatFinderClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "GTA 6 Cheat Code Finder",
  description: "Search, filter, and find verified cheat codes for Grand Theft Auto VI across PS5, Xbox Series X/S, and PC.",
}

async function getCheatCodes(): Promise<CheatCode[]> {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("cheat_codes")
      .select("*")
      .order("category", { ascending: true })

    if (error || !data) {
      console.warn("Failed to fetch cheat codes from Supabase, or table is empty:", error)
      return []
    }

    return data as CheatCode[]
  } catch (err) {
    console.warn("Error connecting to Supabase in cheat-finder page:", err)
    return []
  }
}

export default async function CheatFinderPage() {
  const cheats = await getCheatCodes()

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

      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <ShieldAlert className="w-8 h-8 text-neon-yellow animate-pulse" />
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            GTA 6 Cheat Code Finder
          </h1>
        </div>
        <p className="text-foreground/60 max-w-2xl">
          Instantly filter and discover multi-platform cheat inputs. Spawn high-end sports cars, toggle weapons and ammo, change ambient weather, or unlock invincibility in seconds.
        </p>
      </div>

      {/* Main interactive area */}
      <CheatFinderClient initialCheats={cheats} />
    </div>
  )
}
