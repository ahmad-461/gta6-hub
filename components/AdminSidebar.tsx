"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Users,
  Key,
  Image as ImageIcon,
  MessageSquare,
  Settings,
  Users2,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Power,
  Compass,
  MapPin,
  Video
} from "lucide-react"

interface AdminSidebarProps {
  user: {
    email: string
    name: string
    role: string
  }
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Escape key to close logout modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isModalOpen])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error(error.message)
        setIsSigningOut(false)
        return
      }
      toast.success("Signed out successfully.")
      // Trigger hard refresh to login page to guarantee middleware cookie sync
      window.location.href = "/admin/login"
    } catch (err) {
      toast.error("Failed to sign out.")
      setIsSigningOut(false)
    }
  }

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["admin", "editor"] },
    { name: "Articles", href: "/admin/articles", icon: FileText, roles: ["admin", "editor"] },
    { name: "Guides", href: "/admin/guides", icon: BookOpen, roles: ["admin", "editor"] },
    { name: "Characters", href: "/admin/characters", icon: Users, roles: ["admin", "editor"] },
    { name: "Map Locations", href: "/admin/map-locations", icon: MapPin, roles: ["admin", "editor"] },
    { name: "Trailers", href: "/admin/trailers", icon: Video, roles: ["admin", "editor"] },
    { name: "Lore Topics", href: "/admin/lore-topics", icon: Compass, roles: ["admin", "editor"] },
    { name: "Cheat Codes", href: "/admin/cheats", icon: Key, roles: ["admin", "editor"] },
    { name: "Media Library", href: "/admin/media", icon: ImageIcon, roles: ["admin", "editor"] },
    { name: "Comments", href: "/admin/comments", icon: MessageSquare, roles: ["admin", "editor"] },
    { name: "Site Settings", href: "/admin/settings", icon: Settings, roles: ["admin"] },
    { name: "User Manager", href: "/admin/users", icon: Users2, roles: ["admin"] },
  ]

  const filteredItems = menuItems.filter((item) => item.roles.includes(user.role))

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AD"
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between bg-ink-2 border-b border-[rgba(245,240,250,0.14)] px-4 py-4 sticky top-0 z-40">
        <Link href="/admin" prefetch={false} className="text-xl font-normal tracking-widest text-paper font-anton uppercase">
          GTA6<span className="text-magenta">HUB</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-paper-dim hover:text-white focus:outline-none p-1.5 rounded-lg border border-[rgba(245,240,250,0.14)] bg-ink transition-all"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 lg:sticky lg:top-0 z-40 w-64 bg-ink-2 border-r border-[rgba(245,240,250,0.14)] flex flex-col justify-between transition-all duration-300 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } h-[calc(100vh-57px)] lg:h-screen`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo Section */}
          <div className="hidden lg:flex items-center px-6 py-6 border-b border-[rgba(245,240,250,0.14)]">
            <Link href="/admin" prefetch={false} className="text-2xl font-normal tracking-widest text-paper font-anton uppercase group">
              GTA6<span className="text-magenta transition-all group-hover:text-magenta/80">HUB</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1 font-mono">
            {filteredItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={false}
                  onClick={() => {
                    console.log(`[AUTH SIDEBAR CLICK] Clicking category: ${item.name} -> ${item.href}`)
                    setIsOpen(false)
                  }}
                  className={`flex items-center px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition duration-150 ${
                    isActive
                      ? "bg-ink text-magenta border-l-2 border-magenta"
                      : "text-paper-dim hover:bg-ink hover:text-paper"
                  }`}
                >
                  <Icon size={16} className="mr-3 shrink-0" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Premium Admin Session & Exit Hub Block */}
        <div className="p-4 border-t border-[rgba(245,240,250,0.14)] bg-ink/95 space-y-4 font-mono">
          <div className="p-3.5 rounded-xl border border-[rgba(245,240,250,0.14)] bg-ink-2 space-y-3">
            <p className="text-[10px] font-bold text-paper-dim uppercase tracking-widest">
              Admin Session
            </p>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 shrink-0 bg-gradient-to-tr from-magenta/20 to-orange/20 border border-[rgba(245,240,250,0.14)] flex items-center justify-center rounded-lg font-black text-white text-sm font-mono tracking-wider shadow-inner">
                {getInitials(user.name)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate leading-tight">{user.name}</p>
                <p className="text-[11px] text-paper-dim font-medium capitalize mt-0.5 tracking-wide">{user.role}</p>
              </div>
            </div>

            {/* Secure Status Badge */}
            <div className="flex items-center space-x-2 pt-1 border-t border-[rgba(245,240,250,0.14)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest font-mono">
                Secure Connection
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center w-full px-4 py-3 text-xs font-bold uppercase tracking-widest text-paper-dim hover:text-white bg-ink-2/40 hover:bg-magenta/10 border border-[rgba(245,240,250,0.14)] hover:border-magenta/40 rounded-lg transition-all duration-300 shadow-sm"
          >
            <Power size={14} className="mr-2 text-magenta" />
            Exit Hub
          </button>
        </div>
      </aside>

      {/* Premium EXIT HUB Logout Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity"
            onClick={() => {
              if (!isSigningOut) setIsModalOpen(false)
            }}
          ></div>

          {/* Modal Card */}
          <div className="relative bg-ink-2 border border-magenta/30 rounded-xl max-w-sm w-full p-6 shadow-[0_0_50px_rgba(255,46,136,0.15)] transform transition-all animate-in fade-in zoom-in-95 duration-200 font-mono">
            {/* Corner cybernetic accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-orange"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-orange"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-orange"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-orange"></div>

            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-magenta/10 border border-magenta/30 text-magenta">
                <Power size={22} className="animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-white tracking-widest uppercase font-anton">
                  Exit The Hub?
                </h3>
                <p className="text-xs text-paper-dim font-medium leading-relaxed">
                  Your secure administrator session will be terminated and credentials cleared.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-ink border border-[rgba(245,240,250,0.14)] text-paper-dim hover:text-white text-xs font-bold uppercase tracking-widest rounded transition-all duration-200 hover:border-foreground/20 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                  className="flex items-center justify-center px-4 py-2.5 bg-magenta hover:bg-magenta/90 text-white text-xs font-black uppercase tracking-widest rounded transition-all duration-200 shadow-[0_0_15px_rgba(255,46,136,0.4)] hover:shadow-[0_0_25px_rgba(255,46,136,0.6)] disabled:opacity-50"
                >
                  {isSigningOut ? (
                    <span className="flex items-center space-x-2">
                      <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Exiting...</span>
                    </span>
                  ) : (
                    "Exit Hub"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
