import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase"
import { TestCaseService } from "@/application/testcases/testcase-service"
import { ExcelExportService } from "@/application/exports/excel-export-service"

export async function GET(
  req: NextRequest,
  { params }: { params: { artifactId: string } }
) {
  try {
    const { artifactId } = params

    const testCaseService = new TestCaseService()
    const excelExportService = new ExcelExportService()

    // 1. Fetch artifact details
    const { data: artifacts, error: artError } = await supabaseServer
      .from("artifacts")
      .select("*, features(name, projects(name))")
      .eq("id", artifactId)
      .single()

    if (artError || !artifacts) {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 })
    }

    const featureName = artifacts.features?.name || "Feature"
    const projectName = artifacts.features?.projects?.name || "Project"

    // 2. Fetch all test cases of this artifact
    const testCases = await testCaseService.getTestCases(artifactId)
    if (testCases.length === 0) {
      return NextResponse.json({ error: "No test cases found to export" }, { status: 400 })
    }

    // 3. Export to Excel buffer
    const buffer = await excelExportService.exportTestCasesToBuffer(
      projectName,
      featureName,
      testCases
    )

    const safeFilename = `${featureName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_testcases.xlsx`

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Content-Length": buffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error("❌ Export API error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to export test cases" },
      { status: 500 }
    )
  }
}
