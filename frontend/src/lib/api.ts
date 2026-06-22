import type { Project } from "@/types/domain";
import { projects as mockProjects } from "./mock-data";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

export interface CreateProjectInput {
  name: string;
  description?: string;
  defaultLanguage?: "vi" | "en";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function listProjects(): Promise<Project[]> {
  if (USE_MOCKS) {
    return mockProjects;
  }

  return request<Project[]>("/projects");
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  if (USE_MOCKS) {
    const now = new Date().toISOString();
    const project: Project = {
      id: `project-${Date.now()}`,
      name: input.name,
      description: input.description,
      status: "ACTIVE",
      defaultLanguage: input.defaultLanguage ?? "vi",
      createdAt: now,
      updatedAt: now,
    };
    mockProjects.unshift(project);
    return project;
  }

  return request<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getProject(id: string): Promise<Project> {
  if (USE_MOCKS) {
    const project = mockProjects.find((item) => item.id === id);
    if (!project) {
      throw new Error("Project not found");
    }
    return project;
  }

  return request<Project>(`/projects/${id}`);
}
