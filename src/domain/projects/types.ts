export interface Project {
  id: string
  name: string
  description?: string
  default_model_id?: string
  created_at: string
  updated_at: string
}

export interface CreateProjectDTO {
  name: string
  description?: string
  default_model_id?: string
}

export interface UpdateProjectDTO {
  name?: string
  description?: string
  default_model_id?: string
}
