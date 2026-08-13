import React from "react"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import AdminSidebar from "@/components/AdminSidebar"
import { headers } from "next/headers"

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
    guides: "Guides",
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
    return <div className="min-h-screen bg-ink">{children}</div>
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-ink text-paper">
      <AdminSidebar user={adminUser} />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Dynamic Breadcrumbs and Status Header Bar */}
        <header className="bg-ink-2 border-b border-[rgba(245,240,250,0.14)] py-4 px-6 lg:px-8 flex items-center justify-between font-mono shrink-0">
          <div className="flex items-center space-x-2 text-xs font-bold text-paper-dim">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-magenta">/</span>}
                <span className={idx === breadcrumbs.length - 1 ? "text-paper" : ""}>{crumb}</span>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {/* Status / Role Badge */}
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-magenta/10 text-magenta border border-magenta/15">
              {adminUser.role}
            </span>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
