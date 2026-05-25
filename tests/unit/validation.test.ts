import { describe, it, expect } from "vitest"
import { z } from "zod"

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().max(500).optional(),
  default_model_id: z.string().default("gpt-4o"),
})

const featureSchema = z.object({
  name: z.string().min(1, "Feature name is required").max(100),
  description: z.string().max(500).optional(),
  workflow_key: z.string().default("manual_test_design"),
  selected_model_id: z.string().default("gpt-4o"),
})

describe("Zod Schema Validation", () => {
  describe("Project Schema", () => {
    it("should pass with valid values", () => {
      const data = {
        name: "Test Project",
        description: "A valid description of the test project.",
        default_model_id: "claude-3-5-sonnet",
      }
      const result = projectSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it("should fail when name is empty", () => {
      const data = {
        name: "",
        description: "Description",
      }
      const result = projectSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Project name is required")
      }
    })
  })

  describe("Feature Schema", () => {
    it("should pass with valid values", () => {
      const data = {
        name: "Login UI",
        description: "Test login flow screen.",
        workflow_key: "manual_test_design",
      }
      const result = featureSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it("should fail when name is empty", () => {
      const data = {
        name: "",
      }
      const result = featureSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Feature name is required")
      }
    })
  })
})
