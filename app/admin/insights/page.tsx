"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from "chart.js"
import { Bar } from "react-chartjs-2"
import {
  AlertCircle,
  AlertTriangle,
  AlignLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  Eye,
  Key,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp
} from "lucide-react"

// Register ChartJS elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface InsightsData {
  stats: {
    average_word_count: number
    readability_score: number
    word_count_trend: Record<string, number>
  } | null
  seo: Array<{
    type: string
    title: string
    slug: string
    word_count: number
    reasons: string[]
  }> | null
  topics: {
    well_covered: Array<{ topic: string; mentions: number }>
    under_covered: Array<{ topic: string; mentions: number }>
  } | null
}

export default function AdminInsightsPage() {
  const router = useRouter()

  // Authentication State
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Login form state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [loginSubmitting, setLoginSubmitting] = useState(false)

  // Insights Data State
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState("")
  const [isMock, setIsMock] = useState(false)
  const [unreachableReason, setUnreachableReason] = useState("")

  const verifyAdminRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single()

      if (error || !data) {
        console.warn("Could not read profile role from profiles table:", error)
        setIsAdmin(false)
      } else {
        setIsAdmin(data.role === "admin")
      }
    } catch (err) {
      console.error("Failed verification profile role check:", err)
      setIsAdmin(false)
    } finally {
      setAuthLoading(false)
    }
  }, [])

  const checkUserSession = useCallback(async () => {
    try {
      setAuthLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await verifyAdminRole(user.id)
      } else {
        setUser(null)
        setIsAdmin(false)
        setAuthLoading(false)
      }
    } catch (err) {
      console.error("Error reading session:", err)
      setAuthLoading(false)
    }
  }, [verifyAdminRole])

  // Check auth session and profile role on mount
  useEffect(() => {
    checkUserSession()

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await verifyAdminRole(session.user.id)
      } else {
        setUser(null)
        setIsAdmin(false)
        setAuthLoading(false)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [checkUserSession, verifyAdminRole])

  // Fetch Proxy API insights
  const fetchInsights = async () => {
    try {
      setInsightsLoading(true)
      setInsightsError("")

      const res = await fetch("/api/insights")
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "The insights service is currently offline.")
      }

      setInsights(data)
      setIsMock(!!data.is_mock)
      setUnreachableReason(data.error || "")
    } catch (err: any) {
      console.error("Failed fetching admin insights data:", err)
      setInsightsError(err.message || "Python Microservice unreachable.")
      setIsMock(false)
    } finally {
      setInsightsLoading(false)
    }
  }

  // Trigger insights fetch when authenticated as admin
  useEffect(() => {
    if (isAdmin === true) {
      fetchInsights()
    }
  }, [isAdmin])

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginSubmitting(true)
    setLoginError("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }

      if (data?.user) {
        setUser(data.user)
        await verifyAdminRole(data.user.id)
      }
    } catch (err: any) {
      setLoginError(err.message || "Invalid credentials.")
    } finally {
      setLoginSubmitting(false)
    }
  }

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    setInsights(null)
    setIsMock(false)
    setEmail("")
    setPassword("")
    router.refresh()
  }

  // Word count chart config compile
  const chartData = useMemo(() => {
    if (!insights?.stats?.word_count_trend) return null

    const trend = insights.stats.word_count_trend
    const labels = Object.keys(trend)
    const values = Object.values(trend)

    return {
      labels,
      datasets: [
        {
          label: "Average Words Per Article/Guide",
          data: values,
          backgroundColor: "rgba(236, 72, 153, 0.7)", // pink
          borderColor: "#ec4899",
          borderWidth: 2,
          borderRadius: 6
        }
      ]
    }
  }, [insights])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.05)"
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.4)",
          font: { size: 10 }
        }
      },
      x: {
        grid: {
          color: "transparent"
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.4)",
          font: { size: 10, weight: "bold" as const }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  }

  // Get description of Flesch Readability Score
  const getReadabilityText = (score: number) => {
    if (score >= 90) return "Very Easy (5th-grade level)"
    if (score >= 80) return "Easy (6th-grade level)"
    if (score >= 70) return "Fairly Easy (7th-grade level)"
    if (score >= 60) return "Standard (8th to 9th-grade level)"
    if (score >= 50) return "Fairly Difficult (High School level)"
    if (score >= 30) return "Difficult (College level)"
    return "Very Difficult (Academic/Graduate level)"
  }

  // 1. Loading active auth session
  if (authLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center space-y-4 py-32">
        <Loader2 className="w-12 h-12 text-neon-pink animate-spin" />
        <p className="text-sm text-foreground/50">Verifying secure admin authorization...</p>
      </div>
    )
  }

  // 2. Unauthenticated: Render gorgeous Admin Login Card
  if (!user) {
    return (
      <div className="flex-grow flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md bg-card-bg/60 border border-card-border p-8 rounded-xl backdrop-blur-sm shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue" />
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-neon-pink/15 rounded-full border border-neon-pink/40 flex items-center justify-center mx-auto mb-1">
              <Lock className="w-6 h-6 text-neon-pink" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">ADMIN INSIGHTS CORE</h2>
            <p className="text-xs text-foreground/50 max-w-xs mx-auto">
              Access credentials are required to fetch backend SEO crawls, semantic topic coverage, and analytics.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-foreground/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@gta6-hub.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-card-border focus:border-neon-pink focus:ring-1 focus:ring-neon-pink text-sm text-white rounded-lg pl-11 pr-4 py-3 outline-none transition-all placeholder:text-foreground/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">
                Password
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-foreground/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-card-border focus:border-neon-pink focus:ring-1 focus:ring-neon-pink text-sm text-white rounded-lg pl-11 pr-4 py-3 outline-none transition-all placeholder:text-foreground/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-neon-pink to-neon-purple font-bold text-sm text-white hover:brightness-110 disabled:opacity-40 transition-all flex items-center justify-center space-x-2"
            >
              {loginSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Decrypt & Access Terminal</span>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link href="/" prefetch={false} className="text-xs text-foreground/40 hover:text-white transition-colors">
              &larr; Return to Home Portal
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 3. Authenticated but lacks `'admin'` role: Access Denied
  if (isAdmin === false) {
    return (
      <div className="flex-grow flex items-center justify-center py-24 px-4">
        <div className="w-full max-w-md bg-card-bg/60 border border-card-border p-8 rounded-xl text-center space-y-6 backdrop-blur-sm">
          <div className="w-12 h-12 bg-red-500/10 rounded-full border border-red-500/20 flex items-center justify-center mx-auto mb-1">
            <ShieldAlert className="w-6 h-6 text-red-400 animate-bounce" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-extrabold text-white">ACCESS DENIED</h2>
            <p className="text-xs text-foreground/60 leading-relaxed max-w-sm mx-auto">
              Your profile is registered with role <strong className="text-white uppercase font-bold">editor</strong>. Access to server analytical layers requires the absolute <strong className="text-white uppercase font-bold">admin</strong> role.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleLogout}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-card-border rounded-lg transition-all"
            >
              Sign out of account
            </button>
            <Link href="/" prefetch={false} className="text-xs text-foreground/40 hover:text-white transition-colors">
              &larr; Exit to Public Portal
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 4. Authenticated & Admin Role: Render Insights Dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-8">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-card-border pb-6">
        <div>
          <div className="flex items-center space-x-2.5 mb-2">
            <LayoutDashboard className="w-6 h-6 text-neon-pink" />
            <span className="text-xs font-black tracking-widest text-neon-blue uppercase">
              ADMIN CONTROL CENTER
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Content Insights & SEO Audit
          </h1>
          <p className="text-xs sm:text-sm text-foreground/50">
            Securely connected to Python Analysis Microservice • Authenticated as <span className="text-white font-semibold">{user.email}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchInsights}
            disabled={insightsLoading}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-card-border text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${insightsLoading ? "animate-spin" : ""}`} />
            <span>{insightsLoading ? "Re-Analyzing..." : "Run Analysis"}</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnect</span>
          </button>
        </div>
      </div>

      {/* Loading active data */}
      {insightsLoading && !insights && (
        <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 text-neon-pink animate-spin" />
          <div className="space-y-1">
            <p className="text-white font-extrabold text-base">Requesting microservice compilation...</p>
            <p className="text-xs text-foreground/40">Executing Python Flesch Ease metrics and SEO crawls in parallel...</p>
          </div>
        </div>
      )}

      {/* ERROR DEGRADATION FALLBACK (only if isMock is false and we had a hard failure) */}
      {insightsError && !isMock && (
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-xl text-center space-y-6 max-w-xl mx-auto shadow-xl">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-white uppercase tracking-wider">Insights Temporarily Unavailable</h3>
            <p className="text-xs text-foreground/60 leading-relaxed">
              We were unable to communicate with the standalone Python analysis microservice. The service might be booting up, sleeping on free tier, or experiencing cloud timeouts.
            </p>
            <div className="p-3 bg-black/40 border border-white/5 rounded text-left font-mono text-[10px] text-red-300 break-all">
              Error detail: {insightsError}
            </div>
          </div>

          <div>
            <button
              onClick={fetchInsights}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-neon-pink to-neon-purple text-xs font-bold text-white hover:brightness-110 transition-all flex items-center justify-center space-x-1.5 mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Metrics Content (Render if we have insights data, real or mock) */}
      {insights && (
        <div className="space-y-8 animate-fadeIn">
          {/* MOCK FALLBACK NOTICE BANNER */}
          {isMock && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-xl flex items-start space-x-3 text-amber-400 shadow-lg">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-white text-sm uppercase tracking-wider">Insights Temporarily Unavailable (Viewing Mock Data)</h4>
                <p className="text-xs text-foreground/65 leading-relaxed">
                  The standalone Python analysis microservice is unreachable ({unreachableReason || "offline"}). Below is a local, testable fallback mock dataset to preview the dashboard structure. It does not reflect real live content stats.
                </p>
              </div>
            </div>
          )}

          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Avg Word Count */}
            <div className="bg-card-bg/60 border border-card-border p-5 rounded-xl space-y-2 relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-1 h-full bg-neon-pink" />
              <div className="flex justify-between items-center text-[10px] font-bold text-foreground/40 uppercase tracking-wider">
                <span>Avg Word Count</span>
                <AlignLeft className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-white">
                {insights.stats?.average_word_count ? `${insights.stats.average_word_count.toLocaleString()} words` : "N/A"}
              </div>
              <p className="text-[10px] text-foreground/50">Across combined published resources</p>
            </div>

            {/* Readability Score */}
            <div className="bg-card-bg/60 border border-card-border p-5 rounded-xl space-y-2 relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-1 h-full bg-neon-purple" />
              <div className="flex justify-between items-center text-[10px] font-bold text-foreground/40 uppercase tracking-wider">
                <span>Readability Index</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-white">
                {insights.stats?.readability_score ? `${insights.stats.readability_score}/100` : "N/A"}
              </div>
              <p className="text-[10px] text-neon-purple font-semibold truncate">
                {insights.stats?.readability_score ? getReadabilityText(insights.stats.readability_score) : "N/A"}
              </p>
            </div>

            {/* SEO Issues to Fix */}
            <div className="bg-card-bg/60 border border-card-border p-5 rounded-xl space-y-2 relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-1 h-full bg-neon-yellow" />
              <div className="flex justify-between items-center text-[10px] font-bold text-foreground/40 uppercase tracking-wider">
                <span>SEO Flags to Fix</span>
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-white">
                {insights.seo ? `${insights.seo.length} issues` : "N/A"}
              </div>
              <p className="text-[10px] text-foreground/50">Requires editor manual intervention</p>
            </div>

            {/* Well-Covered Topics */}
            <div className="bg-card-bg/60 border border-card-border p-5 rounded-xl space-y-2 relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
              <div className="flex justify-between items-center text-[10px] font-bold text-foreground/40 uppercase tracking-wider">
                <span>Well-Covered Topics</span>
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-white">
                {insights.topics?.well_covered ? `${insights.topics.well_covered.length} terms` : "0 terms"}
              </div>
              <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                Meets target of 5+ mentions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Word Count Trend & Keywords (8 cols) */}
            <div className="lg:col-span-7 space-y-8">
              {/* Word count trend chart */}
              <div className="bg-card-bg/60 border border-card-border p-6 rounded-xl space-y-4 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4.5 h-4.5 text-neon-pink" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Word Count Trend Over Time</h3>
                </div>

                <div className="relative h-64 w-full">
                  {chartData ? (
                    <Bar data={chartData} options={chartOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-foreground/30">No trend data calculated.</div>
                  )}
                </div>
              </div>

              {/* Topic Coverage analysis */}
              <div className="bg-card-bg/60 border border-card-border p-6 rounded-xl space-y-6 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4.5 h-4.5 text-neon-yellow" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Topic Frequency & Keyword Density</h3>
                </div>

                <p className="text-xs text-foreground/60 leading-relaxed">
                  The microservice tokenized published contents and counted mentions of core GTA 6 semantic keywords. It divides keywords into well-covered (green) and under-covered (pink).
                </p>

                {/* Well covered keywords list */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black tracking-wider uppercase text-emerald-400 block">
                    Well-Covered Topics (5+ Mentions)
                  </span>

                  {insights.topics?.well_covered && insights.topics.well_covered.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {insights.topics.well_covered.map((item) => (
                        <div
                          key={item.topic}
                          className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        >
                          <span className="capitalize">{item.topic}</span>
                          <span className="bg-emerald-500/20 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                            {item.mentions}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-foreground/30">No keywords are well-covered yet. Add some more content!</p>
                  )}
                </div>

                {/* Under covered keywords list */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-black tracking-wider uppercase text-neon-pink block">
                    Under-Covered Topics (&lt; 5 Mentions)
                  </span>

                  {insights.topics?.under_covered && insights.topics.under_covered.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {insights.topics.under_covered.map((item) => (
                        <div
                          key={item.topic}
                          className="flex items-center space-x-1.5 bg-neon-pink/10 border border-neon-pink/20 text-neon-pink px-3 py-1.5 rounded-lg text-xs font-semibold"
                        >
                          <span className="capitalize">{item.topic}</span>
                          <span className="bg-neon-pink/20 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                            {item.mentions}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-foreground/30">Fantastic! All target keywords are well-covered.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: SEO Issues (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-card-bg/60 border border-card-border p-6 rounded-xl space-y-4 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4.5 h-4.5 text-neon-yellow" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">SEO Audit Actions Needed</h3>
                </div>

                <p className="text-xs text-foreground/60 leading-normal mb-3">
                  Manual fixes required by editors to maximize organic search engine indexing. Flagged on short drafts, missing meta descriptions, or unlabeled featured image uploads.
                </p>

                {insights.seo && insights.seo.length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {insights.seo.map((item) => (
                      <div
                        key={item.slug}
                        className="bg-background border border-card-border p-4.5 rounded-lg space-y-2.5 relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                            <span className="text-[9px] text-foreground/40 font-semibold uppercase">{item.type} • {item.word_count.toLocaleString()} words</span>
                          </div>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-neon-yellow/15 text-neon-yellow uppercase shrink-0">
                            {item.reasons.length} Fix{item.reasons.length !== 1 ? "es" : ""}
                          </span>
                        </div>

                        {/* List of Warning Reasons */}
                        <ul className="space-y-1.5 text-[11px] text-foreground/70 leading-normal pl-3 list-disc">
                          {item.reasons.map((reason, idx) => (
                            <li key={idx} className="marker:text-neon-pink">
                              {reason}
                            </li>
                          ))}
                        </ul>

                        <div className="pt-2 flex justify-between items-center border-t border-card-border/50 text-[10px]">
                          <span className="font-mono text-foreground/40 break-all truncate max-w-xs">/{item.type.toLowerCase()}s/{item.slug}</span>
                          <span className="text-neon-pink font-semibold shrink-0 inline-flex items-center space-x-0.5 hover:underline cursor-pointer">
                            <span>Fix draft</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 border border-dashed border-card-border/60 rounded-xl space-y-2">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                    <h4 className="text-sm font-bold text-white uppercase">Squeaky Clean!</h4>
                    <p className="text-xs text-foreground/40 leading-relaxed">
                      All published guides and articles comply 100% with word thresholds, alt-text references, and SEO descriptors. Zero flags.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
