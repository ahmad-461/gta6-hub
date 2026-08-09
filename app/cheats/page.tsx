import React from "react"
import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import CheatFinderClient, { CheatCode } from "../tools/cheat-finder/CheatFinderClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Cheat Codes",
  description: "Gain invincibility, spawn supercars, obtain unlimited weapons across PS5, Xbox Series X/S, and PC.",
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
    console.warn("Error connecting to Supabase in cheats page:", err)
    return []
  }
}

export default async function CheatsPage() {
  const cheats = await getCheatCodes()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-grow">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <ShieldAlert className="w-8 h-8 text-neon-yellow" />
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Cheat Codes
          </h1>
        </div>
        <p className="text-foreground/60 max-w-2xl">
          Complete, verified multi-platform inputs for weapons, vehicles, weather controls, and player upgrades.
        </p>
      </div>

      <CheatFinderClient initialCheats={cheats} />
    </div>
  )
}
