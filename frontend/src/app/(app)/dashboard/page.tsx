'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { FolderOpen, Plus, ArrowRight } from 'lucide-react';
import { projectsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';

export default function DashboardPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  const activeCount = projects?.filter((p) => p.status === 'ACTIVE').length ?? 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tổng quan nền tảng AI QA</p>
        </div>
        <Link href="/projects/new">
          <Button size="sm">
            <Plus size={14} />
            Dự án mới
          </Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Dự án đang hoạt động</p>
          {isLoading ? (
            <div className="h-7 w-8 bg-muted animate-pulse rounded" />
          ) : (
            <p className="text-2xl font-bold">{activeCount}</p>
          )}
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tổng dự án</p>
          {isLoading ? (
            <div className="h-7 w-8 bg-muted animate-pulse rounded" />
          ) : (
            <p className="text-2xl font-bold">{projects?.length ?? 0}</p>
          )}
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Trạng thái AI</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="size-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium">Sẵn sàng</span>
          </div>
        </Card>
      </div>

      {/* Recent projects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Dự án gần đây</h2>
          <Link href="/projects" className="text-xs text-primary hover:underline flex items-center gap-1">
            Xem tất cả <ArrowRight size={12} />
          </Link>
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : !projects?.length ? (
          <Card className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen size={40} className="text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Chưa có dự án nào</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Tạo dự án đầu tiên để bắt đầu</p>
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
                <Card className="flex items-center justify-between hover:border-primary/40 transition-colors cursor-pointer py-4">
                  <div className="flex items-center gap-3">
                    <FolderOpen size={18} className="text-primary" />
                    <div>
                      <p className="text-sm font-medium">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={project.status === 'ACTIVE' ? 'success' : 'muted'}>
                      {project.status === 'ACTIVE' ? 'Đang hoạt động' : 'Lưu trữ'}
                    </Badge>
                    <ArrowRight size={14} className="text-muted-foreground" />
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
