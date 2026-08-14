"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Terminal, X, Keyboard, HelpCircle } from "lucide-react"
import { toast } from "sonner"

export default function ConsoleModeManager() {
  const [isActive, setIsActive] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const router = useRouter()
  const pathname = usePathname()

  const lastKeyRef = useRef<string>("")
  const cardsRef = useRef<HTMLElement[]>([])

  // Expose toggle event for header button integration
  useEffect(() => {
    const handleToggleEvent = () => {
      setIsActive((prev) => {
        const next = !prev
        handleActivationToast(next)
        return next
      })
    }

    window.addEventListener("toggle-console-mode", handleToggleEvent)
    return () => window.removeEventListener("toggle-console-mode", handleToggleEvent)
  }, [])

  // Show a toast or screen alert on toggle
  const handleActivationToast = (active: boolean) => {
    if (active) {
      const hintShown = sessionStorage.getItem("console_mode_hint_shown")
      if (!hintShown) {
        toast.info("Console Mode Active! Use j/k to navigate cards, ? for key shortcuts.", {
          duration: 6000,
          icon: <Terminal className="w-4 h-4 text-[#FF8A3D]" />,
        })
        sessionStorage.setItem("console_mode_hint_shown", "true")
      } else {
        toast("Console mode enabled.", {
          icon: <Terminal className="w-4 h-4 text-[#FF8A3D]" />,
        })
      }
    } else {
      toast("Console mode disabled.")
    }
  }

  // Find all focusable list cards on the current page
  const scanCards = () => {
    if (typeof document === "undefined") return []
    // Look for standard list page items (articles, group cards, etc.)
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(
        "article, a.group, .card-group, [data-focusable-card], .group\\/item"
      )
    ).filter((el) => {
      // Filter out elements that are inside header, footer, or sidebar
      const isHeaderOrFooter = el.closest("header") || el.closest("footer") || el.closest("aside")
      return !isHeaderOrFooter
    })
    return elements
  }

  // Clear previous outlines
  const clearFocusedOutlines = () => {
    cardsRef.current.forEach((card) => {
      card.style.outline = ""
      card.style.outlineOffset = ""
      card.style.boxShadow = ""
    })
  }

  // Track route changes to reset card focus index
  useEffect(() => {
    clearFocusedOutlines()
    setFocusedIndex(-1)
    cardsRef.current = []
  }, [pathname])

  // Move highlight selection on list pages
  const navigateCards = useCallback((direction: number) => {
    const list = scanCards()
    if (list.length === 0) return

    cardsRef.current = list
    clearFocusedOutlines()

    let nextIndex = focusedIndex + direction
    if (nextIndex < 0) nextIndex = list.length - 1
    if (nextIndex >= list.length) nextIndex = 0

    const targetCard = list[nextIndex]
    if (targetCard) {
      // Highlight focused element with orange focus outline matching requirements
      targetCard.style.outline = "3px solid #FF8A3D"
      targetCard.style.outlineOffset = "4px"
      targetCard.style.boxShadow = "0 0 20px rgba(255, 138, 61, 0.45)"

      // Scroll into view gently
      targetCard.scrollIntoView({ behavior: "smooth", block: "nearest" })
      setFocusedIndex(nextIndex)
    }
  }, [focusedIndex]);

  // Keypress event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Safe Typing Check: Do not intercept keys if user is typing
      const activeEl = document.activeElement
      if (activeEl) {
        const tagName = activeEl.tagName.toUpperCase()
        const isInput = tagName === "INPUT" || tagName === "TEXTAREA"
        const isContentEditable = activeEl.hasAttribute("contenteditable")
        if (isInput || isContentEditable) return
      }

      // 2. Backtick key toggle (available globally)
      if (e.key === "`") {
        e.preventDefault()
        setIsActive((prev) => {
          const next = !prev
          handleActivationToast(next)
          return next
        })
        return
      }

      // If console mode is not active, do not handle any other keys
      if (!isActive) return

      // Handle shortcuts inside Console Mode
      switch (e.key) {
        case "Escape":
          e.preventDefault()
          setIsActive(false)
          toast("Console mode disabled.")
          break

        case "?":
          e.preventDefault()
          setShowShortcuts((prev) => !prev)
          break

        case "j":
          e.preventDefault()
          navigateCards(1)
          break

        case "k":
          e.preventDefault()
          navigateCards(-1)
          break

        case "Enter":
          if (focusedIndex >= 0 && cardsRef.current[focusedIndex]) {
            e.preventDefault()
            const card = cardsRef.current[focusedIndex]

            // Trigger link navigation if card itself is a link or has one
            const link = card.tagName === "A" ? (card as HTMLAnchorElement) : card.querySelector<HTMLAnchorElement>("a")
            if (link && link.href) {
              router.push(link.pathname + link.search)
            } else {
              card.click()
            }
          }
          break

        case "/":
          e.preventDefault()
          // Open standard global search command-palette overlay
          window.dispatchEvent(new CustomEvent("open-global-search"))
          break

        default:
          // Handle sequential keys: g then m / g then n
          if (lastKeyRef.current === "g") {
            if (e.key === "m") {
              e.preventDefault()
              router.push("/map")
              toast.info("Navigating to Map Slices...")
            } else if (e.key === "n") {
              e.preventDefault()
              router.push("/news")
              toast.info("Navigating to News Room...")
            }
            lastKeyRef.current = ""
          } else {
            if (e.key === "g") {
              lastKeyRef.current = "g"
              // Clear 'g' state after 1s if no next key is pressed
              setTimeout(() => {
                if (lastKeyRef.current === "g") lastKeyRef.current = ""
              }, 1000)
            }
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isActive, focusedIndex, router, navigateCards])

  if (!isActive) return null

  return (
    <>
      {/* Persistent Console HUD Badge */}
      <div className="fixed bottom-20 right-6 sm:bottom-6 sm:right-6 z-50 animate-fade-in duration-300">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#16161B] border border-[#FF8A3D] text-[#FF8A3D] shadow-[0_0_15px_rgba(255,138,61,0.3)] font-mono text-[10px] font-black uppercase tracking-widest select-none">
          <Terminal className="w-3.5 h-3.5 animate-pulse text-[#FF8A3D]" />
          <span>Console Mode Active</span>
          <button
            onClick={() => setShowShortcuts(true)}
            className="hover:text-white transition p-0.5 ml-1"
            title="Help / Keyboard Shortcuts"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal overlay */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 bg-[#0B0B0F]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-[#16161B] border border-[#FF8A3D] rounded-xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">

            {/* Close Button */}
            <button
              onClick={() => setShowShortcuts(false)}
              className="absolute top-4 right-4 text-[#9E9EA8] hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-[#FF8A3D] font-mono text-[11px] font-bold uppercase tracking-widest">
                <Keyboard className="w-4 h-4" />
                <span>Operator Override Bindings</span>
              </div>
              <h3 className="text-xl font-anton text-white uppercase tracking-tight">Console Command Map</h3>
            </div>

            {/* Keys Table */}
            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-3 gap-2 border-b border-[rgba(245,245,247,0.1)] pb-2 text-[#9E9EA8] font-bold uppercase text-[10px]">
                <span>KEYBIND</span>
                <span className="col-span-2">SYSTEM ACTION</span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-[#FF8A3D] font-extrabold bg-[#0B0B0F] px-1.5 py-0.5 rounded border border-[#FF8A3D]/25 w-max">j / k</span>
                  <span className="col-span-2 text-white/90">Move card outline focus down / up</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <span className="text-[#FF8A3D] font-extrabold bg-[#0B0B0F] px-1.5 py-0.5 rounded border border-[#FF8A3D]/25 w-max">Enter</span>
                  <span className="col-span-2 text-white/90">Open highlighted target profile/news</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <span className="text-[#FF8A3D] font-extrabold bg-[#0B0B0F] px-1.5 py-0.5 rounded border border-[#FF8A3D]/25 w-max">/</span>
                  <span className="col-span-2 text-white/90">Focus global search radar</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <span className="text-[#FF8A3D] font-extrabold bg-[#0B0B0F] px-1.5 py-0.5 rounded border border-[#FF8A3D]/25 w-max">g then m</span>
                  <span className="col-span-2 text-white/90">Hyperjump navigate to /map</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <span className="text-[#FF8A3D] font-extrabold bg-[#0B0B0F] px-1.5 py-0.5 rounded border border-[#FF8A3D]/25 w-max">g then n</span>
                  <span className="col-span-2 text-white/90">Hyperjump navigate to /news</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <span className="text-[#FF8A3D] font-extrabold bg-[#0B0B0F] px-1.5 py-0.5 rounded border border-[#FF8A3D]/25 w-max">`</span>
                  <span className="col-span-2 text-white/90">Toggle Console Mode active/inactive</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <span className="text-[#FF8A3D] font-extrabold bg-[#0B0B0F] px-1.5 py-0.5 rounded border border-[#FF8A3D]/25 w-max">Esc</span>
                  <span className="col-span-2 text-white/90">Deactivate console mode</span>
                </div>
              </div>
            </div>

            {/* Footer row */}
            <div className="pt-4 border-t border-[rgba(245,245,247,0.1)] text-center">
              <button
                onClick={() => setShowShortcuts(false)}
                className="px-5 py-2 rounded bg-[#FF8A3D] hover:bg-[#FF8A3D]/90 text-black font-mono font-black uppercase text-xs tracking-widest"
              >
                De-escalate View
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
