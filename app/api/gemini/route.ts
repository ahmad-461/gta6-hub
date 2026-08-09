import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: Request) {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Internal Server Error: Gemini API key is missing on host environment." },
        { status: 500 }
      )
    }

    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Bad Request: Please provide a valid prompt string in the request body." },
        { status: 400 }
      )
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    return NextResponse.json({
      success: true,
      result: text,
    })
  } catch (error: any) {
    console.error("Gemini API server-only execution failure:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred during generative model inference." },
      { status: 500 }
    )
  }
}
