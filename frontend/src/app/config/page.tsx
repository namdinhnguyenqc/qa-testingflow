import { Shell } from "@/components/shell";
import { Badge, PageHeader, Panel } from "@/components/ui";
import styles from "./page.module.css";

const groups = ["Providers", "Model policies", "Gates", "Prompts", "Templates", "Skills", "Tools"];

export default function ConfigPage() {
  return (
    <Shell>
      <PageHeader title="Config" description="Provider, prompt, gate, and template settings." />
      <div className={styles.grid}>
        {groups.map((group, index) => (
          <Panel key={group}>
            <h2>{group}</h2>
            <Badge tone={index < 3 ? "success" : "neutral"}>{index < 3 ? "Phase 2 ready" : "Backlog"}</Badge>
          </Panel>
        ))}
      </div>
    </Shell>
  );
}
