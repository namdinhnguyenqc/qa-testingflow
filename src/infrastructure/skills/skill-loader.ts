import fs from "fs"
import path from "path"

export class SkillLoader {
  private qaCorePath: string

  constructor() {
    this.qaCorePath = path.resolve(process.cwd(), "qa-core")
  }

  /**
   * Đọc workflow Markdown từ filesystem
   */
  async loadWorkflow(workflowKey: string): Promise<string> {
    const filePath = path.join(this.qaCorePath, "workflows", `${workflowKey.replace(/_/g, "-")}.workflow.md`)
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Workflow file not found at ${filePath}`)
      }
      return fs.readFileSync(filePath, "utf-8")
    } catch (error: any) {
      throw new Error(`Failed to load workflow ${workflowKey}: ${error.message}`)
    }
  }

  /**
   * Đọc skill Markdown từ filesystem
   */
  async loadSkill(skillPath: string): Promise<string> {
    const filePath = path.join(this.qaCorePath, "skills", skillPath)
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Skill file not found at ${filePath}`)
      }
      return fs.readFileSync(filePath, "utf-8")
    } catch (error: any) {
      throw new Error(`Failed to load skill ${skillPath}: ${error.message}`)
    }
  }

  /**
   * Đọc JSON Schema từ filesystem
   */
  async loadSchema(schemaKey: string): Promise<Record<string, any>> {
    const filePath = path.join(this.qaCorePath, "schemas", `${schemaKey.replace(/_/g, "-")}.schema.json`)
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Schema file not found at ${filePath}`)
      }
      const raw = fs.readFileSync(filePath, "utf-8")
      return JSON.parse(raw)
    } catch (error: any) {
      throw new Error(`Failed to load schema ${schemaKey}: ${error.message}`)
    }
  }
}
