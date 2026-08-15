"use client"

import React, { useEffect, useRef } from "react"

interface ArticleContentRendererProps {
  content: string
}

export default function ArticleContentRenderer({ content }: ArticleContentRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Auto-wrap tables in overflow-x containers for mobile responsiveness
    const tables = container.querySelectorAll("table")
    tables.forEach((table) => {
      if (!table.parentElement?.classList.contains("article-table-container")) {
        const wrapper = document.createElement("div")
        wrapper.className = "article-table-container"
        table.parentNode?.insertBefore(wrapper, table)
        wrapper.appendChild(table)
      }
    })

    const spoilers = container.querySelectorAll("[data-spoiler]")
    const handleSpoilerClick = (e: Event) => {
      const target = e.currentTarget as HTMLElement
      target.classList.toggle("revealed")
    }

    spoilers.forEach((spoiler) => {
      spoiler.addEventListener("click", handleSpoilerClick)
    })

    const redactedElements = container.querySelectorAll("[data-redacted]")
    const handleRedactedClick = (e: Event) => {
      const target = e.currentTarget as HTMLElement
      target.classList.toggle("revealed")
    }
    const handleRedactedKeyDown = (e: Event) => {
      const keyEvent = e as KeyboardEvent
      if (keyEvent.key === "Enter" || keyEvent.key === " ") {
        keyEvent.preventDefault()
        const target = keyEvent.currentTarget as HTMLElement
        target.classList.toggle("revealed")
      }
    }

    redactedElements.forEach((el) => {
      el.addEventListener("click", handleRedactedClick)
      el.addEventListener("keydown", handleRedactedKeyDown)
      if (!el.getAttribute("tabindex")) {
        el.setAttribute("tabindex", "0")
      }
    })

    return () => {
      spoilers.forEach((spoiler) => {
        spoiler.removeEventListener("click", handleSpoilerClick)
      })
      redactedElements.forEach((el) => {
        el.removeEventListener("click", handleRedactedClick)
        el.removeEventListener("keydown", handleRedactedKeyDown)
      })
    }
  }, [content])

  return (
    <div
      ref={containerRef}
      className="article-content prose prose-invert max-w-none
                 prose-headings:font-black
                 [&_h2]:border-l-4 [&_h2]:border-neon-pink [&_h2]:pl-4 [&_h2]:my-6 [&_h2]:text-white [&_h2]:font-extrabold [&_h2]:text-2xl
                 [&_p]:leading-relaxed [&_p]:text-foreground/90 [&_p]:mb-4
                 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4
                 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4
                 "
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
