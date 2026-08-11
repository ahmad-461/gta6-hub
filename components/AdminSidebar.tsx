"use client"

import React, { useState } from "react"
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
  Image,
  MessageSquare,
  Settings,
  Users2,
  LogOut,
  Menu,
  X,
  User
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

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success("Signed out successfully.")
      window.location.href = "/admin/login"
    } catch (err) {
      toast.error("Failed to sign out.")
    }
  }

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["admin", "editor"] },
    { name: "Articles", href: "/admin/articles", icon: FileText, roles: ["admin", "editor"] },
    { name: "Guides", href: "/admin/guides", icon: BookOpen, roles: ["admin", "editor"] },
    { name: "Characters", href: "/admin/characters", icon: Users, roles: ["admin", "editor"] },
    { name: "Cheat Codes", href: "/admin/cheats", icon: Key, roles: ["admin", "editor"] },
    { name: "Media Library", href: "/admin/media", icon: Image, roles: ["admin", "editor"] },
    { name: "Comments", href: "/admin/comments", icon: MessageSquare, roles: ["admin", "editor"] },
    { name: "Site Settings", href: "/admin/settings", icon: Settings, roles: ["admin"] },
    { name: "User Manager", href: "/admin/users", icon: Users2, roles: ["admin"] },
  ]

  const filteredItems = menuItems.filter((item) => item.roles.includes(user.role))

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between bg-card-bg border-b border-card-border px-4 py-4 sticky top-0 z-40">
        <Link href="/admin" className="text-xl font-bold tracking-tight text-white">
          GTA 6 <span className="text-neon-pink">Admin</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-foreground/80 hover:text-white focus:outline-none"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 lg:sticky lg:top-0 z-40 w-64 bg-[#0b0a0e] border-r border-card-border flex flex-col justify-between transition-transform duration-300 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } h-[calc(100vh-64px)] lg:h-screen`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo */}
          <div className="hidden lg:flex items-center px-6 py-6 border-b border-card-border">
            <Link href="/admin" className="text-2xl font-extrabold tracking-tight text-white">
              GTA 6 <span className="text-neon-pink">Admin</span>
            </Link>
          </div>

          {/* User Profile Info */}
          <div className="px-6 py-6 border-b border-card-border bg-[#110f17]">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-neon-pink/10 rounded-full text-neon-pink">
                <User size={20} />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold capitalize mt-1 ${
                  user.role === "admin"
                    ? "bg-neon-pink/10 text-neon-pink"
                    : "bg-neon-blue/10 text-neon-blue"
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {filteredItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    console.log(`[AUTH SIDEBAR CLICK] Clicking category: ${item.name} -> ${item.href}`)
                    setIsOpen(false)
                  }}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition duration-150 ${
                    isActive
                      ? "bg-neon-pink/10 text-neon-pink border-l-2 border-neon-pink"
                      : "text-foreground/60 hover:bg-[#15131a] hover:text-white"
                  }`}
                >
                  <Icon size={18} className="mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-card-border bg-[#0b0a0e]">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-foreground/60 hover:text-neon-pink hover:bg-neon-pink/5 rounded-lg transition duration-150"
          >
            <LogOut size={18} className="mr-3" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
