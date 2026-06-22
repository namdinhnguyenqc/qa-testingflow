"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FolderKanban, Gauge, ScrollText } from "lucide-react";
import { Shell } from "@/components/shell";
import { Badge, Button, PageHeader, Panel } from "@/components/ui";
import { listProjects } from "@/lib/api";
import styles from "./page.module.css";

export default function DashboardPage() {
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  });

  return (
    <Shell>
      <PageHeader
        title="Dashboard"
        description="Project status, workflow health, and review queues."
        actions={
          <Link href="/projects">
            <Button>
              Projects
              <ArrowRight size={16} />
            </Button>
          </Link>
        }
      />
      <div className={styles.metrics}>
        <Panel>
          <FolderKanban size={20} />
          <strong>{projects.length}</strong>
          <span>Active projects</span>
        </Panel>
        <Panel>
          <Gauge size={20} />
          <strong>82%</strong>
          <span>Demo coverage</span>
        </Panel>
        <Panel>
          <ScrollText size={20} />
          <strong>2</strong>
          <span>Review warnings</span>
        </Panel>
      </div>
      <Panel>
        <div className={styles.sectionTitle}>
          <h2>Recent projects</h2>
          <Badge tone="success">Phase 0 ready</Badge>
        </div>
        <div className={styles.list}>
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <span>{project.name}</span>
              <small>{project.defaultLanguage.toUpperCase()}</small>
            </Link>
          ))}
        </div>
      </Panel>
    </Shell>
  );
}
