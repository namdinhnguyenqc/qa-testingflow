"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { Shell } from "@/components/shell";
import { Button, PageHeader, Panel, Select, TextArea, TextInput } from "@/components/ui";
import { createProject, listProjects } from "@/lib/api";
import styles from "./page.module.css";

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: listProjects });
  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      setName("");
      setDescription("");
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
  const filtered = useMemo(
    () => projects.filter((project) => project.name.toLowerCase().includes(query.toLowerCase())),
    [projects, query],
  );

  return (
    <Shell>
      <PageHeader title="Projects" description="Create and manage AI QA workspaces." />
      <div className={styles.grid}>
        <Panel>
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim()) return;
              createMutation.mutate({ name, description, defaultLanguage: language });
            }}
          >
            <h2>Create project</h2>
            <label>
              Name
              <TextInput value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              Description
              <TextArea value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <label>
              Output language
              <Select value={language} onChange={(event) => setLanguage(event.target.value as "vi" | "en")}>
                <option value="vi">Vietnamese</option>
                <option value="en">English</option>
              </Select>
            </label>
            <Button type="submit" disabled={createMutation.isPending}>
              <Plus size={16} />
              Create
            </Button>
          </form>
        </Panel>
        <Panel>
          <div className={styles.search}>
            <Search size={16} />
            <TextInput placeholder="Search projects" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className={styles.table}>
            {filtered.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <strong>{project.name}</strong>
                <span>{project.status}</span>
                <small>{project.defaultLanguage.toUpperCase()}</small>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </Shell>
  );
}
