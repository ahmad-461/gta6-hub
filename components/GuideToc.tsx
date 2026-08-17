"use client"

import React, { useState, useEffect } from "react"
import { AlignLeft } from "lucide-react"

interface TocItem {
  id: string
  text: string
  level: number
}

interface GuideTocProps {
  toc: TocItem[]
}

export default function GuideToc({ toc }: GuideTocProps) {
  const [activeId, setActiveId] = useState("")

  useEffect(() => {
    if (!toc || toc.length === 0) return

    const observerOptions = {
      root: null,
      rootMargin: "-100px 0px -40% 0px",
      threshold: 0,
    }

    const headingElements = toc
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[]

    const observer = new IntersectionObserver((entries) => {
      const intersecting = entries.filter((e) => e.isIntersecting)
      if (intersecting.length > 0) {
        setActiveId(intersecting[0].target.id)
      }
    }, observerOptions)

    headingElements.forEach((el) => observer.observe(el))

    return () => {
      headingElements.forEach((el) => observer.unobserve(el))
    }
  }, [toc])

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
      setActiveId(id)
    }
  }

  if (!toc || toc.length === 0) return null

  return (
    <div className="bg-[#16161B] border border-[rgba(245,245,247,0.14)] rounded-xl p-5 shadow-xl sticky top-24 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 border-b border-[rgba(245,245,247,0.14)] pb-2 text-[#9E9EA8]">
        <AlignLeft className="w-4 h-4 text-[#FF8A3D]" />
        <h3 className="font-mono font-bold text-xs uppercase tracking-widest text-[#F5F5F7]">
          Table Of Contents
        </h3>
      </div>

      <nav className="space-y-1.5 text-xs font-mono">
        {toc.map((item) => {
          const isActive = activeId === item.id
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleLinkClick(e, item.id)}
              className={`block py-1.5 px-2.5 rounded transition-all duration-150 font-semibold border-l-2 leading-relaxed ${
                isActive
                  ? "border-[#FF8A3D] text-[#FF8A3D] bg-[#FF8A3D]/10 font-bold"
                  : "border-transparent text-[#9E9EA8] hover:text-[#F5F5F7] hover:border-[#FF2D8D]/40"
              } ${item.level > 2 ? "pl-5" : ""}`}
            >
              {item.text}
            </a>
          )
        })}
      </nav>
    </div>
  )
}
