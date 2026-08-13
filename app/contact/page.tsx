"use client"

import React, { useState, useEffect } from "react"
import { Mail, ArrowRight, Github, Linkedin, Clock, Send, ShieldCheck, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function ContactPage() {
  // Form input state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Feedback",
    message: "",
    website: "", // Honeypot spam prevention
  })

  // Status and UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0)

  // Cooldown rate-limit effect (client-side persistence via localStorage)
  useEffect(() => {
    const lastSent = localStorage.getItem("last_contact_timestamp")
    if (lastSent) {
      const elapsed = Date.now() - parseInt(lastSent, 10)
      if (elapsed < 30000) {
        setCooldownTimeLeft(Math.ceil((30000 - elapsed) / 1000))
      }
    }
  }, [])

  useEffect(() => {
    if (cooldownTimeLeft <= 0) return
    const interval = setInterval(() => {
      setCooldownTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [cooldownTimeLeft])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      toast.error("Please enter a valid name (minimum 2 characters).")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      toast.error("Please enter a valid email address.")
      return false
    }

    if (!formData.subject.trim()) {
      toast.error("Please select a subject.")
      return false
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      toast.error("Please enter a message (minimum 10 characters).")
      return false
    }

    return true
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (cooldownTimeLeft > 0) {
      toast.error(`Please wait ${cooldownTimeLeft}s before sending another inquiry.`)
      return
    }

    if (!validateForm()) return

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSubmissionStatus("success")
        toast.success("Message sent successfully!")
        localStorage.setItem("last_contact_timestamp", Date.now().toString())
        setCooldownTimeLeft(30)
        // Reset form data except honeypot
        setFormData({
          name: "",
          email: "",
          subject: "General Feedback",
          message: "",
          website: "",
        })
      } else {
        setSubmissionStatus("error")
        setErrorMessage(data.error || "Failed to deliver email message.")
        toast.error(data.error || "Message delivery failed.")
      }
    } catch (err) {
      console.error("Form transmission crash:", err)
      setSubmissionStatus("error")
      setErrorMessage("Network error occurred. The delivery server is currently offline.")
      toast.error("Network error. Unable to deliver message.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const subjectOptions = [
    "General Feedback",
    "Bug Report / Site Correction",
    "Intel Leak Submission",
    "Business / Advertising Inquiry",
    "Developer Cooperation",
  ]

  return (
    <div className="flex-grow flex flex-col relative bg-ink overflow-hidden text-paper">
      {/* Cinematic Global Noise Texture */}
      <div className="film-grain opacity-5 pointer-events-none" />

      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Glow Blob 1 (magenta top-right) */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-magenta/5 blur-[120px] z-0" />
        {/* Glow Blob 2 (orange bottom-left) */}
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange/5 blur-[120px] z-0" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 space-y-12">
        {/* Title row */}
        <div className="border-b border-[rgba(245,240,250,0.14)] pb-6">
          <div className="flex items-center space-x-2.5 mb-1.5 font-mono text-xs text-magenta tracking-widest uppercase font-bold">
            <Send className="w-4 h-4 text-magenta animate-pulse" />
            <span>COMMUNICATION PATHWAY</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-anton uppercase tracking-tight text-paper">
            Contact Terminal
          </h1>
          <p className="text-xs sm:text-sm text-paper-dim">
            Secure upstream dispatch directly to the platform editorial core.
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">

          {/* Left Column: Form (7 cols) */}
          <div className="lg:col-span-7 bg-ink-2 border border-[rgba(245,240,250,0.14)] rounded p-8 shadow-xl relative">

            {/* Design retention brackets */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-orange/40" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-orange/40" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-orange/40" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-orange/40" />

            {submissionStatus === "success" ? (
              // Success State Card
              <div className="text-center py-12 space-y-6">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange/10 border border-orange/30">
                  <ShieldCheck className="w-8 h-8 text-orange animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-anton uppercase text-paper">
                    DISPATCH CONFIRMED
                  </h3>
                  <p className="text-sm text-paper-dim max-w-md mx-auto leading-relaxed">
                    Telemetry successfully sent to <strong>ahmad.khan8747763@gmail.com</strong>. Our operations center will review the payload and react within the next 24 hours.
                  </p>
                </div>
                <div className="pt-4 flex justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setSubmissionStatus("idle")}
                    className="px-6 py-2.5 border border-magenta hover:bg-magenta/10 text-white font-bold uppercase tracking-wider text-xs rounded transition-all duration-300 font-mono"
                  >
                    Send Another Payload
                  </button>
                  <a
                    href="/news"
                    className="px-6 py-2.5 bg-magenta hover:bg-magenta/90 text-white font-bold uppercase tracking-wider text-xs rounded transition-all duration-300 font-mono shadow-[0_4px_15px_rgba(255,46,136,0.3)]"
                  >
                    Return to News
                  </a>
                </div>
              </div>
            ) : (
              // Normal Form Layout
              <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>
                {/* Honeypot Spam Prevention field — completely hidden for human users */}
                <div style={{ display: "none" }}>
                  <label htmlFor="website">Website Address</label>
                  <input
                    id="website"
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name field */}
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-xs font-bold font-mono text-paper-dim uppercase tracking-wider">
                      Visitor Name <span className="text-magenta">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-ink border border-[rgba(245,240,250,0.14)] rounded px-4 py-3 text-sm text-paper focus:ring-2 focus:ring-orange focus:border-orange focus:outline-none transition-all duration-200"
                      placeholder="e.g. Jason V."
                      required
                    />
                  </div>

                  {/* Email field */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-xs font-bold font-mono text-paper-dim uppercase tracking-wider">
                      Visitor Email <span className="text-magenta">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-ink border border-[rgba(245,240,250,0.14)] rounded px-4 py-3 text-sm text-paper focus:ring-2 focus:ring-orange focus:border-orange focus:outline-none transition-all duration-200"
                      placeholder="e.g. vice_racer@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Subject dropdown selection */}
                <div className="space-y-2">
                  <label htmlFor="subject" className="block text-xs font-bold font-mono text-paper-dim uppercase tracking-wider">
                    Inquiry Classification <span className="text-magenta">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full bg-ink border border-[rgba(245,240,250,0.14)] rounded px-4 py-3 text-sm text-paper focus:ring-2 focus:ring-orange focus:border-orange focus:outline-none transition-all duration-200 appearance-none font-mono"
                    >
                      {subjectOptions.map((opt) => (
                        <option key={opt} value={opt} className="bg-ink-2 text-paper">
                          {opt}
                        </option>
                      ))}
                    </select>
                    {/* Small custom indicator caret */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-paper-dim">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Message field */}
                <div className="space-y-2">
                  <label htmlFor="message" className="block text-xs font-bold font-mono text-paper-dim uppercase tracking-wider">
                    Message Payload <span className="text-magenta">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full bg-ink border border-[rgba(245,240,250,0.14)] rounded px-4 py-3 text-sm text-paper focus:ring-2 focus:ring-orange focus:border-orange focus:outline-none transition-all duration-200 resize-none leading-relaxed"
                    placeholder="Enter your inquiry data here (minimum 10 characters)..."
                    required
                  />
                </div>

                {/* Error Banner Fallback if transmission fails */}
                {submissionStatus === "error" && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold uppercase font-mono">Transmission Failure</p>
                      <p className="leading-relaxed">{errorMessage}</p>
                      <p className="pt-2 text-[10px] text-white">
                        Fallback Option: Please send your email manually to:{" "}
                        <a href="mailto:ahmad.khan8747763@gmail.com" className="underline font-bold text-orange">
                          ahmad.khan8747763@gmail.com
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                {/* Action button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {cooldownTimeLeft > 0 ? (
                    <div className="flex items-center space-x-2 text-xs font-mono text-amber-400">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Cooldown telemetry: wait {cooldownTimeLeft}s</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-paper-dim/50 uppercase tracking-wider">
                      * Required security data fields
                    </span>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || cooldownTimeLeft > 0}
                    className={`w-full sm:w-auto px-8 py-3.5 rounded font-mono text-xs uppercase tracking-wider font-bold text-white transition-all duration-300 ${
                      cooldownTimeLeft > 0
                        ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                        : isSubmitting
                        ? "bg-magenta/75 cursor-wait"
                        : "bg-magenta hover:bg-magenta/90 shadow-[0_4px_20px_rgba(255,46,136,0.3)] hover:shadow-[0_4px_30px_rgba(255,46,136,0.5)] active:scale-95 duration-100"
                    }`}
                  >
                    {isSubmitting ? "TRANSMITTING..." : "DISPATCH PAYLOAD"}
                  </button>
                </div>

              </form>
            )}

          </div>

          {/* Right Column: Information Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-8">

            {/* Vetted Response-Time Card */}
            <div className="bg-ink-2 border border-[rgba(245,240,250,0.14)] rounded p-8 space-y-6 shadow-xl relative">
              <div className="space-y-2 border-b border-[rgba(245,240,250,0.08)] pb-4">
                <span className="text-[10px] font-bold font-mono text-orange uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange" /> EXPECTED RESPONSE TELEMETRY
                </span>
                <h3 className="text-xl font-anton uppercase text-paper">
                  OPERATION UPTIME
                </h3>
              </div>

              <div className="space-y-4 text-sm text-paper-dim leading-relaxed">
                <p>
                  Our editorial staff and development core monitor incoming traffic streams 24 hours a day, 7 days a week.
                </p>
                <div className="p-4 bg-ink rounded border border-[rgba(245,240,250,0.06)] flex items-start space-x-3.5">
                  <Clock className="w-5 h-5 text-magenta shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs text-paper uppercase font-mono">LATENCY METRIC</p>
                    <p className="text-xs text-paper-dim/85">We typically react and reply to verified requests within <strong>12 to 24 hours</strong> of arrival.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social / Developer Links Card */}
            <div className="bg-ink-2 border border-[rgba(245,240,250,0.14)] rounded p-8 space-y-6 shadow-xl relative">
              <div className="space-y-2 border-b border-[rgba(245,240,250,0.08)] pb-4">
                <span className="text-[10px] font-bold font-mono text-magenta uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-magenta" /> DIRECT SYSTEM CONNECTIVITY
                </span>
                <h3 className="text-xl font-anton uppercase text-paper">
                  DEVELOPER DIRECTORY
                </h3>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-paper-dim">
                  Seeking to integrate custom map components, coordinate API heists, or report raw leaks? Access our code repositories directly:
                </p>

                {/* Developer social treatment */}
                <div className="pt-2 flex flex-col space-y-3.5 font-mono text-xs">
                  <a
                    href="https://github.com/ahmad-461"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex items-center space-x-2.5 text-paper-dim hover:text-white transition-colors py-1 group w-fit"
                  >
                    <Github className="w-4 h-4 text-orange" />
                    <span>GitHub / ahmad-461</span>
                    <span className="absolute bottom-0 left-0 h-[1.5px] bg-magenta w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  </a>

                  <a
                    href="https://www.linkedin.com/in/ahmad-khan-77441833a"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex items-center space-x-2.5 text-paper-dim hover:text-white transition-colors py-1 group w-fit"
                  >
                    <Linkedin className="w-4 h-4 text-orange" />
                    <span>LinkedIn / Ahmad Khan</span>
                    <span className="absolute bottom-0 left-0 h-[1.5px] bg-magenta w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
