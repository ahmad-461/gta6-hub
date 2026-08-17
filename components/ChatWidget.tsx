"use client"

import React, { useState, useRef, useEffect } from "react"
import { MessageSquare, X, Send, Sparkles, AlertCircle, FileText, ChevronRight } from "lucide-react"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"
import Input from "@/components/ui/Input"

interface Message {
  role: "user" | "assistant"
  text: string
  confidence?: "Confirmed" | "Likely" | "Unverified"
  sources?: Array<{ title: string; href?: string; url?: string; type: string }>
}

const SUGGESTED_QUESTIONS = [
  "Who is Lucia?",
  "What's confirmed about map size?",
  "Tell me about Jason.",
  "Are there any GTA 6 cheats?"
]

export default function ChatWidget() {
  // Premium Polish: Streamlined UI elements, optimized suggested question chips, and added robust fallback parsing.
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I'm the Hub RAG Assistant. Ask me anything about GTA 6 characters, cheats, or map locations, and I will search our verified pages for you!"
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [errorState, setErrorState] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  const submitQuestion = async (text: string) => {
    if (!text.trim() || isTyping) return

    setErrorState(null)
    setMessages((prev) => [...prev, { role: "user", text }])
    setInputValue("")
    setIsTyping(true)

    // Add empty assistant message to stream into
    setMessages((prev) => [...prev, { role: "assistant", text: "" }])

    try {
      const response = await fetch("/api/embeddings/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text })
      })

      if (!response.ok) {
        let errMsg = "Sorry, I encountered an error. Please try again."
        try {
          const errorData = await response.json()
          errMsg = errorData.error || errMsg
        } catch {}

        setErrorState(errMsg)
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: "assistant",
            text: "Request failed. Check system logs."
          }
          return updated
        })
        setIsTyping(false)
        return
      }

      // Extract custom headers
      const scoreHeader = response.headers.get("X-Similarity-Score")
      const sourcesHeader = response.headers.get("X-Source-Documents")

      let confidenceLevel: "Confirmed" | "Likely" | "Unverified" | undefined = undefined
      if (scoreHeader) {
        const score = parseFloat(scoreHeader)
        if (score > 0.7) confidenceLevel = "Confirmed"
        else if (score >= 0.5) confidenceLevel = "Likely"
        else confidenceLevel = "Unverified"
      }

      let matchedSources: Array<{ title: string; href?: string; url?: string; type: string }> = []
      if (sourcesHeader) {
        try {
          matchedSources = JSON.parse(decodeURIComponent(sourcesHeader))
        } catch (e) {
          try {
            matchedSources = JSON.parse(sourcesHeader)
          } catch (e2) {
            console.error("Failed to parse sources header:", e2)
          }
        }
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let done = false
      let streamText = ""

      while (!done && reader) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        if (value) {
          const chunk = decoder.decode(value, { stream: !done })
          streamText += chunk
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: "assistant",
              text: streamText,
              confidence: confidenceLevel,
              sources: matchedSources.length > 0 ? matchedSources : undefined
            }
            return updated
          })
        }
      }
    } catch (err: any) {
      console.error("Chat error:", err)
      setErrorState("An error occurred while communicating with the AI server.")
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: "assistant",
          text: "Communications failure."
        }
        return updated
      })
    } finally {
      setIsTyping(false)
    }
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    submitQuestion(inputValue)
  }

  // Parse markdown links or other custom elements securely
  const renderMessageText = (text: string) => {
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
          className="text-cyan hover:underline font-bold border-b border-dashed border-cyan/40"
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
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-ink border border-magenta/30 hover:border-magenta text-magenta hover:text-white rounded-full shadow-[0_0_15px_rgba(255,46,136,0.15)] hover:shadow-[0_0_20px_rgba(255,46,136,0.3)] transition-all duration-300"
        title="Ask the Hub AI"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <Card
          variant="console"
          padding="none"
          showCornerBrackets
          className="fixed bottom-24 right-6 z-50 w-full max-w-[380px] h-[550px] flex flex-col overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="p-4 border-b border-[rgba(245,240,250,0.08)] bg-ink/70 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles size={16} className="text-magenta animate-pulse" />
              <span className="text-xs font-black tracking-widest text-magenta uppercase font-mono">
                AI Intelligence Investigator
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-paper-dim/50 hover:text-white transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages List Area */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 text-sm scrollbar-thin">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[90%] px-3.5 py-2.5 rounded-lg ${
                    msg.role === "user"
                      ? "bg-magenta/10 border border-magenta/30 text-paper rounded-tr-none"
                      : "bg-ink-2/60 border border-[rgba(245,240,250,0.1)] text-paper-dim rounded-tl-none"
                  }`}
                >
                  {msg.role === "assistant" && msg.text === "" ? (
                    /* Elegant Skeleton Pulse Treatment instead of spinner */
                    <div className="space-y-2 py-1 w-[200px]">
                      <div className="h-3.5 bg-paper-dim/15 rounded animate-pulse w-3/4" />
                      <div className="h-3.5 bg-paper-dim/15 rounded animate-pulse w-5/6" />
                      <div className="h-3.5 bg-paper-dim/15 rounded animate-pulse w-1/2" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Message text */}
                      <div>{renderMessageText(msg.text)}</div>

                      {/* Premium Metadata overlays for Assistant responses */}
                      {msg.role === "assistant" && (msg.confidence || msg.sources) && (
                        <div className="pt-2 border-t border-[rgba(245,240,250,0.08)] mt-2 space-y-2 text-[10px]">
                          {/* Confidence Level Pill */}
                          {msg.confidence && (
                            <div className="flex items-center space-x-1.5">
                              <span className="text-paper-dim/40 font-mono font-bold uppercase">Confidence:</span>
                              <Badge
                                color={
                                  msg.confidence === "Confirmed" ? "green" :
                                  msg.confidence === "Likely" ? "yellow" : "gray"
                                }
                                variant="subtle"
                              >
                                {msg.confidence}
                              </Badge>
                            </div>
                          )}

                          {/* Evidence Sources List */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-paper-dim/40 font-mono font-bold uppercase flex items-center space-x-1">
                                <FileText className="w-3 h-3" />
                                <span>Evidence Dossier:</span>
                              </div>
                              <div className="flex flex-col gap-1 pl-1">
                                {msg.sources.map((src, sIdx) => (
                                  <a
                                    key={sIdx}
                                    href={src.href || src.url}
                                    className="text-cyan hover:underline inline-flex items-center space-x-1 font-mono font-bold"
                                  >
                                    <ChevronRight className="w-2.5 h-2.5" />
                                    <span className="truncate max-w-[240px]">{src.title}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Error Message Display Block */}
            {errorState && (
              <div className="p-3.5 bg-red-600/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-start space-x-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
                <div className="space-y-0.5">
                  <span className="font-bold block font-mono uppercase tracking-wider">Telemetry Error</span>
                  <p className="text-paper-dim/80">{errorState}</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Control Block with suggested-chips above it */}
          <div className="p-3 border-t border-[rgba(245,240,250,0.08)] bg-ink/40">
            {/* Suggested Question Chips */}
            <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-[80px] overflow-y-auto pb-1.5">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isTyping}
                  onClick={() => submitQuestion(q)}
                  className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-white/5 border border-[rgba(245,240,250,0.1)] hover:border-magenta text-paper-dim hover:text-white rounded transition-all duration-150 disabled:opacity-45"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Form with unified primitives */}
            <form onSubmit={handleSend} className="flex gap-2 items-center">
              <div className="flex-grow">
                <Input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about Lucia, map, cheats..."
                  disabled={isTyping}
                  className="!py-2 border-[rgba(245,240,250,0.12)] focus:border-cyan focus:ring-1 focus:ring-cyan rounded"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isTyping || !inputValue.trim()}
                className="h-[38px] !px-3 shrink-0"
              >
                <Send size={14} />
              </Button>
            </form>
          </div>
        </Card>
      )}
    </>
  )
}
