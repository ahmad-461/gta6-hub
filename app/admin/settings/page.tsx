"use client"

import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
  Settings,
  Save,
  Twitter,
  Youtube,
  MessageSquare,
  FileText,
  Loader2,
  Image as ImageIcon,
  AlertTriangle,
  X
} from "lucide-react"

export default function SiteSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Settings state
  const [siteName, setSiteName] = useState("")
  const [tagline, setTagline] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [footerText, setFooterText] = useState("")
  const [adsenseId, setAdsenseId] = useState("")
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  // Social Links
  const [twitter, setTwitter] = useState("")
  const [discord, setDiscord] = useState("")
  const [youtube, setYoutube] = useState("")

  // Logo picker modal
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [mediaList, setMediaList] = useState<any[]>([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("site_settings").select("*")
      if (error) throw error

      if (data) {
        data.forEach((setting) => {
          const val = setting.value
          switch (setting.key) {
            case "site_name":
              setSiteName(val)
              break
            case "tagline":
              setTagline(val)
              break
            case "logo_url":
              setLogoUrl(val)
              break
            case "footer_text":
              setFooterText(val)
              break
            case "adsense_publisher_id":
              setAdsenseId(val)
              break
            case "maintenance_mode":
              setMaintenanceMode(val === "true")
              break
            case "social_links":
              try {
                const social = JSON.parse(val)
                setTwitter(social.twitter || "")
                setDiscord(social.discord || "")
                setYoutube(social.youtube || "")
              } catch (e) {
                console.error("Failed to parse social links JSON:", e)
              }
              break
            default:
              break
          }
        })
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load site settings.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMedia = async () => {
    setIsLoadingMedia(true)
    try {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .order("uploaded_at", { ascending: false })

      if (!error) setMediaList(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingMedia(false)
    }
  }

  const handleSelectLogo = (url: string) => {
    setLogoUrl(url)
    setIsMediaModalOpen(false)
    toast.success("Site logo selected!")
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const socialLinksJson = JSON.stringify({
      twitter,
      discord,
      youtube,
    })

    const settingsToSave = [
      { key: "site_name", value: siteName },
      { key: "tagline", value: tagline },
      { key: "logo_url", value: logoUrl },
      { key: "footer_text", value: footerText },
      { key: "adsense_publisher_id", value: adsenseId },
      { key: "maintenance_mode", value: maintenanceMode ? "true" : "false" },
      { key: "social_links", value: socialLinksJson },
    ]

    try {
      // Key-value store upsert
      const upserts = settingsToSave.map((setting) =>
        supabase.from("site_settings").upsert({
          key: setting.key,
          value: setting.value,
          updated_at: new Date().toISOString(),
        })
      )

      const results = await Promise.all(upserts)
      const failed = results.find((res) => res.error)

      if (failed) {
        throw new Error(failed.error?.message || "One or more settings failed to save.")
      }

      toast.success("Site configuration saved successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-neon-blue h-8 w-8" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSaveSettings} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Site Settings
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            Configure site-wide parameters, logos, SEO metadata, ad placements, and maintenance flags.
          </p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-neon-blue hover:bg-neon-blue/90 text-black font-bold text-sm rounded-lg transition duration-150 uppercase tracking-wider"
        >
          {isSaving ? (
            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" />
          ) : (
            <Save size={18} className="mr-2" />
          )}
          Save Settings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main fields column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identity Info */}
          <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-4">
            <h2 className="text-base font-bold text-white border-b border-card-border pb-3">Identity & Branding</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Site Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GTA 6 Hub..."
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Site Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Walkthroughs, collectibles search, & news..."
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Footer Copyright Text</label>
              <input
                type="text"
                placeholder="e.g. © 2024 GTA 6 Hub. All rights reserved."
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-4">
            <h2 className="text-base font-bold text-white border-b border-card-border pb-3">Social Media Links</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center">
                  <Twitter size={14} className="mr-1.5 text-blue-400" /> Twitter (X) Profile URL
                </label>
                <input
                  type="url"
                  placeholder="https://twitter.com/gta6hub"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center">
                  <MessageSquare size={14} className="mr-1.5 text-indigo-400" /> Discord Guild Invite
                </label>
                <input
                  type="url"
                  placeholder="https://discord.gg/gta6hub"
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center">
                  <Youtube size={14} className="mr-1.5 text-red-500" /> YouTube Channel URL
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/@gta6hub"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar settings column */}
        <div className="space-y-6">
          {/* Logo Identity */}
          <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-4">
            <h2 className="text-base font-bold text-white border-b border-card-border pb-3">Site Logo</h2>

            {logoUrl ? (
              <div className="space-y-3">
                <div className="bg-[#100e16] p-4 rounded-lg border border-card-border flex items-center justify-center relative group">
                  <img src={logoUrl} alt="Logo Preview" className="max-h-16 object-contain" />
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-neon-pink font-bold text-xs"
                  >
                    Remove Logo
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsMediaModalOpen(true)
                  fetchMedia()
                }}
                className="w-full py-10 border-2 border-dashed border-card-border rounded-lg flex flex-col items-center justify-center text-foreground/50 hover:border-foreground/20 hover:text-white transition group bg-[#100e16]/40"
              >
                <ImageIcon size={24} className="mb-2 text-foreground/30 group-hover:text-neon-pink transition" />
                <span className="text-xs font-semibold">Select Site Logo</span>
              </button>
            )}
          </div>

          {/* AdSense Settings */}
          <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-4">
            <h2 className="text-base font-bold text-white border-b border-card-border pb-3 flex items-center">
              Google AdSense
            </h2>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Publisher ID</label>
              <input
                type="text"
                placeholder="pub-XXXXXXXXXXXXXXXX"
                value={adsenseId}
                onChange={(e) => setAdsenseId(e.target.value)}
                className="w-full px-3 py-2 bg-[#100e16] border border-card-border rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue font-mono"
              />
              <p className="text-[10px] text-foreground/40 mt-1 font-mono">
                Just store the AdSense property value in settings for now.
              </p>
            </div>
          </div>

          {/* Maintenance Mode Toggle */}
          <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-card-border pb-3">
              <h2 className="text-base font-bold text-white">Maintenance Mode</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                maintenanceMode ? "bg-neon-pink/15 text-neon-pink" : "bg-neon-blue/15 text-neon-blue"
              }`}>
                {maintenanceMode ? "ACTIVE" : "OFF"}
              </span>
            </div>

            <div className="flex items-start space-x-3 text-xs bg-[#100e16] p-3.5 rounded border border-card-border/60">
              <AlertTriangle className="text-neon-pink flex-shrink-0 mt-0.5" size={16} />
              <p className="text-foreground/50 leading-normal">
                Enabling maintenance mode redirects public users to a splash screen, allowing only administrators to access the site and dashboard.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  maintenanceMode ? "bg-neon-pink" : "bg-card-border"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    maintenanceMode ? "translate-x-6" : "translate-x-0"
                  }`}
                ></div>
              </button>
              <span className="text-xs font-semibold text-foreground/80 cursor-pointer select-none" onClick={() => setMaintenanceMode(!maintenanceMode)}>
                Activate site-wide lock
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Logo Image Picker Modal */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-card-bg border border-card-border rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col justify-between shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-card-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Select Site Logo Asset</h3>
              <button
                type="button"
                onClick={() => setIsMediaModalOpen(false)}
                className="text-foreground/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-[#110f17]/50">
              {isLoadingMedia ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="animate-spin text-neon-blue h-8 w-8" />
                </div>
              ) : mediaList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {mediaList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectLogo(item.url)}
                      className="group border border-card-border hover:border-neon-blue bg-card-bg rounded-lg overflow-hidden cursor-pointer transition-all duration-150"
                    >
                      <div className="aspect-video bg-black flex items-center justify-center relative border-b border-card-border">
                        <img
                          src={item.url}
                          alt={item.alt_text}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-white font-semibold truncate" title={item.filename}>
                          {item.filename}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-card-border rounded-lg">
                  <p className="text-sm text-foreground/40">No media found. Upload media in the Media Library first!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
