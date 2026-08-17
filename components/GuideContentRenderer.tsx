"use client"

import React, { useEffect, useRef } from "react"

interface GuideContentRendererProps {
  content: string
}

export default function GuideContentRenderer({ content }: GuideContentRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

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
      className="guide-content article-content prose prose-invert max-w-none
                 prose-headings:font-black
                 [&_h2]:border-l-4 [&_h2]:border-[#FF8A3D] [&_h2]:pl-4 [&_h2]:my-6 [&_h2]:text-[#F5F5F7] [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:font-anton [&_h2]:tracking-wide
                 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#F5F5F7] [&_h3]:my-4
                 [&_p]:leading-relaxed [&_p]:text-[#F5F5F7]/90 [&_p]:mb-4
                 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:space-y-1
                 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:space-y-1

                 /* CSS Counter for Guide Steps on H2 headings */
                 [counter-reset:h2-counter]
                 [&_h2]:[counter-increment:h2-counter]
                 [&_h2]:before:content-['Step_'_counter(h2-counter)_':_']
                 [&_h2]:before:text-[#FF8A3D] [&_h2]:before:font-mono [&_h2]:before:font-black [&_h2]:before:mr-1
                 "
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
