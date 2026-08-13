import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { locationId } = body

    if (!locationId) {
      return NextResponse.json({ error: "locationId is required" }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdminClient()

    // Increment view count in database
    // Try custom RPC function first
    const { error: rpcError } = await supabaseAdmin.rpc("increment_location_view", {
      location_id: locationId,
    })

    if (rpcError) {
      console.warn(`RPC increment failed for location ${locationId}, attempting direct increment fallback`, rpcError)

      // Direct SQL-like update fallback
      const { data: existing, error: selectError } = await supabaseAdmin
        .from("map_locations")
        .select("view_count")
        .eq("id", locationId)
        .maybeSingle()

      if (!selectError && existing) {
        const nextCount = (existing.view_count || 0) + 1
        await supabaseAdmin
          .from("map_locations")
          .update({ view_count: nextCount })
          .eq("id", locationId)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Failed to increment map location view:", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}
