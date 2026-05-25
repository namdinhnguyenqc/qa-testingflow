import { describe, it, expect } from "vitest"
import { determineFeatureStatus, isValidTransition } from "@/domain/features/state-machine"
import { InputSource } from "@/domain/inputs/types"

describe("Feature State Machine Rules", () => {
  it("should stay DRAFT when there are no sources", () => {
    const status = determineFeatureStatus("DRAFT", [])
    expect(status).toBe("DRAFT")
  })

  it("should change to INPUT_READY when a valid pasted requirement is added", () => {
    const sources: InputSource[] = [
      {
        id: "1",
        feature_id: "f1",
        source_type: "requirement_text",
        text_content: "This is a detailed requirement specification for user login.",
        status: "TEXT_AVAILABLE",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
    const status = determineFeatureStatus("DRAFT", sources)
    expect(status).toBe("INPUT_READY")
  })

  it("should stay DRAFT if pasted requirement text is too short", () => {
    const sources: InputSource[] = [
      {
        id: "1",
        feature_id: "f1",
        source_type: "requirement_text",
        text_content: "short", // < 10 chars
        status: "TEXT_AVAILABLE",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
    const status = determineFeatureStatus("DRAFT", sources)
    expect(status).toBe("DRAFT")
  })

  it("should transition to INPUT_READY if a requirement file is uploaded and parsed successfully", () => {
    const sources: InputSource[] = [
      {
        id: "2",
        feature_id: "f1",
        source_type: "requirement_file",
        original_file_name: "prd.txt",
        status: "TEXT_AVAILABLE",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
    const status = determineFeatureStatus("DRAFT", sources)
    expect(status).toBe("INPUT_READY")
  })

  it("should stay DRAFT if only image or URL reference exists without requirement content", () => {
    const sources: InputSource[] = [
      {
        id: "3",
        feature_id: "f1",
        source_type: "figma_image",
        status: "UPLOADED",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
    const status = determineFeatureStatus("DRAFT", sources)
    expect(status).toBe("DRAFT")
  })
})

describe("Allowed Feature State Transitions", () => {
  it("should allow DRAFT -> INPUT_READY transition", () => {
    expect(isValidTransition("DRAFT", "INPUT_READY")).toBe(true)
  })

  it("should allow INPUT_READY -> ANALYZING transition", () => {
    expect(isValidTransition("INPUT_READY", "ANALYZING")).toBe(true)
  })

  it("should NOT allow DRAFT -> COMPLETED transition directly", () => {
    expect(isValidTransition("DRAFT", "COMPLETED")).toBe(false)
  })

  it("should allow any state to transition to FAILED", () => {
    expect(isValidTransition("ANALYZING", "FAILED")).toBe(true)
    expect(isValidTransition("TESTCASE_GENERATING", "FAILED")).toBe(true)
  })
})
