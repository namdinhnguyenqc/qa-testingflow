import { describe, expect, it } from "vitest"
import { SkillLoader } from "@/infrastructure/skills/skill-loader"

describe("SkillLoader", () => {
  const loader = new SkillLoader()

  it("loads the manual test design workflow", async () => {
    const workflow = await loader.loadWorkflow("manual_test_design")

    expect(workflow).toContain("Manual Test Design")
  })

  it("loads a valid skill markdown file", async () => {
    const skill = await loader.loadSkill("common/requirement-reader.skill.md")

    expect(skill).toContain("Requirement Reader")
  })

  it("loads a valid JSON schema", async () => {
    const schema = await loader.loadSchema("manual_testcase")

    expect(schema.title).toBe("ManualTestcases")
    expect(schema.type).toBe("object")
  })

  it("loads the UI exploration schema", async () => {
    const schema = await loader.loadSchema("ui_exploration")

    expect(schema.title).toBe("UiExplorationSnapshot")
    expect(schema.required).toContain("screens")
  })

  it("fails clearly when a workflow is missing", async () => {
    await expect(loader.loadWorkflow("missing_workflow")).rejects.toThrow(
      "Failed to load workflow missing_workflow"
    )
  })

  it("fails clearly when a skill is missing", async () => {
    await expect(loader.loadSkill("missing/missing.skill.md")).rejects.toThrow(
      "Failed to load skill missing/missing.skill.md"
    )
  })

  it("fails clearly when a schema is missing", async () => {
    await expect(loader.loadSchema("missing_schema")).rejects.toThrow(
      "Failed to load schema missing_schema"
    )
  })
})
