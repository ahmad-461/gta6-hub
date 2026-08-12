import React from "react"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import AdminSidebar from "@/components/AdminSidebar"

export const metadata = {
  title: "GTA 6 Hub - Admin Panel",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
  // Note: Middleware already protects routes and redirects non-logged in users from pages under /admin,
  // except for /admin/login which has custom layout display.
  // We can trust the user status passed from middleware.
  if (!user) {
    return <div className="min-h-screen bg-background">{children}</div>
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

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background text-foreground animate-fade-in">
      <AdminSidebar user={adminUser} />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
