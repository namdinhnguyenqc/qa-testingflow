"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  GitPullRequest,
  ListChecks,
  Play,
  Upload,
} from "lucide-react";
import { Shell } from "@/components/shell";
import { Badge, Button, PageHeader, Panel, Select, TextArea, TextInput } from "@/components/ui";
import { getProject } from "@/lib/api";
import { gapItems, requirementItems, testCases } from "@/lib/mock-data";
import { useWorkflowStatus } from "@/lib/workflow";
import type { StepKey } from "@/types/domain";
import styles from "./page.module.css";

const steps: Array<{ key: StepKey; label: string }> = [
  { key: "input", label: "Input" },
  { key: "analyze", label: "Analyze" },
  { key: "gaps", label: "Gap Review" },
  { key: "final", label: "Final Requirement" },
  { key: "testcases", label: "Testcases" },
  { key: "coverage", label: "Coverage" },
  { key: "export", label: "Export" },
];

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [active, setActive] = useState<StepKey>("input");
  const [runningWorkflow, setRunningWorkflow] = useState<string | null>(null);
  const workflow = useWorkflowStatus(runningWorkflow ?? "idle", Boolean(runningWorkflow));
  const { data: project } = useQuery({
    queryKey: ["project", params.id],
    queryFn: () => getProject(params.id),
  });
  const coverage = useMemo(() => {
    const covered = 2;
    const denominator = 3;
    return Math.round((covered / denominator) * 100);
  }, []);

  return (
    <Shell>
      <PageHeader
        title={project?.name ?? "Project"}
        description="Upload requirements, review gaps, generate testcases, check coverage, and export Excel."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              setRunningWorkflow(active);
            }}
          >
            <Play size={16} />
            Run step
          </Button>
        }
      />
      <div className={styles.stepper}>
        {steps.map((step, index) => (
          <button
            key={step.key}
            type="button"
            className={active === step.key ? styles.activeStep : undefined}
            onClick={() => setActive(step.key)}
          >
            <span>{index + 1}</span>
            {step.label}
          </button>
        ))}
      </div>
      {workflow ? (
        <div className={styles.workflow}>
          <Badge tone={workflow.status === "succeeded" ? "success" : "warning"}>{workflow.status}</Badge>
          <span>{workflow.workflowKey}</span>
          <code>{workflow.traceId}</code>
        </div>
      ) : null}
      {active === "input" ? <InputTab /> : null}
      {active === "analyze" ? <AnalyzeTab /> : null}
      {active === "gaps" ? <GapsTab /> : null}
      {active === "final" ? <FinalRequirementTab /> : null}
      {active === "testcases" ? <TestcasesTab /> : null}
      {active === "coverage" ? <CoverageTab coverage={coverage} /> : null}
      {active === "export" ? <ExportTab /> : null}
    </Shell>
  );
}

function InputTab() {
  return (
    <div className={styles.grid}>
      <Panel>
        <h2>
          <Upload size={18} />
          Upload
        </h2>
        <div className={styles.dropzone}>
          <FileText size={24} />
          <strong>Drop requirement file</strong>
          <span>PDF, DOCX, TXT, XLSX, CSV, image, or Figma URL</span>
        </div>
      </Panel>
      <Panel>
        <h2>Paste requirement</h2>
        <TextArea defaultValue="User can login, recover password, and export generated testcases." />
      </Panel>
    </div>
  );
}

function AnalyzeTab() {
  return (
    <div className={styles.gridWide}>
      <Panel>
        <h2>
          <ListChecks size={18} />
          Structured items
        </h2>
        <div className={styles.table}>
          {requirementItems.map((item) => (
            <div key={item.externalId}>
              <strong>{item.externalId}</strong>
              <span>{item.module}</span>
              <span>{item.feature}</span>
              <Badge tone={item.priority === "HIGH" ? "warning" : "neutral"}>{item.priority}</Badge>
              <p>{item.content}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <h2>Quality score</h2>
        <div className={styles.score}>84</div>
        <p className={styles.muted}>Clear and testable with minor error-state gaps.</p>
      </Panel>
    </div>
  );
}

function GapsTab() {
  return (
    <Panel>
      <h2>
        <GitPullRequest size={18} />
        Gap review
      </h2>
      <div className={styles.table}>
        {gapItems.map((gap) => (
          <div key={gap.id}>
            <strong>{gap.id}</strong>
            <span>{gap.category}</span>
            <Badge tone={gap.status === "RESOLVED" ? "success" : "warning"}>{gap.status}</Badge>
            <p>{gap.description}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function FinalRequirementTab() {
  return (
    <div className={styles.grid}>
      <Panel>
        <h2>Version</h2>
        <Select defaultValue="v2">
          <option value="v1">v1 - analyzed</option>
          <option value="v2">v2 - rewritten</option>
        </Select>
      </Panel>
      <Panel>
        <h2>
          <CheckCircle2 size={18} />
          Approval gate
        </h2>
        <Badge tone="warning">Warning + override</Badge>
        <p className={styles.muted}>Open High gaps allow approval with unresolved risk label.</p>
      </Panel>
    </div>
  );
}

function TestcasesTab() {
  return (
    <Panel>
      <h2>
        <FileSpreadsheet size={18} />
        Testcase review
      </h2>
      <div className={styles.toolbar}>
        <TextInput placeholder="Search testcase" />
        <Select defaultValue="all">
          <option value="all">All status</option>
          <option value="READY">Ready</option>
          <option value="DRAFT">Draft</option>
        </Select>
      </div>
      <div className={styles.caseGrid}>
        {testCases.map((testCase) => (
          <div key={testCase.id}>
            <strong>{testCase.id}</strong>
            <span>{testCase.title}</span>
            <Badge tone={testCase.status === "READY" ? "success" : "neutral"}>{testCase.status}</Badge>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function CoverageTab({ coverage }: { coverage: number }) {
  return (
    <Panel>
      <h2>Coverage matrix</h2>
      <div className={styles.coverage}>
        <strong>{coverage}%</strong>
        <span>Not Testable excluded from denominator</span>
      </div>
      <div className={styles.table}>
        {requirementItems.map((item, index) => (
          <div key={item.externalId}>
            <strong>{item.externalId}</strong>
            <span>{item.feature}</span>
            <Badge tone={index < 2 ? "success" : "warning"}>{index < 2 ? "COVERED" : "PARTIAL"}</Badge>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ExportTab() {
  return (
    <Panel>
      <h2>
        <Download size={18} />
        Excel export
      </h2>
      <div className={styles.exportRow}>
        <Select defaultValue="testcases">
          <option value="testcases">Test Cases sheet</option>
          <option value="full">Full traceability workbook</option>
        </Select>
        <Button>
          <Download size={16} />
          Export
        </Button>
      </div>
      <div className={styles.table}>
        <div>
          <strong>QA-demo-testcases.xlsx</strong>
          <span>Last generated</span>
          <Badge tone="success">SUCCEEDED</Badge>
        </div>
      </div>
    </Panel>
  );
}
