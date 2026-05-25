import { SupabaseDbAdapter } from "@/infrastructure/database/supabase-db-adapter"
import { Project, CreateProjectDTO, UpdateProjectDTO } from "@/domain/projects/types"

export class ProjectService {
  private dbAdapter: SupabaseDbAdapter

  constructor() {
    this.dbAdapter = new SupabaseDbAdapter()
  }

  async getProjects(): Promise<Project[]> {
    return this.dbAdapter.getProjects()
  }

  async getProjectById(id: string): Promise<Project | null> {
    return this.dbAdapter.getProjectById(id)
  }

  async createProject(dto: CreateProjectDTO): Promise<Project> {
    const trimmedName = dto.name.trim()
    if (!trimmedName) {
      throw new Error("Project name is required and cannot be empty")
    }
    return this.dbAdapter.createProject({
      ...dto,
      name: trimmedName,
    })
  }

  async updateProject(id: string, dto: UpdateProjectDTO): Promise<Project> {
    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim()
      if (!trimmedName) {
        throw new Error("Project name cannot be empty")
      }
      dto.name = trimmedName
    }
    return this.dbAdapter.updateProject(id, dto)
  }

  async deleteProject(id: string): Promise<void> {
    return this.dbAdapter.deleteProject(id)
  }
}
