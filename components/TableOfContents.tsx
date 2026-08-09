"use client"

import React, { useState, useEffect } from "react"

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  toc: TocItem[]
}

export default function TableOfContents({ toc }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    if (toc.length === 0) return

    const handleScroll = () => {
      // Find the element currently in view
      let currentActiveId = ""
      const scrollPosition = window.scrollY + 120 // offset for sticky headers

      for (const item of toc) {
        const el = document.getElementById(item.id)
        if (el) {
          const top = el.offsetTop
          if (scrollPosition >= top) {
            currentActiveId = item.id
          }
        }
      }

      // Fallback to first item if scrolled near top
      if (currentActiveId === "" && toc.length > 0) {
        currentActiveId = toc[0].id
      }

      setActiveId(currentActiveId)
    }

    window.addEventListener("scroll", handleScroll)
    // Run once on mount to highlight correct section
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [toc])

  if (toc.length === 0) return null

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      const top = el.offsetTop - 100 // offset for sticky headers
      window.scrollTo({
        top,
        behavior: "smooth",
      })
    }
  }

  return (
    <nav className="bg-card-bg border border-card-border rounded-lg p-5 space-y-4 sticky top-24 max-h-[calc(100vh-10rem)] overflow-y-auto">
      <h3 className="text-xs font-black tracking-widest text-white uppercase border-b border-card-border pb-2.5">
        Table of Contents
      </h3>
      <ul className="space-y-2">
        {toc.map((item) => {
          const isActive = item.id === activeId
          return (
            <li
              key={item.id}
              style={{ paddingLeft: `${(item.level - 2) * 0.75}rem` }}
              className="list-none"
            >
              <a
                href={`#${item.id}`}
                onClick={(e) => handleLinkClick(e, item.id)}
                className={`text-xs font-bold transition-all duration-200 block py-1 border-l-2 pl-3 ${
                  isActive
                    ? "text-neon-blue border-neon-blue glow-blue-text font-black"
                    : "text-foreground/50 border-transparent hover:text-foreground/80 hover:border-foreground/20"
                }`}
              >
                {item.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
