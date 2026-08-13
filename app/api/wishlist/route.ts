import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    const { data, error } = await supabaseAdmin
      .from("wishlist_votes")
      .select("item_slug, votes")

    if (error) {
      console.warn("Could not load wishlist votes from DB, using empty fallback", error)
      return NextResponse.json({ votes: [] })
    }

    return NextResponse.json({ votes: data || [] })
  } catch (err: any) {
    console.error("Failed to fetch wishlist votes:", err)
    return NextResponse.json({ votes: [] })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { slugs } = body

    if (!slugs || !Array.isArray(slugs) || slugs.length === 0) {
      return NextResponse.json({ error: "Invalid request. Array of item slugs is required." }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdminClient()

    // Increment votes for each selected slug
    // Limit to 9 items maximum (3 per category) to prevent spamming
    const filteredSlugs = slugs.slice(0, 9)

    for (const slug of filteredSlugs) {
      const { error } = await supabaseAdmin.rpc("increment_wishlist_vote", {
        target_slug: slug,
      })
      if (error) {
        console.error(`Failed to increment vote for slug: ${slug}`, error)
        // If RPC is missing because migration hasn't been manually applied yet in some env,
        // we fallback to direct upsert for seamless resilience!
        const { data: existing } = await supabaseAdmin
          .from("wishlist_votes")
          .select("votes")
          .eq("item_slug", slug)
          .maybeSingle()

        const currentVotes = existing?.votes || 0
        await supabaseAdmin
          .from("wishlist_votes")
          .upsert({ item_slug: slug, votes: currentVotes + 1 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Failed to record wishlist votes:", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}
