import React from "react"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
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
  const pathname = headers().get("x-pathname") || ""
  console.log(`[AUTH DEBUG] AdminLayout rendering. Pathname is: "${pathname}"`)
  const isLoginPage = pathname === "/admin/login"

  if (isLoginPage) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  // Retrieve user session and role server-side
  const supabase = createSupabaseServerClient()
  console.log(`[AUTH DEBUG] AdminLayout calling supabase.auth.getUser()...`)
  const { data: { user } } = await supabase.auth.getUser()
  console.log(`[AUTH DEBUG] AdminLayout getUser() returned: ${user ? user.id : "null"}`)

  if (!user) {
    console.log(`[AUTH REDIRECT SOURCE] admin-layout (no user)`)
    redirect("/admin/login")
  }

  // Fetch the user's profile
  console.log(`[AUTH DEBUG] AdminLayout fetching profile for: ${user.id}`)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name, disabled")
    .eq("id", user.id)
    .single()
  console.log(`[AUTH DEBUG] AdminLayout profile response: ${JSON.stringify(profile)}`)

  if (!profile || profile.disabled) {
    // If no profile or disabled, force log out
    console.log(`[AUTH REDIRECT SOURCE] admin-layout (disabled or missing profile)`)
    await supabase.auth.signOut()
    redirect("/admin/login?error=account_disabled")
  }

  const adminUser = {
    email: user.email || "",
    name: profile.name || user.email || "Admin User",
    role: profile.role || "editor",
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
