import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server"
import sharp from "sharp"

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Authentication
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Read file from request
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const altText = formData.get("alt_text") as string || ""

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 3. Convert to WebP using sharp
    let webpBuffer: Buffer
    try {
      // Convert to WebP with good default quality
      webpBuffer = await sharp(buffer)
        .webp({ quality: 80 })
        .toBuffer()

      // If larger than 150KB, optimize further
      if (webpBuffer.length > 150 * 1024) {
        webpBuffer = await sharp(buffer)
          .resize({ width: 1200, withoutEnlargement: true })
          .webp({ quality: 65 })
          .toBuffer()
      }
    } catch (sharpErr) {
      console.error("Sharp conversion error:", sharpErr)
      return NextResponse.json({ error: "Failed to process image" }, { status: 500 })
    }

    // 4. Generate clean unique filename
    const originalName = file.name
    const baseName = originalName.substring(0, originalName.lastIndexOf(".")).replace(/[^a-zA-Z0-9-_]/g, "_")
    const newFilename = `${baseName}-${Date.now()}.webp`

    // 5. Initialize Supabase Admin Client to ensure bucket exists
    const supabaseAdmin = createSupabaseAdminClient()

    // Auto-create bucket if missing
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets()
      const mediaBucketExists = buckets?.some((b: any) => b.id === "media")

      if (!mediaBucketExists) {
        await supabaseAdmin.storage.createBucket("media", {
          public: true,
          allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
        })
      }
    } catch (bucketErr) {
      console.warn("Could not check/create bucket via admin client, falling back.", bucketErr)
    }

    // 6. Upload WebP Buffer to Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("media")
      .upload(newFilename, webpBuffer, {
        contentType: "image/webp",
        cacheControl: "3600",
        upsert: true,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // 7. Get Public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("media")
      .getPublicUrl(newFilename)

    // Get dimensions of the WebP image
    let dimensions = { width: 0, height: 0 }
    try {
      const metadata = await sharp(webpBuffer).metadata()
      dimensions.width = metadata.width || 0
      dimensions.height = metadata.height || 0
    } catch (metadataErr) {
      console.warn("Could not retrieve image metadata.", metadataErr)
    }

    const sizeKb = Math.round(webpBuffer.length / 1024)

    // 8. Insert record into database table
    const { data: mediaRecord, error: dbError } = await supabase
      .from("media")
      .insert({
        filename: originalName,
        url: publicUrl,
        webp_url: publicUrl,
        alt_text: altText || originalName.substring(0, originalName.lastIndexOf(".")),
        size_kb: sizeKb,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database insert error:", dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      media: {
        id: mediaRecord.id,
        filename: mediaRecord.filename,
        url: mediaRecord.url,
        size_kb: mediaRecord.size_kb,
        alt_text: mediaRecord.alt_text,
        dimensions: `${dimensions.width}x${dimensions.height}`,
      }
    })
  } catch (err: any) {
    console.error("Upload API top-level error:", err)
    return NextResponse.json({ error: err.message || "An unexpected error occurred" }, { status: 500 })
  }
}
