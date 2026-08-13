"use client"

import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import LoadingSkeleton from "@/components/ui/LoadingSkeleton"
import { toast } from "sonner"
import { Clock, Search, Filter, Loader2, ShieldCheck, UserMinus, ShieldAlert } from "lucide-react"

export default function AuditTrailPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [actors, setActors] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [checkingRole, setCheckingRole] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedActor, setSelectedActor] = useState("")
  const [selectedAction, setSelectedAction] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    const checkAdminRole = async () => {
      setCheckingRole(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setCheckingRole(false)
          setLoading(false)
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (profile && profile.role === "admin") {
          setIsAdmin(true)
          fetchActivities()
          fetchActors()
        } else {
          setIsAdmin(false)
          setCheckingRole(false)
          setLoading(false)
        }
      } catch (err) {
        console.error("[AUDIT] checkAdminRole error:", err)
        setIsAdmin(false)
        setCheckingRole(false)
        setLoading(false)
      }
    }

    checkAdminRole()
  }, [])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("activity_log")
        .select(`
          id,
          action,
          entity_type,
          entity_id,
          entity_title,
          created_at,
          actor_id,
          profiles (
            name,
            email
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setActivities(data || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load audit activities.")
    } finally {
      setLoading(false)
      setCheckingRole(false)
    }
  }

  const fetchActors = async () => {
    try {
      const { data } = await supabase.from("profiles").select("id, name")
      setActors(data || [])
    } catch (err) {
      console.error("[AUDIT] failed to fetch profiles:", err)
    }
  }

  // Filter logic
  const filteredActivities = activities.filter((act) => {
    const matchesSearch =
      (act.entity_title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.action || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.entity_type || "").toLowerCase().includes(searchQuery.toLowerCase())

    const matchesActor = selectedActor ? act.actor_id === selectedActor : true
    const matchesAction = selectedAction ? act.action === selectedAction : true

    let matchesDate = true
    const actDate = new Date(act.created_at)
    if (startDate) {
      matchesDate = matchesDate && actDate >= new Date(startDate)
    }
    if (endDate) {
      matchesDate = matchesDate && actDate <= new Date(endDate + "T23:59:59")
    }

    return matchesSearch && matchesActor && matchesAction && matchesDate
  })

  if (checkingRole) {
    return (
      <div className="flex items-center justify-center py-20 font-mono">
        <Loader2 className="animate-spin text-[#00E5FF] h-8 w-8" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="py-12 max-w-xl mx-auto font-mono text-center space-y-6">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#FF2E88]/10 border border-[#FF2E88]/30 text-[#FF2E88]">
          <ShieldAlert size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-normal text-white uppercase tracking-widest font-anton">
            Access Denied
          </h2>
          <p className="text-xs text-[#9C8FAE] leading-relaxed">
            The security level of this audit terminal requires absolute Administrator clearance. Editors are barred from retrieving action trails.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 font-mono">
      {/* Header */}
      <div className="border-b border-[rgba(245,240,250,0.14)] pb-6">
        <h1 className="text-3xl font-normal text-white tracking-widest sm:text-4xl font-anton uppercase">
          Audit Trail
        </h1>
        <p className="mt-2 text-xs text-[#9C8FAE]">
          Review comprehensive logs of all mutations, content publishes, or deletions made across the Leonida CMS.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <input
              type="text"
              placeholder="Search by keywords, title, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition text-xs font-bold"
            />
          </div>

          {/* Actor Select */}
          <select
            value={selectedActor}
            onChange={(e) => setSelectedActor(e.target.value)}
            className="px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white text-xs focus:outline-none cursor-pointer font-bold"
          >
            <option value="">All Staff</option>
            {actors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.name}
              </option>
            ))}
          </select>

          {/* Action Select */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white text-xs focus:outline-none cursor-pointer font-bold"
          >
            <option value="">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
            <option value="published">Published</option>
            <option value="approved">Approved</option>
            <option value="spam">Spam Flag</option>
          </select>
        </div>

        {/* Date Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 border-t border-[rgba(245,240,250,0.08)]">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-[#9C8FAE] uppercase tracking-wider font-bold">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-xs text-white focus:outline-none"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-[#9C8FAE] uppercase tracking-wider font-bold">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-xs text-white focus:outline-none"
            />
          </div>
          {(startDate || endDate || selectedActor || selectedAction || searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedActor("")
                setSelectedAction("")
                setStartDate("")
                setEndDate("")
              }}
              className="text-xs font-bold text-[#FF2E88] hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Table */}
      {loading ? (
        <LoadingSkeleton type="table" rows={8} cols={5} />
      ) : filteredActivities.length > 0 ? (
        <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] rounded overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0B0710] border-b border-[rgba(245,240,250,0.14)] text-[#9C8FAE]/50 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Actor / Staff</th>
                  <th className="py-4 px-6">Action</th>
                  <th className="py-4 px-6">Entity Class</th>
                  <th className="py-4 px-6">Target Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(245,240,250,0.08)] text-xs">
                {filteredActivities.map((act, idx) => {
                  const staffName = (act.profiles as any)?.name || "System"
                  const staffEmail = (act.profiles as any)?.email ? ` (${(act.profiles as any).email})` : ""

                  // Action Badge styling
                  let actionClass = "bg-white/5 text-[#9C8FAE]"
                  if (act.action === "created") actionClass = "bg-[#00E5FF]/10 text-[#00E5FF]"
                  if (act.action === "published" || act.action === "approved") actionClass = "bg-emerald-500/10 text-emerald-400"
                  if (act.action === "deleted") actionClass = "bg-[#FF2E88]/10 text-[#FF2E88]"

                  return (
                    <tr
                      key={act.id}
                      className={idx % 2 === 0 ? "bg-[#150C1F]" : "bg-[#0B0710] hover:bg-[#150C1F]/40 transition duration-150"}
                    >
                      <td className="py-4 px-6 font-semibold text-[#9C8FAE]">
                        {new Date(act.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-white font-bold">
                        <span>{staffName}</span>
                        <span className="text-[10px] text-[#9C8FAE]/40 font-normal">{staffEmail}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${actionClass}`}>
                          {act.action}
                        </span>
                      </td>
                      <td className="py-4 px-6 uppercase tracking-wider text-[10px] text-white/70 font-bold">
                        {act.entity_type.replace("_", " ")}
                      </td>
                      <td className="py-4 px-6 text-white font-semibold break-all max-w-sm">
                        {act.entity_title}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Clock size={40} />}
          title="No Logs Logged"
          description="Activity events will pop up as administrators add, edit, or remove content records."
        />
      )}
    </div>
  )
}
