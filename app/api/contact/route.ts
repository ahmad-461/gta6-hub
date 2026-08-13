import { NextResponse } from "next/server"
import { Resend } from "resend"

// Simple in-memory rate limiter (expires after a short window)
const rateLimitMap = new Map<string, number>()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, subject, message, website } = body

    // 1. Honeypot check
    // "website" is invisible to humans but populated by standard bot engines
    if (website && website.trim() !== "") {
      console.warn("[SECURITY] Honeypot triggered. Silent discard of spam bot submission.")
      return NextResponse.json({
        success: true,
        message: "Message processed successfully (honeypot caught)."
      })
    }

    // 2. Server-side validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Invalid name format. Minimum 2 characters are required." },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email format." },
        { status: 400 }
      )
    }

    if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Subject must be at least 3 characters." },
        { status: 400 }
      )
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Message content must be at least 10 characters." },
        { status: 400 }
      )
    }

    // 3. Rate limiting (cooldown of 30 seconds per IP to protect Resend free-tier quotas)
    const ip = request.headers.get("x-forwarded-for") || "unknown-ip"
    const now = Date.now()
    const lastRequestTime = rateLimitMap.get(ip)

    if (lastRequestTime && now - lastRequestTime < 30000) {
      const secondsLeft = Math.ceil((30000 - (now - lastRequestTime)) / 1000)
      return NextResponse.json(
        { success: false, error: `Throttling active. Please wait ${secondsLeft}s before sending another inquiry.` },
        { status: 429 }
      )
    }

    // Save timestamp
    rateLimitMap.set(ip, now)

    // 4. Dispatch Email via Resend
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn("RESEND_API_KEY is not defined. Falling back to local developer sandbox logging.")
      console.log(`[MOCK EMAIL DISPATCH] to ahmad.khan8747763@gmail.com
        From: onboarding@resend.dev
        Reply-To: ${email}
        Name: ${name}
        Subject: ${subject}
        Message: ${message}
      `)
      return NextResponse.json({
        success: true,
        message: "Developer Mock Mode: Message processed. (Resend API key missing)",
        is_mock: true
      })
    }

    const resend = new Resend(apiKey)

    const emailHtmlBody = `
      <div style="font-family: sans-serif; background-color: #fafafa; padding: 20px; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border: 1px solid #e1e1e1; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <div style="background-color: #16161B; color: #F5F5F7; padding: 25px; border-bottom: 3px solid #FF2D8D;">
            <h1 style="margin: 0; font-size: 20px; letter-spacing: 1px;">GTA 6 HUB — CONTACT INCOMING</h1>
          </div>
          <div style="padding: 25px; line-height: 1.6;">
            <p style="margin-top: 0;">You have received a new inquiry from the contact terminal:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 100px; border-bottom: 1px solid #eee;">Name:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #eee;">Email:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="mailto:${email}" style="color: #FF2D8D; text-decoration: none;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #eee;">Subject:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${subject}</td>
              </tr>
            </table>
            <p style="font-weight: bold; margin-bottom: 5px;">Message Details:</p>
            <div style="background-color: #F5F5F7; border-left: 4px solid #FF8A3D; padding: 15px; border-radius: 4px; font-style: italic; white-space: pre-wrap; font-size: 14px;">${message}</div>
          </div>
          <div style="background-color: #eee; text-align: center; padding: 15px; font-size: 11px; color: #888;">
            Sent automatically via GTA 6 Hub System Platform.
          </div>
        </div>
      </div>
    `

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "ahmad.khan8747763@gmail.com",
      replyTo: email,
      subject: `[GTA6 HUB CONTACT] ${subject}`,
      html: emailHtmlBody,
    })

    if (error) {
      console.error("[RESEND] API returned delivery error:", error)
      return NextResponse.json(
        { success: false, error: "Email delivery system failed.", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Message delivered successfully."
    })

  } catch (err: any) {
    console.error("[API] Contact endpoint internal crash:", err)
    return NextResponse.json(
      { success: false, error: "An internal server error occurred while sending your message." },
      { status: 500 }
    )
  }
}
