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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    // If Supabase environment variables are missing, fallback to avoid crash
    if (!supabaseUrl || !supabaseAnonKey) {
      if (url.pathname === "/admin/login") {
        return response
      }
      url.pathname = "/admin/login"
      return NextResponse.redirect(url)
    }

    // Helper to create redirect response with preserved/refreshed cookies copied over
    const createRedirectResponse = (targetUrl: URL) => {
      const redirectResponse = NextResponse.redirect(targetUrl)
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, {
          path: cookie.path,
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

    const { data: { user } } = await supabase.auth.getUser()

    if (url.pathname === "/admin/login") {
      if (user) {
        url.pathname = "/admin"
        return createRedirectResponse(url)
      }
      return response
    }

    if (!user) {
      url.pathname = "/admin/login"
      return createRedirectResponse(url)
    }

    // Read user role and status from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, disabled")
      .eq("id", user.id)
      .single()

    if (profile?.disabled) {
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

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
