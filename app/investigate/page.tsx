"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  Sparkles,
  Send,
  Loader2,
  FileText,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Lock,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  ExternalLink
} from "lucide-react"

interface EvidenceSource {
  title: string
  url: string
  type: string
}

interface IntelligenceReport {
  id: string
  question: string
  answer: string
  sources: EvidenceSource[]
  similarityScore: number
  status: "pending" | "streaming" | "complete" | "error"
}

export default function InvestigatePage() {
  const [reports, setReports] = useState<IntelligenceReport[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [sessionCount, setSessionCount] = useState<number>(0)
  const reportsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    reportsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [reports])

  // Get or initialize session tracker local counts to inform the user of remaining requests
  useEffect(() => {
    const saved = localStorage.getItem("gta6_investigate_count")
    if (saved) {
      setSessionCount(parseInt(saved, 10))
    }
  }, [])

  const updateSessionCount = (newCount: number) => {
    setSessionCount(newCount)
    localStorage.setItem("gta6_investigate_count", newCount.toString())
  }

  const handleInvestigate = async (e: React.FormEvent) => {
    e.preventDefault()
    const question = input.trim()
    if (!question || isTyping) return

    if (sessionCount >= 10) {
      alert("Rate limit reached: You have completed all 10 intelligence operations permitted in this terminal session.")
      return
    }

    const reportId = crypto.randomUUID()
    const newReport: IntelligenceReport = {
      id: reportId,
      question,
      answer: "",
      sources: [],
      similarityScore: 0,
      status: "pending"
    }

    setReports((prev) => [...prev, newReport])
    setInput("")
    setIsTyping(true)
    updateSessionCount(sessionCount + 1)

    try {
      const response = await fetch("/api/embeddings/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errMsg = errorData.error || "Terminal execution failure. Operation aborted."
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? { ...r, answer: errMsg, status: "error" }
              : r
          )
        )
        setIsTyping(false)
        return
      }

      // Read response headers for similarity score & source articles
      const maxScoreStr = response.headers.get("X-Similarity-Score")
      const sourcesSerialized = response.headers.get("X-Source-Documents")

      const similarityScore = maxScoreStr ? parseFloat(maxScoreStr) : 0.45
      let sources: EvidenceSource[] = []

      if (sourcesSerialized) {
        try {
          sources = JSON.parse(decodeURIComponent(sourcesSerialized))
        } catch (e) {
          console.error("Failed to parse sources header", e)
        }
      }

      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, similarityScore, sources, status: "streaming" }
            : r
        )
      )

      // Stream the body response text
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let done = false
      let streamedText = ""

      while (!done && reader) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        if (value) {
          const chunk = decoder.decode(value, { stream: !done })
          streamedText += chunk
          setReports((prev) =>
            prev.map((r) =>
              r.id === reportId
                ? { ...r, answer: streamedText }
                : r
            )
          )
        }
      }

      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: "complete" }
            : r
        )
      )

    } catch (err: any) {
      console.error("Investigation failed", err)
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, answer: "Connection interrupted. Failed to reach the remote AI Investigator node.", status: "error" }
            : r
        )
      )
    } finally {
      setIsTyping(false)
    }
  }

  // Determine confidence status labels based on score
  function getConfidenceConfig(score: number) {
    if (score > 0.7) {
      return {
        label: "Confirmed Alignment",
        class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />
      }
    } else if (score >= 0.5) {
      return {
        label: "Likely Matches",
        class: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        icon: <Sparkles className="w-3.5 h-3.5" />
      }
    } else {
      return {
        label: "Unverified / Extrapolated",
        class: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        icon: <HelpCircle className="w-3.5 h-3.5" />
      }
    }
  }

  const renderTextWithLinks = (text: string) => {
    if (!text) return ""
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }
      parts.push(
        <a
          key={match.index}
          href={match[2]}
          className="text-[#FF2E88] hover:underline font-bold border-b border-dashed border-[#FF2E88]/30"
        >
          {match[1]}
        </a>
      )
      lastIndex = linkRegex.lastIndex
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts.length > 0 ? (
      <span className="whitespace-pre-line leading-relaxed">{parts}</span>
    ) : (
      <span className="whitespace-pre-line leading-relaxed">{text}</span>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow flex flex-col space-y-8 text-[#F5F0FA]">

      {/* Page header banner */}
      <div className="relative border border-[rgba(245,240,250,0.14)] bg-[#150C1F]/60 backdrop-blur-md p-8 rounded-xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00E5FF]" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00E5FF]" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00E5FF]" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00E5FF]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-[#00E5FF]">
              <ShieldCheck className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase font-mono">
                VICE CITY INTEL ASSISTANT // CODENAME: INVESTIGATOR
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-anton uppercase tracking-tight text-white leading-none">
              AI INVESTIGATOR TERMINAL
            </h1>
            <p className="text-sm text-[#9C8FAE] max-w-xl">
              Submit query keywords, leaked files, or story nodes to crawl through verified walkthrough guides and articles database records.
            </p>
          </div>

          {/* Rate Limit Indicator Badge */}
          <div className="bg-[#0B0710]/80 border border-[rgba(245,240,250,0.1)] p-4 rounded-lg font-mono text-xs flex items-center gap-3 shrink-0">
            <Clock className="w-4 h-4 text-[#FF2E88]" />
            <div>
              <span className="block text-[10px] text-[#9C8FAE] font-bold">TERMINAL THROTTLE:</span>
              <span className="font-extrabold text-white">
                {sessionCount} / 10 OPERATIONS USED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Terminal Feed */}
      <div className="flex-grow flex flex-col min-h-[400px] border border-[rgba(245,240,250,0.14)] bg-[#150C1F]/40 backdrop-blur rounded-xl overflow-hidden relative">
        <div className="flex-grow p-6 overflow-y-auto space-y-6">

          {reports.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-[#00E5FF]/20" />
                <div className="p-4 bg-[#150C1F] border border-[rgba(245,240,250,0.12)] rounded-full text-[#00E5FF]">
                  <Sparkles size={28} />
                </div>
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-bold text-white uppercase font-mono tracking-wider">
                  Terminal Online. Awaiting Queries...
                </h3>
                <p className="text-xs text-[#9C8FAE] leading-relaxed">
                  Enter your inquiry below to trigger a similarity lookup over our vector database index and compile an official Intelligence Report.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {reports.map((report) => {
                const isPending = report.status === "pending"
                const isError = report.status === "error"
                const confConfig = getConfidenceConfig(report.similarityScore)

                return (
                  <div
                    key={report.id}
                    className="border border-[rgba(245,240,250,0.14)] rounded-xl bg-[#0B0710]/95 p-6 space-y-6 shadow-2xl relative"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[rgba(245,240,250,0.1)] pb-4 gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black tracking-widest text-[#9C8FAE] uppercase font-mono">
                          QUERY TELEMETRY INPUT
                        </span>
                        <p className="text-sm font-extrabold text-white leading-snug">
                          &ldquo;{report.question}&rdquo;
                        </p>
                      </div>

                      {/* Score Badge */}
                      {!isPending && !isError && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-black font-mono uppercase tracking-widest border ${confConfig.class}`}>
                          {confConfig.icon}
                          {confConfig.label} ({Math.round(report.similarityScore * 100)}% Match)
                        </div>
                      )}
                    </div>

                    {/* Report Answer Segment */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black tracking-widest text-[#00E5FF] uppercase font-mono block">
                        INTELLIGENCE DOSSIER REPORT:
                      </span>
                      {isPending && report.answer === "" ? (
                        <div className="flex items-center space-x-2 py-2">
                          <Loader2 className="w-5 h-5 text-[#FF2E88] animate-spin" />
                          <span className="text-xs font-mono text-[#9C8FAE] tracking-wider uppercase animate-pulse">
                            Searching database clusters...
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm leading-relaxed text-[#F5F0FA]/90 bg-[#150C1F]/50 p-4 rounded border border-[rgba(245,240,250,0.06)]">
                          {renderTextWithLinks(report.answer)}
                        </div>
                      )}
                    </div>

                    {/* Evidence & Sources Section */}
                    {!isPending && !isError && report.sources.length > 0 && (
                      <div className="border-t border-[rgba(245,240,250,0.1)] pt-4 space-y-3">
                        <span className="text-[10px] font-black tracking-widest text-[#FF2E88] uppercase font-mono block">
                          VERIFIED EVIDENCE / SOURCES:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {report.sources.map((src, sIdx) => (
                            <Link
                              key={sIdx}
                              href={src.url}
                              className="flex items-center justify-between p-3 rounded bg-[#150C1F]/30 border border-[rgba(245,240,250,0.06)] hover:border-[#FF2E88]/40 transition group"
                            >
                              <div className="flex items-center space-x-2.5 truncate pr-2">
                                <FileText className="w-4 h-4 text-[#9C8FAE] group-hover:text-[#FF2E88] shrink-0" />
                                <span className="text-xs font-bold text-[#F5F0FA] group-hover:text-white truncate">
                                  {src.title}
                                </span>
                              </div>
                              <ExternalLink size={12} className="text-[#9C8FAE]/40 group-hover:text-[#FF2E88] shrink-0" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          <div ref={reportsEndRef} />
        </div>

        {/* Input Form Footer */}
        <div className="p-4 border-t border-[rgba(245,240,250,0.12)] bg-[#150C1F]/70 relative">
          <form onSubmit={handleInvestigate} className="flex gap-3 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the Investigator (e.g. Jason, walkthrough secrets, heist locations)..."
              disabled={isTyping}
              className="flex-grow bg-[#0B0710] border border-[rgba(245,240,250,0.14)] focus:border-[#FF2E88] focus:ring-1 focus:ring-[#FF2E88] outline-none rounded-lg px-4 py-3 text-sm text-white placeholder-foreground/30 transition-all font-mono"
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim() || sessionCount >= 10}
              className="px-6 py-3 bg-[#FF2E88] hover:bg-[#FF2E88]/90 disabled:opacity-40 text-white font-mono text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,46,136,0.3)] hover:shadow-[0_0_25px_rgba(255,46,136,0.5)]"
            >
              {isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Investigate
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
