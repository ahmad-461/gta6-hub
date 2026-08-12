import { supabase } from "./supabase"

// Client-side lightweight anonymous community points persistence manager
export function getOrCreateAnonId(): string {
  if (typeof window === "undefined") return ""

  let anonId = localStorage.getItem("gta6_community_anon_id")
  if (!anonId) {
    // Generate simple compliant UUID variant client-side
    anonId = "anon-" + Math.random().toString(36).substring(2, 15) + "-" + Math.random().toString(36).substring(2, 15)
    localStorage.setItem("gta6_community_anon_id", anonId)
  }
  return anonId
}

export async function getClientPoints(): Promise<number> {
  const anonId = getOrCreateAnonId()
  if (!anonId) return 0

  try {
    const { data, error } = await supabase
      .from("community_points")
      .select("points")
      .eq("anon_id", anonId)
      .maybeSingle()

    if (error) {
      console.error("Failed to retrieve points:", error)
      return 0
    }

    return data?.points || 0
  } catch (err) {
    console.error("Points sync error:", err)
    return 0
  }
}

export async function incrementClientPoints(incrementBy: number): Promise<number> {
  const anonId = getOrCreateAnonId()
  if (!anonId) return 0

  try {
    // Retrieve current points
    const currentPoints = await getClientPoints()
    const updatedPoints = currentPoints + incrementBy

    // Upsert into community_points
    const { error } = await supabase
      .from("community_points")
      .upsert({
        anon_id: anonId,
        points: updatedPoints,
        updated_at: new Date().toISOString()
      }, { onConflict: "anon_id" })

    if (error) {
      console.error("Failed to upsert points:", error)
      return currentPoints
    }

    return updatedPoints
  } catch (err) {
    console.error("Increment points failed:", err)
    return 0
  }
}
