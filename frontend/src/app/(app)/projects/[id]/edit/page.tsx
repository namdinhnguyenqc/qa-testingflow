'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { PageSpinner } from '@/components/ui/Spinner';

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id),
  });

  if (isLoading) return <PageSpinner />;
  if (!project) return <p className="p-8 text-sm text-muted-foreground">Không tìm thấy dự án.</p>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <a href={`/projects/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        ← Quay lại
      </a>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Chỉnh sửa dự án</h1>
          <p className="text-sm text-gray-500 mt-1">{project.name}</p>
        </div>
        <ProjectForm project={project} />
      </div>
    </div>
  );
}
