"use client"

import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { logAdminActivity } from "@/lib/activity"
import EmptyState from "@/components/ui/EmptyState"
import LoadingSkeleton from "@/components/ui/LoadingSkeleton"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import {
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  Save,
  Search,
  ArrowUpDown,
  X,
  Loader2
} from "lucide-react"

interface FaqItemData {
  id: string
  question: string
  answer: string
  display_order: number
  created_at: string
}

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<FaqItemData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<keyof FaqItemData>("display_order")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [displayOrder, setDisplayOrder] = useState<number>(0)

  useEffect(() => {
    fetchFaqs()
  }, [])

  const fetchFaqs = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("site_faqs")
        .select("id, question, answer, display_order, created_at")
        .order("display_order", { ascending: true })

      if (error) throw error
      setFaqs(data || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load FAQs.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingId(null)
    setQuestion("")
    setAnswer("")
    const nextOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.display_order)) + 1 : 1
    setDisplayOrder(nextOrder)
    setIsFormOpen(true)
  }

  const handleEdit = (item: FaqItemData) => {
    setEditingId(item.id)
    setQuestion(item.question)
    setAnswer(item.answer)
    setDisplayOrder(item.display_order)
    setIsFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) {
      toast.error("Please enter a question.")
      return
    }
    if (!answer.trim()) {
      toast.error("Please enter an answer.")
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        question: question.trim(),
        answer: answer.trim(),
        display_order: Number(displayOrder) || 0,
      }

      if (editingId) {
        const { error } = await supabase
          .from("site_faqs")
          .update(payload)
          .eq("id", editingId)

        if (error) throw error

        await logAdminActivity({
          action: "updated",
          entityType: "faq",
          entityId: editingId,
          entityTitle: payload.question,
        })

        toast.success("FAQ updated successfully!")
      } else {
        const { data, error } = await supabase
          .from("site_faqs")
          .insert(payload)
          .select("id")
          .single()

        if (error) throw error

        await logAdminActivity({
          action: "created",
          entityType: "faq",
          entityId: data?.id,
          entityTitle: payload.question,
        })

        toast.success("FAQ created successfully!")
      }

      setIsFormOpen(false)
      fetchFaqs()
    } catch (err: any) {
      toast.error(err.message || "Failed to save FAQ entry.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (item: FaqItemData) => {
    if (!confirm(`Are you sure you want to delete this FAQ: "${item.question}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from("site_faqs")
        .delete()
        .eq("id", item.id)

      if (error) throw error

      await logAdminActivity({
        action: "deleted",
        entityType: "faq",
        entityId: item.id,
        entityTitle: item.question,
      })

      toast.success("FAQ deleted successfully!")
      fetchFaqs()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete FAQ entry.")
    }
  }

  const handleSort = (field: keyof FaqItemData) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const filteredFaqs = faqs
    .filter((item) => {
      const q = searchQuery.toLowerCase()
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (sortField === "display_order") {
        return sortOrder === "asc"
          ? a.display_order - b.display_order
          : b.display_order - a.display_order
      }
      const valA = String(a[sortField] || "")
      const valB = String(b[sortField] || "")
      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA)
    })

  return (
    <div className="space-y-8 font-mono max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(245,240,250,0.14)] pb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <HelpCircle className="w-5 h-5 text-[#FF2E88]" />
            <span className="text-xs font-black tracking-widest text-[#FF2D8D] uppercase">
              Static Intel FAQ Database
            </span>
          </div>
          <h1 className="text-3xl font-normal text-white tracking-widest sm:text-4xl font-anton uppercase">
            FAQ Manager
          </h1>
          <p className="mt-2 text-xs text-[#9C8FAE]">
            Manage sitewide Frequently Asked Questions published at /faq.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={handleAddNew}
            className="inline-flex items-center justify-center"
          >
            <Plus size={18} className="mr-2" />
            New FAQ
          </Button>
        </div>
      </div>

      {/* CRUD Form overlay */}
      {isFormOpen && (
        <Card variant="standard" padding="md" className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[rgba(245,240,250,0.14)] pb-3 mb-2">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">
              {editingId ? "Edit FAQ Entry" : "Create New FAQ Entry"}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-[#9C8FAE] hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <Input
                  label="Question"
                  required
                  placeholder="e.g. When is GTA 6 releasing?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="Display Order"
                  type="number"
                  required
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-[#9C8FAE] mb-1.5 uppercase">
                  Answer
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide a detailed, accurate answer in site editorial voice..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSaving}
                className="inline-flex items-center space-x-1.5"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{editingId ? "Update FAQ" : "Save FAQ"}</span>
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter Row */}
      <Card variant="standard" padding="md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C8FAE]/40" />
          <input
            type="text"
            placeholder="Search FAQs by question or answer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] rounded text-white placeholder-[#9C8FAE]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition text-xs font-mono"
          />
        </div>
      </Card>

      {/* FAQ Table / List */}
      {isLoading ? (
        <LoadingSkeleton type="table" rows={6} cols={4} />
      ) : filteredFaqs.length > 0 ? (
        <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] rounded overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0B0710] border-b border-[rgba(245,240,250,0.14)] text-[#9C8FAE]/50 text-xs font-bold uppercase tracking-wider sticky top-0 z-10">
                  <th
                    className="py-4 px-4 w-20 cursor-pointer hover:bg-[#0B0710]/80 select-none text-center"
                    onClick={() => handleSort("display_order")}
                  >
                    <span className="flex items-center justify-center space-x-1">
                      <span>Order</span>
                      <ArrowUpDown size={12} className="text-[#9C8FAE]/40" />
                    </span>
                  </th>
                  <th
                    className="py-4 px-6 cursor-pointer hover:bg-[#0B0710]/80 select-none"
                    onClick={() => handleSort("question")}
                  >
                    <span className="flex items-center space-x-1">
                      <span>Question</span>
                      <ArrowUpDown size={12} className="text-[#9C8FAE]/40" />
                    </span>
                  </th>
                  <th className="py-4 px-6">Answer</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(245,240,250,0.08)] text-xs">
                {filteredFaqs.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`transition duration-150 ${
                      idx % 2 === 0 ? "bg-[#150C1F]" : "bg-[#0B0710]"
                    }`}
                  >
                    <td className="py-4 px-4 text-center font-bold text-[#FF8A3D]">
                      {item.display_order}
                    </td>
                    <td className="py-4 px-6 font-semibold text-white max-w-xs">
                      {item.question}
                    </td>
                    <td className="py-4 px-6 text-[#9C8FAE]/80 max-w-md line-clamp-2">
                      {item.answer}
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(item)}
                        className="inline-flex p-1.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] hover:border-[#00E5FF]/50 text-[#9C8FAE] hover:text-[#00E5FF] rounded transition"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="inline-flex p-1.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] hover:border-[#FF2E88]/50 text-[#9C8FAE] hover:text-[#FF2E88] rounded transition"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<HelpCircle className="w-12 h-12 text-[#FF2D8D]/30 mx-auto" />}
          title="No FAQ Entries Found"
          description="Create sitewide FAQ questions and answers using the form above."
        />
      )}
    </div>
  )
}
