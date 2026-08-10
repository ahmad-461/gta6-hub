import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // Inject x-pathname header
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", url.pathname)

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
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

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response = NextResponse.next({
              request: {
                headers: requestHeaders,
              },
            })
            response.cookies.set(name, value, options)
          })
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()

    if (url.pathname === "/admin/login") {
      if (user) {
        url.pathname = "/admin"
        return NextResponse.redirect(url)
      }
      return response
    }

    if (!user) {
      url.pathname = "/admin/login"
      return NextResponse.redirect(url)
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
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
