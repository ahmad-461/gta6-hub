"use client"

import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
  Users2,
  Shield,
  User,
  Power,
  PowerOff,
  Search,
  Loader2,
  CheckCircle,
  AlertTriangle
} from "lucide-react"

export default function UserManagerPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchCurrentUser()
    fetchProfiles()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchProfiles = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setProfiles(data || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load user profiles.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangeRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "editor" : "admin"

    if (id === currentUser?.id) {
      toast.error("You cannot change your own role!")
      return
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", id)

      if (error) throw error
      toast.success("User role updated successfully!")
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, role: newRole } : p))
      )
    } catch (err: any) {
      toast.error(err.message || "Failed to change user role.")
    }
  }

  const handleToggleDisable = async (id: string, currentDisabled: boolean) => {
    const newDisabled = !currentDisabled

    if (id === currentUser?.id) {
      toast.error("You cannot disable your own administrator account!")
      return
    }

    const confirmMsg = newDisabled
      ? "Are you sure you want to disable this user account? They will be immediately blocked from logging in."
      : "Are you sure you want to re-enable this user account?"

    if (!confirm(confirmMsg)) return

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ disabled: newDisabled })
        .eq("id", id)

      if (error) throw error
      toast.success(newDisabled ? "Account disabled!" : "Account re-enabled!")
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, disabled: newDisabled } : p))
      )
    } catch (err: any) {
      toast.error(err.message || "Failed to modify user status.")
    }
  }

  const filteredProfiles = profiles.filter((p) =>
    (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          User Manager
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          List site accounts, toggle access credentials (admin/editor), and temporarily block compromised credentials.
        </p>
      </div>

      {/* Warning */}
      <div className="bg-[#110f17] border border-card-border p-4 rounded-xl flex items-start space-x-3 text-xs text-foreground/60">
        <AlertTriangle className="text-neon-pink flex-shrink-0 mt-0.5" size={16} />
        <div>
          <p className="font-semibold text-white">Soft Account Suspension Details:</p>
          <p className="mt-1">
            Suspended accounts have their session revoked by our middleware check. They will be immediately logged out and blocked from entering the admin dashboard panel.
          </p>
        </div>
      </div>

      {/* Filters & Searches */}
      <div className="bg-card-bg border border-card-border p-4 rounded-xl flex items-center">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground/40">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by profile name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 bg-[#100e16] border border-card-border rounded-lg text-white placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent transition duration-150 text-sm"
          />
        </div>
      </div>

      {/* Profiles Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-neon-blue h-8 w-8" />
        </div>
      ) : filteredProfiles.length > 0 ? (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#110f17] border-b border-card-border text-foreground/50 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">User Profile</th>
                  <th className="py-4 px-6">Email Credentials</th>
                  <th className="py-4 px-6">Current Role</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/50 text-sm">
                {filteredProfiles.map((profile) => {
                  const isSelf = profile.id === currentUser?.id
                  return (
                    <tr key={profile.id} className="hover:bg-[#110f17]/40 transition duration-150">
                      <td className="py-4 px-6 font-semibold text-white">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            profile.role === "admin" ? "bg-neon-pink/10 text-neon-pink" : "bg-neon-blue/10 text-neon-blue"
                          }`}>
                            {profile.role === "admin" ? <Shield size={18} /> : <User size={18} />}
                          </div>
                          <div>
                            <p>{profile.name}</p>
                            {isSelf && <span className="text-[10px] bg-neon-pink/15 text-neon-pink font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">You</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-foreground/60 font-mono">{profile.email}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                          profile.role === "admin" ? "bg-neon-pink/15 text-neon-pink" : "bg-neon-blue/15 text-neon-blue"
                        }`}>
                          {profile.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {profile.disabled ? (
                          <span className="inline-flex items-center text-neon-pink text-xs font-bold uppercase tracking-wider">
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-neon-blue text-xs font-bold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right space-x-1.5">
                        {/* Change Role Button */}
                        <button
                          disabled={isSelf}
                          onClick={() => handleChangeRole(profile.id, profile.role)}
                          className="px-3 py-1.5 bg-[#1a1822] border border-card-border hover:border-neon-blue/40 text-foreground/80 hover:text-white rounded text-xs font-bold uppercase tracking-wider transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Change user's authorization role"
                        >
                          Toggle Role
                        </button>

                        {/* Disable/Enable Button */}
                        <button
                          disabled={isSelf}
                          onClick={() => handleToggleDisable(profile.id, !!profile.disabled)}
                          className={`inline-flex items-center p-1.5 border rounded transition disabled:opacity-30 disabled:cursor-not-allowed ${
                            profile.disabled
                              ? "bg-neon-blue/10 border-neon-blue/20 text-neon-blue hover:bg-neon-blue/20"
                              : "bg-neon-pink/10 border-neon-pink/20 text-neon-pink hover:bg-neon-pink/20"
                          }`}
                          title={profile.disabled ? "Enable account" : "Suspend account"}
                        >
                          {profile.disabled ? <Power size={14} /> : <PowerOff size={14} />}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-card-border rounded-xl bg-card-bg/50">
          <Users2 size={40} className="mx-auto text-foreground/30 mb-3" />
          <p className="text-foreground/50 text-base">No user profiles found matching search criteria.</p>
        </div>
      )}
    </div>
  )
}
