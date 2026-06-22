import { http, HttpResponse } from "msw";
import { projects } from "@/lib/mock-data";
import type { Project } from "@/types/domain";

export const handlers = [
  http.get("*/api/projects", () => HttpResponse.json(projects)),
  http.post("*/api/projects", async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      description?: string;
      defaultLanguage?: "vi" | "en";
    };
    const now = new Date().toISOString();
    const project: Project = {
      id: `project-${Date.now()}`,
      name: body.name,
      description: body.description,
      status: "ACTIVE",
      defaultLanguage: body.defaultLanguage ?? "vi",
      createdAt: now,
      updatedAt: now,
    };
    projects.unshift(project);
    return HttpResponse.json(project, { status: 201 });
  }),
  http.get("*/api/projects/:id", ({ params }) => {
    const project = projects.find((item) => item.id === params.id);
    return project ? HttpResponse.json(project) : HttpResponse.json({ message: "Not found" }, { status: 404 });
  }),
];
