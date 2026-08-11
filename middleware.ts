import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // Inject x-pathname header directly on request headers so it persists
  request.headers.set("x-pathname", url.pathname)

  // Maintenance mode check
  const isStaticFile =
    url.pathname.startsWith("/_next") ||
    url.pathname.includes(".") ||
    url.pathname === "/favicon.ico"

  const isAdmin = url.pathname.startsWith("/admin")
  const isApi = url.pathname.startsWith("/api")
  const isMaintenancePage = url.pathname === "/maintenance"

  if (!isAdmin && !isApi && !isStaticFile && !isMaintenancePage) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {
              // Read-only in this block
            },
          },
        })

        const { data: setting } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "maintenance_mode")
          .maybeSingle()

        if (setting?.value === "true") {
          url.pathname = "/maintenance"
          request.headers.set("x-pathname", "/maintenance")
          return NextResponse.rewrite(url, {
            request,
          })
        }
      } catch (err) {
        console.error("Failed to check maintenance mode in middleware:", err)
      }
    }
  }

  let response = NextResponse.next({
    request,
  })

  // Protect /admin routes
  if (url.pathname.startsWith("/admin")) {
    const correlationId = Math.random().toString(36).substring(2, 8)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    const cookiesList = request.cookies.getAll().map(c => c.name)
    const hasAuthCookie = cookiesList.some(name => name.includes("auth-token") || name.startsWith("sb-"))

    console.log(`[MIDDLEWARE DEBUG] [${correlationId}] Request Path: ${url.pathname}`)
    console.log(`[MIDDLEWARE DEBUG] [${correlationId}] Env Present: Url=${!!supabaseUrl}, AnonKey=${!!supabaseAnonKey}`)
    console.log(`[MIDDLEWARE DEBUG] [${correlationId}] Auth Cookie Exist: ${hasAuthCookie} (Found cookies: ${JSON.stringify(cookiesList)})`)

    // If Supabase environment variables are missing, fallback to avoid crash
    if (!supabaseUrl || !supabaseAnonKey) {
      console.log(`[MIDDLEWARE DEBUG] [${correlationId}] Missing Supabase URL or Anon Key. URL is /admin/login? ${url.pathname === "/admin/login"}`)
      if (url.pathname === "/admin/login") {
        return response
      }
      console.log(`[AUTH REDIRECT SOURCE] middleware`)
      console.log(`requested pathname: ${url.pathname}`)
      console.log(`whether an auth cookie exists: ${hasAuthCookie}`)
      console.log(`whether getUser() returned a user: false (missing env)`)
      console.log(`user ID only: none`)
      console.log(`profile result: none`)
      console.log(`role: none`)
      console.log(`authentication decision: redirect (missing env)`)
      console.log(`redirect target: /admin/login`)
      url.pathname = "/admin/login"
      return NextResponse.redirect(url)
    }

    // Helper to create redirect response with preserved/refreshed cookies copied over
    const createRedirectResponse = (targetUrl: URL) => {
      const redirectResponse = NextResponse.redirect(targetUrl)
      response.cookies.getAll().forEach((cookie) => {
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

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    })

    let userResult;
    try {
      userResult = await supabase.auth.getUser()
      console.log(`[MIDDLEWARE DEBUG] [${correlationId}] getUser success. User ID: ${userResult.data?.user?.id || "none"}`)
    } catch (e: any) {
      console.error(`[MIDDLEWARE DEBUG] [${correlationId}] getUser threw an error:`, e?.message || e)
      userResult = { data: { user: null }, error: e }
    }

    const user = userResult.data?.user

    if (url.pathname === "/admin/login") {
      if (user) {
        url.pathname = "/admin"
        console.log(`[MIDDLEWARE DEBUG] [${correlationId}] User is logged in, redirecting /admin/login -> /admin`)
        return createRedirectResponse(url)
      }
      console.log(`[MIDDLEWARE DEBUG] [${correlationId}] No user, allowing access to /admin/login`)
      return response
    }

    if (!user) {
      const requestedPath = url.pathname
      console.log(`[AUTH REDIRECT SOURCE] middleware`)
      console.log(`requested pathname: ${requestedPath}`)
      console.log(`whether an auth cookie exists: ${hasAuthCookie}`)
      console.log(`whether getUser() returned a user: false`)
      console.log(`user ID only: none`)
      console.log(`profile result: none`)
      console.log(`role: none`)
      console.log(`authentication decision: redirect (no user)`)
      console.log(`redirect target: /admin/login`)
      url.pathname = "/admin/login"
      return createRedirectResponse(url)
    }

    // Read user role and status from profiles
    console.log(`[MIDDLEWARE DEBUG] [${correlationId}] Fetching profile for user ID: ${user.id}`)
    let profileResult;
    try {
      profileResult = await supabase
        .from("profiles")
        .select("role, disabled")
        .eq("id", user.id)
        .single()
      console.log(`[MIDDLEWARE DEBUG] [${correlationId}] profile query complete. Data: ${JSON.stringify(profileResult.data)}, Error: ${JSON.stringify(profileResult.error)}`)
    } catch (e: any) {
      console.error(`[MIDDLEWARE DEBUG] [${correlationId}] profile query threw exception:`, e?.message || e)
      profileResult = { data: null, error: e }
    }

    const profile = profileResult.data

    if (profile?.disabled) {
      console.log(`[AUTH REDIRECT SOURCE] middleware`)
      console.log(`requested pathname: ${url.pathname}`)
      console.log(`whether an auth cookie exists: ${hasAuthCookie}`)
      console.log(`whether getUser() returned a user: true`)
      console.log(`user ID only: ${user.id}`)
      console.log(`profile result: ${JSON.stringify(profileResult)}`)
      console.log(`role: ${profile?.role || "none"}`)
      console.log(`authentication decision: redirect (profile disabled)`)
      console.log(`redirect target: /admin/login?error=account_disabled`)
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
    console.log(`[MIDDLEWARE DEBUG] [${correlationId}] User role is determined as: ${role}`)

    // Editor trying to access user manager or site settings
    if (role === "editor" && (url.pathname.startsWith("/admin/users") || url.pathname.startsWith("/admin/settings"))) {
      url.pathname = "/admin"
      url.searchParams.set("error", "unauthorized")
      console.log(`[MIDDLEWARE DEBUG] [${correlationId}] Editor unauthorized for path, redirecting to /admin?error=unauthorized`)
      return createRedirectResponse(url)
    }

    console.log(`[MIDDLEWARE DEBUG] [${correlationId}] Allowed pass-through for path: ${url.pathname}`)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
