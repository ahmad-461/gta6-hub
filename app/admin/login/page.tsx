"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { z } from "zod"
import { toast } from "sonner"
import { Lock, Mail, Loader2 } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

export default function AdminLoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam === "account_disabled") {
      toast.error("Your account has been disabled. Please contact an administrator.")
    } else if (errorParam === "unauthorized") {
      toast.error("You are not authorized to access that section.")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    // Form validation with Zod
    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {}
      result.error.issues.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message
        if (err.path[0] === "password") fieldErrors.password = err.message
      })
      setErrors(fieldErrors)
      setIsLoading(false)
      toast.error("Please fix the validation errors.")
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        setIsLoading(false)
        return
      }

      toast.success("Login successful! Redirecting to dashboard...")
      router.refresh()
      router.push("/admin")
    } catch (err: any) {
      toast.error("An unexpected error occurred during login.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-grow flex items-center justify-center bg-background px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-card-bg border border-card-border p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-neon-pink/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-neon-blue/10 rounded-full blur-3xl"></div>

        <div className="text-center relative z-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            GTA 6 Hub <span className="text-neon-pink">Admin</span>
          </h2>
          <p className="mt-2 text-sm text-foreground/60">
            Sign in to manage articles, cheats and settings.
          </p>
        </div>

        <form className="mt-8 space-y-6 relative z-10" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground/80 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground/40">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2.5 bg-[#1a1822] border ${
                    errors.email ? "border-neon-pink" : "border-card-border"
                  } rounded-lg text-white placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent transition duration-200 text-sm`}
                  placeholder="admin@gta6hub.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-neon-pink">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground/80 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground/40">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2.5 bg-[#1a1822] border ${
                    errors.password ? "border-neon-pink" : "border-card-border"
                  } rounded-lg text-white placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent transition duration-200 text-sm`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-neon-pink">{errors.password}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-black bg-neon-blue hover:bg-neon-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neon-blue transition-all duration-200 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-black" />
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
