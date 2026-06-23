'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { FolderOpen, Plus, ArrowRight, LayoutGrid, Cpu } from 'lucide-react';
import { projectsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';

export default function DashboardPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  const activeCount = projects?.filter((p) => p.status === 'ACTIVE').length ?? 0;
  const totalCount = projects?.length ?? 0;

  return (
    <div className="p-8">
      <PageHeader title="Dashboard" subtitle="Tổng quan nền tảng AI QA">
        <Link href="/projects/new">
          <Button size="sm">
            <Plus size={14} />
            Dự án mới
          </Button>
        </Link>
      </PageHeader>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Dự án đang hoạt động"
          value={isLoading ? '—' : activeCount}
          icon={FolderOpen}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Tổng dự án"
          value={isLoading ? '—' : totalCount}
          icon={LayoutGrid}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Trạng thái AI"
          value="Sẵn sàng"
          icon={Cpu}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
      </div>

      {/* Recent projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Dự án gần đây</h2>
          <Link
            href="/projects"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
          >
            Xem tất cả <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : !projects?.length ? (
          <Card className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen size={40} className="text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-700">Chưa có dự án nào</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Tạo dự án đầu tiên để bắt đầu</p>
            <Link href="/projects/new">
              <Button size="sm">
                <Plus size={14} />
                Tạo dự án
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {projects.slice(0, 5).map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="flex items-center justify-between hover:border-blue-200 hover:shadow-md transition-all cursor-pointer py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FolderOpen size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{project.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={project.status === 'ACTIVE' ? 'success' : 'muted'}>
                      {project.status === 'ACTIVE' ? 'Đang hoạt động' : 'Lưu trữ'}
                    </Badge>
                    <ArrowRight size={14} className="text-gray-400" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
