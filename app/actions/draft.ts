"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

interface GenerateDraftParams {
  notes: string
  contentType: "article" | "guide"
  categoryName?: string
}

export async function generateAIDraftAction({ notes, contentType, categoryName }: GenerateDraftParams) {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      throw new Error("Gemini API key is not configured on the server.")
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const systemPrompt = `You are an expert content creator and senior editor for GTA 6 Hub, a premium fan-portal for Grand Theft Auto VI.
Your task is to write a high-quality, engaging draft based on the user's raw notes, leak text, trailer description, or bullet points.

Style Guidelines:
1. **Tone/Voice**: Knowledgeable-friend voice. Excited, conversational, immersive, yet authoritative. Talk directly to the reader ("you").
2. **Structure**: Organize the content logically with clear, descriptive sections. Use proper HTML H2 headings (i.e. <h2>Section Title</h2>) for the main sections. DO NOT use H1 (reserved for page title).
3. **Format**: Output STRICTLY in standard HTML suitable for a rich-text Tiptap editor. Only use standard tags: <h2>, <p>, <strong>, <em>, <ul>, <li>, <br>. Do not wrap the output in markdown block codes or \`\`\`html.
4. **Internal Link Suggestions**: Suggest placehoders for internal links to characters, guides, or cheats where relevant, formatted like: <a>[Internal Link: link target]</a>.
5. **Quality**: Ensure the content is descriptive, deep, and reads like a professional publication rather than simple notes.

Target Content Type: ${contentType === "article" ? "News Article Update" : "Walkthrough Strategy Guide"}
Target Category: ${categoryName || "General / Getting Started"}

Raw Input Notes:
"${notes}"`

    const result = await model.generateContent(systemPrompt)
    let htmlContent = result.response.text()

    // Clean up any accidental markdown code block wrap (e.g., ```html ... ```)
    if (htmlContent.startsWith("```html")) {
      htmlContent = htmlContent.slice(7)
    } else if (htmlContent.startsWith("```")) {
      htmlContent = htmlContent.slice(3)
    }
    if (htmlContent.endsWith("```")) {
      htmlContent = htmlContent.slice(0, -3)
    }
    htmlContent = htmlContent.trim()

    return {
      success: true,
      html: htmlContent
    }
  } catch (err: any) {
    console.error("AI Draft generation failed:", err)
    return {
      success: false,
      error: err.message || "Failed to generate AI draft."
    }
  }
}
