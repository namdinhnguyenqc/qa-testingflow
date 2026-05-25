import { NextRequest, NextResponse } from "next/server"
import { InputService } from "@/application/inputs/input-service"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const projectId = formData.get("projectId") as string
    const featureId = formData.get("featureId") as string
    const file = formData.get("file") as File | null

    if (!projectId || !featureId || !file) {
      return NextResponse.json(
        { error: "Missing projectId, featureId or file" },
        { status: 400 }
      )
    }

    // Bảo mật: Validate kích thước file trước khi nạp vào RAM (RAM Exhaustion Guard)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit (Max: 10MB)" },
        { status: 400 }
      )
    }

    const inputService = new InputService()
    
    // Đọc file thành Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const inputSource = await inputService.uploadInputFile(
      projectId,
      featureId,
      file.name,
      buffer,
      file.type,
      file.size
    )

    return NextResponse.json({ data: inputSource })
  } catch (error: any) {
    console.error("❌ Upload API error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    )
  }
}
