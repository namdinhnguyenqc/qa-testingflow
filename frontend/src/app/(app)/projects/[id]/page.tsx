'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { projectsApi } from '@/lib/api';
import { ProjectStepper } from '@/components/project-detail/ProjectStepper';
import { TabInput } from '@/components/project-detail/TabInput';
import { TabAnalyze } from '@/components/project-detail/TabAnalyze';
import { TabGapReview } from '@/components/project-detail/TabGapReview';
import { TabFinalRequirement } from '@/components/project-detail/TabFinalRequirement';
import { TabTestcaseGeneration } from '@/components/project-detail/TabTestcaseGeneration';
import { TabTestcaseReview } from '@/components/project-detail/TabTestcaseReview';
import { TabCoverage } from '@/components/project-detail/TabCoverage';
import { TabExport } from '@/components/project-detail/TabExport';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import type { ProjectTab } from '@/components/project-detail/tabs';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<ProjectTab>('input');

  // State shared across tabs (normally would come from server/query)
  const [artifactId, setArtifactId] = useState<string | undefined>();
  const [requirementVersionId, setRequirementVersionId] = useState<string | null>('rv-001'); // mock seed
  const [isRequirementApproved, setIsRequirementApproved] = useState(false);
  const [testcaseSetId, setTestcaseSetId] = useState<string | null>('tcs-001'); // mock seed

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id),
  });

  if (isLoading) return <PageSpinner />;
  if (!project) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Không tìm thấy dự án.{' '}
        <Link href="/projects" className="text-primary hover:underline">Quay lại</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/projects" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold">{project.name}</h1>
              <Badge variant={project.status === 'ACTIVE' ? 'success' : 'muted'}>
                {project.status === 'ACTIVE' ? 'Đang hoạt động' : 'Lưu trữ'}
              </Badge>
            </div>
            {project.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{project.description}</p>
            )}
          </div>
        </div>
        <Link href={`/projects/${id}/edit`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Pencil size={13} />
          Chỉnh sửa
        </Link>
      </div>

      {/* Stepper */}
      <ProjectStepper activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'input' && (
          <TabInput
            projectId={id}
            onParsed={(artId) => {
              setArtifactId(artId);
              setActiveTab('analyze');
            }}
          />
        )}
        {activeTab === 'analyze' && (
          <TabAnalyze
            projectId={id}
            requirementVersionId={requirementVersionId}
            artifactId={artifactId}
          />
        )}
        {activeTab === 'gap-review' && (
          <TabGapReview requirementVersionId={requirementVersionId} />
        )}
        {activeTab === 'final-requirement' && (
          <TabFinalRequirement
            requirementVersionId={requirementVersionId}
            onApproved={() => {
              setIsRequirementApproved(true);
              setActiveTab('testcase-generation');
            }}
          />
        )}
        {activeTab === 'testcase-generation' && (
          <TabTestcaseGeneration
            requirementVersionId={requirementVersionId}
            isApproved={isRequirementApproved}
            onGenerated={(setId) => {
              setTestcaseSetId(setId);
              setActiveTab('testcase-review');
            }}
          />
        )}
        {activeTab === 'testcase-review' && (
          <TabTestcaseReview testcaseSetId={testcaseSetId} />
        )}
        {activeTab === 'coverage' && (
          <TabCoverage testcaseSetId={testcaseSetId} />
        )}
        {activeTab === 'export' && (
          <TabExport projectId={id} testcaseSetId={testcaseSetId} />
        )}
      </div>
    </div>
  );
}
