import { describe, it, expect } from "vitest"
import { JsonValidator } from "@/infrastructure/validation/json-validator"

describe("AJV JSON Schema Validator", () => {
  const validator = new JsonValidator()

  const dummySchema = {
    type: "object",
    properties: {
      name: { type: "string" },
      age: { type: "integer", minimum: 18 },
      skills: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["name", "age"]
  }

  it("should pass validation with valid data", () => {
    const validData = {
      name: "Senior QA",
      age: 30,
      skills: ["Manual Testing", "AI Prompting"]
    }
    const result = validator.validateSchema(dummySchema, validData)
    expect(result.isValid).toBe(true)
    expect(result.errors).toBeUndefined()
  })

  it("should catch errors when required fields are missing", () => {
    const invalidData = {
      age: 25
    }
    const result = validator.validateSchema(dummySchema, invalidData)
    expect(result.isValid).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors?.[0]).toContain("must have required property 'name'")
  })

  it("should catch errors on type mismatch or constraint validation", () => {
    const invalidData = {
      name: "Junior QA",
      age: 15 // age must be >= 18
    }
    const result = validator.validateSchema(dummySchema, invalidData)
    expect(result.isValid).toBe(false)
    expect(result.errors?.[0]).toContain("must be >= 18")
  })
})
