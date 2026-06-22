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
import {
  analyzeRequirements,
  approveRequirement,
  checkCoverage,
  createTextArtifact,
  detectGaps,
  exportExcel,
  generateTestcases,
  getProject,
  getRequirementVersion,
  getTestcaseSet,
  parseArtifact,
  rewriteRequirement,
} from "@/lib/api";
import { gapItems, requirementItems, testCases } from "@/lib/mock-data";
import type { Artifact, RequirementVersion, StepKey, TestcaseSet, WorkflowRun } from "@/types/domain";
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
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [requirementVersion, setRequirementVersion] = useState<RequirementVersion | null>(null);
  const [testcaseSet, setTestcaseSet] = useState<TestcaseSet | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowRun | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: project } = useQuery({
    queryKey: ["project", params.id],
    queryFn: () => getProject(params.id),
  });
  const coverage = useMemo(() => {
    const covered = 2;
    const denominator = 3;
    return Math.round((covered / denominator) * 100);
  }, []);

  async function runStep() {
    setIsRunning(true);
    setError(null);
    try {
      if (active === "input") {
        const created = await createTextArtifact(
          params.id,
          "User can login, recover password, generate test cases, review coverage, and export Excel.",
        );
        setArtifact(created);
        setWorkflow(await parseArtifact(created.id));
      }

      if (active === "analyze") {
        const currentArtifact =
          artifact ??
          (await createTextArtifact(
            params.id,
            "User can login, recover password, generate test cases, review coverage, and export Excel.",
          ));
        setArtifact(currentArtifact);
        const run = await analyzeRequirements(params.id, currentArtifact.id);
        setWorkflow(run);
        const versionId = run.outputJson?.requirementVersionId;
        if (typeof versionId === "string") {
          setRequirementVersion(await getRequirementVersion(versionId));
        }
      }

      if (active === "gaps" && requirementVersion) {
        const run = await detectGaps(requirementVersion.id);
        setWorkflow(run);
        setRequirementVersion(await getRequirementVersion(requirementVersion.id));
      }

      if (active === "final" && requirementVersion) {
        const run = await rewriteRequirement(requirementVersion.id);
        setWorkflow(run);
        const versionId = run.outputJson?.requirementVersionId;
        const nextVersion = typeof versionId === "string" ? await getRequirementVersion(versionId) : requirementVersion;
        setRequirementVersion(nextVersion);
        await approveRequirement(nextVersion.id);
        setRequirementVersion(await getRequirementVersion(nextVersion.id));
      }

      if (active === "testcases" && requirementVersion) {
        const run = await generateTestcases(requirementVersion.id);
        setWorkflow(run);
        const testcaseSetId = run.outputJson?.testcaseSetId;
        if (typeof testcaseSetId === "string") {
          setTestcaseSet(await getTestcaseSet(testcaseSetId));
        }
      }

      if (active === "coverage" && testcaseSet) {
        setWorkflow(await checkCoverage(testcaseSet.id));
      }

      if (active === "export" && testcaseSet) {
        setWorkflow(await exportExcel(testcaseSet.id));
      }
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Workflow failed");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <Shell>
      <PageHeader
        title={project?.name ?? "Project"}
        description="Upload requirements, review gaps, generate testcases, check coverage, and export Excel."
        actions={
          <Button
            variant="secondary"
            onClick={runStep}
            disabled={isRunning}
          >
            <Play size={16} />
            {isRunning ? "Running" : "Run step"}
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
      {error ? (
        <div className={styles.workflow}>
          <Badge tone="danger">failed</Badge>
          <span>{error}</span>
        </div>
      ) : null}
      {active === "input" ? <InputTab artifact={artifact} /> : null}
      {active === "analyze" ? <AnalyzeTab version={requirementVersion} /> : null}
      {active === "gaps" ? <GapsTab version={requirementVersion} /> : null}
      {active === "final" ? <FinalRequirementTab /> : null}
      {active === "testcases" ? <TestcasesTab set={testcaseSet} /> : null}
      {active === "coverage" ? <CoverageTab coverage={coverage} version={requirementVersion} /> : null}
      {active === "export" ? <ExportTab /> : null}
    </Shell>
  );
}

function InputTab({ artifact }: { artifact: Artifact | null }) {
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
          <span>{artifact ? `${artifact.fileName ?? artifact.id} - ${artifact.status}` : "PDF, DOCX, TXT, XLSX, CSV, image, or Figma URL"}</span>
        </div>
      </Panel>
      <Panel>
        <h2>Paste requirement</h2>
        <TextArea defaultValue="User can login, recover password, and export generated testcases." />
      </Panel>
    </div>
  );
}

function AnalyzeTab({ version }: { version: RequirementVersion | null }) {
  const items = version?.items ?? requirementItems;
  return (
    <div className={styles.gridWide}>
      <Panel>
        <h2>
          <ListChecks size={18} />
          Structured items
        </h2>
        <div className={styles.table}>
          {items.map((item) => (
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
        <div className={styles.score}>{version?.qualityScore ?? 84}</div>
        <p className={styles.muted}>Clear and testable with minor error-state gaps.</p>
      </Panel>
    </div>
  );
}

function GapsTab({ version }: { version: RequirementVersion | null }) {
  const gaps = version?.gaps ?? gapItems;
  return (
    <Panel>
      <h2>
        <GitPullRequest size={18} />
        Gap review
      </h2>
      <div className={styles.table}>
        {gaps.map((gap) => (
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

function TestcasesTab({ set }: { set: TestcaseSet | null }) {
  const cases = set?.testCases ?? testCases;
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
        {cases.map((testCase) => (
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

function CoverageTab({ coverage, version }: { coverage: number; version: RequirementVersion | null }) {
  const items = version?.items ?? requirementItems;
  return (
    <Panel>
      <h2>Coverage matrix</h2>
      <div className={styles.coverage}>
        <strong>{coverage}%</strong>
        <span>Not Testable excluded from denominator</span>
      </div>
      <div className={styles.table}>
        {items.map((item, index) => (
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
