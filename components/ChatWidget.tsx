"use client"

import React, { useState, useRef, useEffect } from "react"
import { MessageSquare, X, Send, Sparkles, Loader2 } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  text: string
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I'm the Hub RAG Assistant. Ask me anything about GTA 6 characters, guides, cheats, or map locations, and I will search our verified pages for you!"
    }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleToggle = (e: any) => {
      if (e.detail?.open !== undefined) {
        setIsOpen(e.detail.open)
      } else {
        setIsOpen((prev) => !prev)
      }
    }
    window.addEventListener("toggle-chat-widget", handleToggle)
    return () => window.removeEventListener("toggle-chat-widget", handleToggle)
  }, [])

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isTyping) return

    setMessages((prev) => [...prev, { role: "user", text }])
    setInput("")
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
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || "Sorry, I encountered an error. Please try again."
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: "assistant",
            text: errorMessage
          }
          return updated
        })
        setIsTyping(false)
        return
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
              text: streamText
            }
            return updated
          })
        }
      }
    } catch (err: any) {
      console.error("Chat error:", err)
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: "assistant",
          text: "An error occurred while communicating with the AI server."
        }
        return updated
      })
    } finally {
      setIsTyping(false)
    }
  }

  // Parse markdown-style links like [Lucia](/news/lucia-trailer-breakdown)
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
          className="text-neon-pink hover:underline font-bold border-b border-dashed border-neon-pink/40"
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
      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[100] w-full max-w-[380px] h-[500px] bg-[#0b0710]/95 border border-[rgba(245,240,250,0.14)] rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md animate-fadeIn">
          {/* Header */}
          <div className="p-4 border-b border-card-border bg-[#120f17] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles size={16} className="text-neon-pink animate-pulse" />
              <span className="text-xs font-black tracking-widest text-neon-pink uppercase">
                ASK THE HUB
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-foreground/45 hover:text-white transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 text-sm scrollbar-thin">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-xl ${
                    msg.role === "user"
                      ? "bg-neon-pink/10 border border-neon-pink/20 text-white rounded-tr-none"
                      : "bg-[#14121a] border border-card-border text-foreground/90 rounded-tl-none"
                  }`}
                >
                  {msg.text === "" ? (
                    <div className="flex items-center space-x-1.5 py-1">
                      <Loader2 className="w-4 h-4 text-neon-pink animate-spin" />
                      <span className="text-xs text-foreground/45 font-mono">Searching hub database...</span>
                    </div>
                  ) : (
                    renderMessageText(msg.text)
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 border-t border-card-border bg-[#120f17]/50 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Lucia, heists, map, codes..."
              disabled={isTyping}
              className="flex-grow px-3.5 py-2 bg-background border border-card-border focus:border-neon-pink focus:ring-1 focus:ring-neon-pink outline-none rounded-lg text-sm text-white placeholder-foreground/30 transition-all"
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="p-2.5 bg-neon-pink hover:bg-neon-pink/90 text-white rounded-lg transition disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
