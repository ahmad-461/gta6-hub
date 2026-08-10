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
    const handleClick = (e: Event) => {
      const target = e.currentTarget as HTMLElement
      target.classList.toggle("revealed")
    }

    spoilers.forEach((spoiler) => {
      spoiler.addEventListener("click", handleClick)
    })

    return () => {
      spoilers.forEach((spoiler) => {
        spoiler.removeEventListener("click", handleClick)
      })
    }
  }, [content])

  return (
    <div
      ref={containerRef}
      className="guide-content prose prose-invert max-w-none
                 prose-headings:font-black
                 [&_h2]:border-l-4 [&_h2]:border-neon-blue [&_h2]:pl-4 [&_h2]:my-6 [&_h2]:text-white [&_h2]:font-extrabold [&_h2]:text-2xl
                 [&_p]:leading-relaxed [&_p]:text-foreground/90 [&_p]:mb-4
                 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4
                 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4

                 /* CSS Counter for Guide Steps on H2 headings */
                 [counter-reset:h2-counter]
                 [&_h2]:[counter-increment:h2-counter]
                 [&_h2]:before:content-['Step_'_counter(h2-counter)_':_']
                 [&_h2]:before:text-neon-blue [&_h2]:before:font-black [&_h2]:before:mr-1
                 "
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
