import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import mockData from "@/data/mock-insights.json"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // SECURE LAYER: Restrict the proxy API route to authenticated Admin users only
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Access requires active secure session." },
        { status: 401 }
      )
    }

    // Verify admin role in profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Restricted to administrators only." },
        { status: 403 }
      )
    }

    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || "http://localhost:8000"
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET || "super-secret-gta6-key-1337"

    // Set a strict 6-second timeout for the python service fetch requests
    const fetchWithTimeout = async (endpoint: string) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6000)

      try {
        const res = await fetch(`${pythonServiceUrl}${endpoint}`, {
          method: "GET",
          headers: {
            "X-Internal-Key": internalSecret,
            "Content-Type": "application/json"
          },
          signal: controller.signal,
          next: { revalidate: 0 } // Disable fetch caching
        })
        clearTimeout(timeoutId)

        if (!res.ok) {
          throw new Error(`Python service returned status ${res.status} for ${endpoint}`)
        }
        return await res.json()
      } catch (err) {
        clearTimeout(timeoutId)
        throw err
      }
    }

    // Call all three Python service endpoints in parallel
    const [statsResult, seoResult, topicResult] = await Promise.allSettled([
      fetchWithTimeout("/api/content-stats"),
      fetchWithTimeout("/api/seo-audit"),
      fetchWithTimeout("/api/topic-coverage")
    ])

    const stats = statsResult.status === "fulfilled" ? statsResult.value : null
    const seo = seoResult.status === "fulfilled" ? seoResult.value : null
    const topics = topicResult.status === "fulfilled" ? topicResult.value : null

    // If all three calls failed, degrade gracefully by returning the local mock data
    if (!stats && !seo && !topics) {
      return NextResponse.json({
        success: true,
        is_mock: true,
        error: "Python microservice is temporarily offline or unreachable.",
        stats: mockData.stats,
        seo: mockData.seo,
        topics: mockData.topics
      })
    }

    return NextResponse.json({
      success: true,
      is_mock: false,
      stats,
      seo,
      topics
    })
  } catch (error: any) {
    console.error("Next.js Insights API proxy failed:", error)
    // Fallback to mock data in case of unexpected errors in the proxy logic
    return NextResponse.json({
      success: true,
      is_mock: true,
      error: error.message || "An unexpected error occurred in the proxy layer.",
      stats: mockData.stats,
      seo: mockData.seo,
      topics: mockData.topics
    })
  }
}
