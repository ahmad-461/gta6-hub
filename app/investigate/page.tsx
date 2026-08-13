"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  Sparkles,
  Send,
  Loader2,
  FileText,
  HelpCircle,
  CheckCircle2,
  ShieldCheck,
  Clock,
  ExternalLink
} from "lucide-react"

import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Badge from "@/components/ui/Badge"
import Input from "@/components/ui/Input"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"

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

const SUGGESTED_QUESTIONS = [
  "Who is Lucia?",
  "What's confirmed about map size?",
  "Tell me about Jason.",
  "Are there any GTA 6 cheats?"
]

export default function InvestigatePage() {
  const [reports, setReports] = useState<IntelligenceReport[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [sessionCount, setSessionCount] = useState<number>(0)
  const [isExportingMap, setIsExportingMap] = useState<Record<string, boolean>>({})
  const reportsEndRef = useRef<HTMLDivElement>(null)

  const handleExportPDF = async (report: IntelligenceReport) => {
    setIsExportingMap(prev => ({ ...prev, [report.id]: true }))
    try {
      const response = await fetch("/api/investigate/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: report.question,
          answer: report.answer,
          sources: report.sources,
          similarityScore: report.similarityScore
        })
      })

      if (!response.ok) {
        throw new Error("Terminal compilation failure.")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `gta6_case_file_${report.id.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert("Failed to compile PDF Case File. Terminal error.")
    } finally {
      setIsExportingMap(prev => ({ ...prev, [report.id]: false }))
    }
  }

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
    submitQuestion(input)
  }

  const submitQuestion = async (questionText: string) => {
    const question = questionText.trim()
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
        color: "green" as const,
        icon: <CheckCircle2 className="w-3.5 h-3.5" />
      }
    } else if (score >= 0.5) {
      return {
        label: "Likely Matches",
        color: "cyan" as const,
        icon: <Sparkles className="w-3.5 h-3.5" />
      }
    } else {
      return {
        label: "Unverified / Extrapolated",
        color: "yellow" as const,
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

      {/* Page header banner with Card Primitive */}
      <Card variant="standard" padding="lg" showCornerBrackets className="relative overflow-hidden">
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
      </Card>

      {/* Main Terminal Feed */}
      <Card variant="transparent" padding="none" className="flex-grow flex flex-col min-h-[400px] rounded-xl overflow-hidden relative">
        <div className="flex-grow p-6 overflow-y-auto space-y-6">

          {reports.length === 0 ? (
            <EmptyState
              icon={<Sparkles size={28} className="text-[#00E5FF]" />}
              title="Terminal Online. Awaiting Queries..."
              description="Enter your inquiry below or choose a suggest chip to trigger a similarity lookup over our vector database index and compile an official Intelligence Report."
            />
          ) : (
            <div className="space-y-8">
              {reports.map((report) => {
                const isPending = report.status === "pending"
                const isError = report.status === "error"
                const confConfig = getConfidenceConfig(report.similarityScore)

                if (isError) {
                  return (
                    <ErrorState
                      key={report.id}
                      title="Telemetry Error"
                      description={report.answer}
                      action={
                        <Button variant="destructive" size="sm" onClick={() => submitQuestion(report.question)}>
                          Retry Query
                        </Button>
                      }
                    />
                  )
                }

                return (
                  <Card
                    key={report.id}
                    variant="standard"
                    padding="md"
                    className="space-y-6 relative border-[rgba(245,240,250,0.14)]"
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

                      {/* Score Badge & Export Button */}
                      {!isPending && !isError && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            color={confConfig.color}
                            variant="subtle"
                            className="gap-1 px-3 py-1.5"
                          >
                            {confConfig.icon}
                            {confConfig.label} ({Math.round(report.similarityScore * 100)}% Match)
                          </Badge>
                          <Button
                            onClick={() => handleExportPDF(report)}
                            disabled={isExportingMap[report.id]}
                            variant="cyan"
                            size="sm"
                            className="!text-[10px] h-8 shrink-0"
                            title="Download PDF Case File"
                          >
                            {isExportingMap[report.id] ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            {isExportingMap[report.id] ? "COMPILING..." : "EXPORT CASE FILE"}
                          </Button>
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
                  </Card>
                )
              })}
            </div>
          )}
          <div ref={reportsEndRef} />
        </div>

        {/* Input Form Footer with suggested-chips and primitives */}
        <div className="p-4 border-t border-[rgba(245,240,250,0.12)] bg-[#150C1F]/70 relative">
          {/* Suggested Question Chips */}
          <div className="flex flex-wrap gap-1.5 mb-3.5 max-w-4xl mx-auto">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isTyping}
                onClick={() => submitQuestion(q)}
                className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-white/5 border border-[rgba(245,240,250,0.1)] hover:border-magenta text-paper-dim hover:text-white rounded transition-all duration-150 disabled:opacity-45"
              >
                {q}
              </button>
            ))}
          </div>

          <form onSubmit={handleInvestigate} className="flex gap-3 max-w-4xl mx-auto items-end">
            <div className="flex-grow">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the Investigator (e.g. Jason, walkthrough secrets, heist locations)..."
                disabled={isTyping}
                className="font-mono"
              />
            </div>
            <Button
              type="submit"
              disabled={isTyping || !input.trim() || sessionCount >= 10}
              variant="primary"
              className="h-[42px] px-6 shrink-0"
            >
              {isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Investigate
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
