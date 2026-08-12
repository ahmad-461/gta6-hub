import React from "react"
import { redirect } from "next/navigation"
import { headers, cookies } from "next/headers"
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
  const reqHeaders = headers()
  const pathname = reqHeaders.get("x-pathname") || ""
  const isPrefetch =
    reqHeaders.get("x-next-router-prefetch") === "1" ||
    reqHeaders.get("purpose") === "prefetch" ||
    reqHeaders.get("sec-fetch-purpose") === "prefetch"

  console.log(`[AUTH DEBUG] AdminLayout rendering. Pathname is: "${pathname}" | isPrefetch: ${isPrefetch}`)
  const isLoginPage = pathname === "/admin/login"

  if (isLoginPage) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  const cookiesList = cookies().getAll().map(c => c.name)
  const hasAuthCookie = cookiesList.some(name => name.includes("auth-token") || name.startsWith("sb-"))
  console.log(`[AUTH DEBUG] AdminLayout Auth Cookie Exist: ${hasAuthCookie} (Found cookies: ${JSON.stringify(cookiesList)})`)

  // Retrieve user session and role server-side
  const supabase = createSupabaseServerClient()

  let user = null
  let authMethodUsed = "none"
  let errorLogged: any = null

  if (isPrefetch) {
    console.log(`[AUTH DEBUG] AdminLayout: Prefetch request detected. Using getSession() to avoid token rotation.`)
    authMethodUsed = "getSession()"
    try {
      const sessionResult = await supabase.auth.getSession()
      user = sessionResult.data?.session?.user || null
    } catch (e: any) {
      console.error(`[AUTH DEBUG] AdminLayout: getSession threw exception:`, e?.message || e)
      errorLogged = e
    }
  } else {
    console.log(`[AUTH DEBUG] AdminLayout: Non-prefetch request. Calling getUser() for strict cryptographic validation.`)
    authMethodUsed = "getUser()"
    try {
      const userResult = await supabase.auth.getUser()
      user = userResult.data?.user || null
    } catch (e: any) {
      console.error(`[AUTH DEBUG] AdminLayout: getUser threw exception:`, e?.message || e)
      errorLogged = e
    }
  }

  if (!user) {
    console.log(`[AUTH REDIRECT SOURCE] admin-layout`)
    console.log(`requested pathname: ${pathname}`)
    console.log(`whether an auth cookie exists: ${hasAuthCookie}`)
    console.log(`auth method used: ${authMethodUsed}`)
    console.log(`error logged: ${JSON.stringify(errorLogged)}`)
    console.log(`user ID if authenticated: none`)
    console.log(`profile result: none`)
    console.log(`role: none`)
    console.log(`authentication decision: redirect (no user)`)
    console.log(`redirect target: /admin/login`)
    redirect("/admin/login")
  }

  // Fetch the user's profile
  console.log(`[AUTH DEBUG] AdminLayout fetching profile for: ${user.id}`)
  let profileResult;
  try {
    profileResult = await supabase
      .from("profiles")
      .select("role, name, disabled")
      .eq("id", user.id)
      .single()
    console.log(`[AUTH DEBUG] AdminLayout profile response: ${JSON.stringify(profileResult)}`)
  } catch (e: any) {
    console.error(`[AUTH DEBUG] AdminLayout profile query threw exception:`, e?.message || e)
    profileResult = { data: null, error: e }
  }
  const profile = profileResult.data

  if (!profile || profile.disabled) {
    // If no profile or disabled, force log out
    console.log(`[AUTH REDIRECT SOURCE] admin-layout`)
    console.log(`requested pathname: ${pathname}`)
    console.log(`whether an auth cookie exists: ${hasAuthCookie}`)
    console.log(`auth method used: ${authMethodUsed}`)
    console.log(`user ID if authenticated: ${user.id}`)
    console.log(`profile result: ${JSON.stringify(profileResult)}`)
    console.log(`role: ${profile?.role || "none"}`)
    console.log(`authentication decision: redirect (disabled or missing profile)`)
    console.log(`redirect target: /admin/login?error=account_disabled`)
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
