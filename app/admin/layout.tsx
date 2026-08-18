import React from "react"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { headers } from "next/headers"
import AdminClientLayout from "@/components/AdminClientLayout"

export const metadata = {
  title: "GTA 6 Hub - Admin Panel",
}

// Map path segments to pretty titles for breadcrumbs
function getBreadcrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean)
  // standard display name dictionary
  const dictionary: Record<string, string> = {
    admin: "Admin",
    articles: "Articles",
    characters: "Characters",
    "map-locations": "Map Locations",
    trailers: "Trailers",
    "lore-topics": "Lore Topics",
    cheats: "Cheat Codes",
    media: "Media Library",
    comments: "Comments",
    settings: "Site Settings",
    users: "User Manager",
    new: "Create New",
    insights: "Insights",
    activity: "Audit Trail",
  }

  return parts.map((part) => dictionary[part] || part)
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = headers()
  const pathname = headersList.get("x-pathname") || "/admin"

  // Retrieve user session and role server-side using the official server client
  const supabase = createSupabaseServerClient()

  let user = null
  try {
    const userResult = await supabase.auth.getUser()
    user = userResult.data?.user || null
  } catch (e) {
    console.error("[AUTH] AdminLayout: getUser threw exception:", e)
  }

  // If there's no user, we render children (e.g. login page) or fallback.
  if (!user) {
    return <div className="min-h-screen bg-[#0B0710]">{children}</div>
  }

  // Fetch the user's profile to build adminUser representation
  let profileResult
  try {
    profileResult = await supabase
      .from("profiles")
      .select("role, name")
      .eq("id", user.id)
      .single()
  } catch (e) {
    console.error("[AUTH] AdminLayout profile query threw exception:", e)
    profileResult = { data: null, error: e }
  }
  const profile = profileResult.data

  const adminUser = {
    email: user.email || "",
    name: profile?.name || user.email || "Admin User",
    role: profile?.role || "editor",
  }

  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <AdminClientLayout adminUser={adminUser} breadcrumbs={breadcrumbs}>
      {children}
    </AdminClientLayout>
  )
}
