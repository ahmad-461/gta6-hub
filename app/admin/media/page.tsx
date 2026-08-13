"use client"

import React, { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import NextImage from "next/image"
import { toast } from "sonner"
import {
  Upload,
  Copy,
  Trash2,
  Edit2,
  Check,
  Calendar,
  FileImage,
  Loader2,
  Search
} from "lucide-react"

import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import EmptyState from "@/components/ui/EmptyState"
import LoadingSkeleton from "@/components/ui/LoadingSkeleton"

export default function MediaLibraryPage() {
  const [mediaList, setMediaList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Editing alt text state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tempAlt, setTempAlt] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .order("uploaded_at", { ascending: false })

      if (error) {
        toast.error(error.message)
      } else {
        setMediaList(data || [])
      }
    } catch (err) {
      toast.error("Failed to load media.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0])
    }
  }

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported.")
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("alt_text", file.name.substring(0, file.name.lastIndexOf(".")))

    try {
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Upload failed")
      }

      toast.success(`${file.name} uploaded and converted successfully!`)
      fetchMedia()
    } catch (err: any) {
      toast.error(err.message || "An error occurred during upload.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success("URL copied to clipboard!")
  }

  const handleStartEditAlt = (id: string, currentAlt: string) => {
    setEditingId(id)
    setTempAlt(currentAlt || "")
  }

  const handleSaveAlt = async (id: string) => {
    try {
      const { error } = await supabase
        .from("media")
        .update({ alt_text: tempAlt })
        .eq("id", id)

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success("Alt text updated!")
      setMediaList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, alt_text: tempAlt } : item))
      )
      setEditingId(null)
    } catch (err) {
      toast.error("Failed to update alt text.")
    }
  }

  const handleDeleteMedia = async (id: string, url: string) => {
    if (!confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
      return
    }

    try {
      // 1. Delete from storage bucket
      const storageFilename = url.substring(url.lastIndexOf("/") + 1)
      const { error: storageError } = await supabase.storage
        .from("media")
        .remove([storageFilename])

      if (storageError) {
        console.warn("Storage delete warning:", storageError.message)
      }

      // 2. Delete database record
      const { error: dbError } = await supabase
        .from("media")
        .delete()
        .eq("id", id)

      if (dbError) {
        toast.error(dbError.message)
        return
      }

      toast.success("Image deleted successfully.")
      setMediaList((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      toast.error("Failed to delete image.")
    }
  }

  const filteredMedia = mediaList.filter((item) =>
    (item.filename || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.alt_text || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(245,240,250,0.14)] pb-6">
        <div>
          <h1 className="text-3xl font-normal text-white tracking-widest sm:text-4xl font-anton uppercase">
            Media Library
          </h1>
          <p className="mt-2 text-xs text-[#9C8FAE]">
            Upload, optimize, and organize assets. Images are automatically converted to high-performance WebP formats under 150KB.
          </p>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? "border-[#FF2E88] bg-[#FF2E88]/5"
            : "border-[rgba(245,240,250,0.14)] bg-[#150C1F] hover:border-[#FF2E88]/40"
        } relative overflow-hidden group`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <Loader2 className="animate-spin text-[#FF2E88] h-10 w-10" />
            <div>
              <p className="text-sm font-semibold text-white">Converting & Uploading Asset...</p>
              <p className="text-xs text-[#9C8FAE]/60 mt-1">Converting to optimized WebP format server-side via Sharp</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="p-4 bg-[rgba(245,240,250,0.06)] border border-[rgba(245,240,250,0.12)] rounded-full text-[#9C8FAE] group-hover:text-[#FF2E88] group-hover:bg-[#FF2E88]/10 transition duration-200">
              <Upload size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Drag & drop image here, or <span className="text-[#FF2E88]">browse files</span>
              </p>
              <p className="text-xs text-[#9C8FAE]/40 mt-1 font-bold">Supports PNG, JPG, JPEG, and WebP (max 5MB file size)</p>
            </div>
          </div>
        )}
      </div>

      {/* Search Filter Bar */}
      <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-4 rounded-xl flex items-center">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Search by filename or alt text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="card" />
        </div>
      ) : filteredMedia.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedia.map((item) => (
            <Card
              key={item.id}
              padding="none"
              variant="standard"
              className="overflow-hidden flex flex-col justify-between group shadow-lg"
            >
              {/* Image Preview */}
              <div className="aspect-video bg-[#0b0a0e] relative overflow-hidden flex items-center justify-center border-b border-[rgba(245,240,250,0.08)]">
                <NextImage
                  src={item.url}
                  alt={item.alt_text || "Uploaded image"}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-contain group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-2 right-2 bg-black/75 px-2 py-0.5 rounded text-[10px] font-bold text-[#00E5FF] tracking-wide uppercase z-10">
                  {item.size_kb} KB
                </span>
              </div>

              {/* Image Details */}
              <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white truncate" title={item.filename}>
                    {item.filename}
                  </p>
                  <p className="text-[11px] text-[#9C8FAE]/40 flex items-center">
                    <Calendar size={12} className="mr-1" />
                    {new Date(item.uploaded_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Alt text editor section */}
                <div className="bg-[#0B0710]/50 p-2.5 rounded border border-[rgba(245,240,250,0.06)] space-y-1.5">
                  <p className="text-[10px] font-bold text-[#9C8FAE]/40 uppercase tracking-wider">Alt Text</p>
                  {editingId === item.id ? (
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="text"
                        value={tempAlt}
                        onChange={(e) => setTempAlt(e.target.value)}
                        className="flex-1 min-w-0 bg-[#150C1F] border border-[rgba(245,240,250,0.14)] px-2 py-1 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
                      />
                      <button
                        onClick={() => handleSaveAlt(item.id)}
                        className="p-1 bg-[#00E5FF]/15 text-[#00E5FF] hover:bg-[#00E5FF]/20 rounded transition"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between space-x-2">
                      <p className="text-xs text-paper-dim/80 truncate italic">
                        {item.alt_text || "No alt text set"}
                      </p>
                      <button
                        onClick={() => handleStartEditAlt(item.id, item.alt_text)}
                        className="text-[#9C8FAE]/40 hover:text-white transition p-0.5"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Grid card actions footer */}
                <div className="flex items-center space-x-2 pt-2 border-t border-[rgba(245,240,250,0.08)]">
                  <Button
                    onClick={() => handleCopyUrl(item.url)}
                    variant="ghost"
                    size="sm"
                    className="flex-grow text-[10px]"
                  >
                    Copy URL
                  </Button>
                  <Button
                    onClick={() => handleDeleteMedia(item.id, item.url)}
                    variant="destructive"
                    size="sm"
                    className="!px-2.5"
                    title="Delete asset"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FileImage size={40} className="mx-auto text-[#9C8FAE]/30" />}
          title="No Media Assets Found"
          description="Drag & drop or select an image file to upload your first asset."
        />
      )}
    </div>
  )
}
