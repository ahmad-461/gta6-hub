import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // Inject x-pathname header directly on request headers so it persists
  request.headers.set("x-pathname", url.pathname)

  // Standard environment variables with fallback dummy values for build-time static pre-rendering
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy-supabase-url.supabase.co"
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy"

  // 1. Initialize the response and standard cookie/session refresh pattern using createServerClient
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // IMPORTANT: Do not run code between createServerClient and supabase.auth.getUser()
  // to avoid issues with users being randomly logged out.
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user
  } catch (err) {
    console.error("Failed to fetch user in middleware:", err)
  }

  // 2. Check maintenance mode (skip for /admin, /api, static assets — preserve existing bypass logic)
  const isStaticFile =
    url.pathname.startsWith("/_next") ||
    url.pathname.includes(".") ||
    url.pathname === "/favicon.ico"

  const isAdmin = url.pathname.startsWith("/admin")
  const isApi = url.pathname.startsWith("/api")
  const isMaintenancePage = url.pathname === "/maintenance"

  if (!isAdmin && !isApi && !isStaticFile && !isMaintenancePage) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const { data: setting } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "maintenance_mode")
          .maybeSingle()

        if (setting?.value === "true") {
          url.pathname = "/maintenance"
          request.headers.set("x-pathname", "/maintenance")
          const rewriteResponse = NextResponse.rewrite(url, {
            request,
          })
          // Copy refreshed cookies from supabaseResponse to the rewrite response
          supabaseResponse.cookies.getAll().forEach((cookie) => {
            rewriteResponse.cookies.set(cookie.name, cookie.value, {
              path: "/",
              domain: cookie.domain,
              maxAge: cookie.maxAge,
              expires: cookie.expires,
              secure: cookie.secure,
              httpOnly: cookie.httpOnly,
              sameSite: cookie.sameSite,
            })
          })
          return rewriteResponse
        }
      } catch (err) {
        console.error("Failed to check maintenance mode in middleware:", err)
      }
    }
  }

  // Helper to create redirect response with preserved/refreshed cookies copied over
  const createRedirectResponse = (targetUrl: URL) => {
    const redirectResponse = NextResponse.redirect(targetUrl)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: "/",
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        expires: cookie.expires,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
      })
    })
    return redirectResponse
  }

  // 3. If /admin route: check logged in → redirect to /admin/login if not
  if (isAdmin) {
    // If the path is precisely the login route
    if (url.pathname === "/admin/login") {
      if (user) {
        url.pathname = "/admin"
        return createRedirectResponse(url)
      }
      return supabaseResponse
    }

    // For any other admin routes, verify logged in status
    if (!user) {
      url.pathname = "/admin/login"
      return createRedirectResponse(url)
    }

    // 4. If logged in: fetch profile role, handle disabled-account check and editor-role redirect
    let profileResult
    try {
      profileResult = await supabase
        .from("profiles")
        .select("role, disabled")
        .eq("id", user.id)
        .single()
    } catch (e: any) {
      profileResult = { data: null, error: e }
    }

    const profile = profileResult.data

    if (profile?.disabled) {
      // Force log out disabled user
      await supabase.auth.signOut()
      const loginUrl = new URL("/admin/login", request.url)
      loginUrl.searchParams.set("error", "account_disabled")
      const redirectResponse = NextResponse.redirect(loginUrl)
      request.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.delete(cookie.name)
      })
      return redirectResponse
    }

    const role = profile?.role || "editor"

    // Editor trying to access user manager or site settings
    if (role === "editor" && (url.pathname.startsWith("/admin/users") || url.pathname.startsWith("/admin/settings"))) {
      url.pathname = "/admin"
      url.searchParams.set("error", "unauthorized")
      return createRedirectResponse(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
