'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Search, FolderOpen, ArrowRight, Trash2 } from 'lucide-react';
import { projectsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import type { Project } from '@/types/api';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  function handleDelete(project: Project) {
    if (!confirm(`Xóa dự án "${project.name}"? Hành động này không thể hoàn tác.`)) return;
    deleteMutation.mutate(project.id);
  }

  const filtered = projects?.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchSearch && matchStatus;
  }) ?? [];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dự án</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Quản lý tất cả dự án QA</p>
        </div>
        <Link href="/projects/new">
          <Button size="sm">
            <Plus size={14} />
            Dự án mới
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm dự án..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1">
          {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`h-9 px-3 rounded-md text-sm transition-colors ${
                filterStatus === s
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-input bg-background hover:bg-secondary'
              }`}
            >
              {s === 'ALL' ? 'Tất cả' : s === 'ACTIVE' ? 'Đang hoạt động' : 'Lưu trữ'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : !filtered.length ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen size={40} className="text-muted-foreground mb-3" />
          <p className="text-sm font-medium">
            {search || filterStatus !== 'ALL' ? 'Không tìm thấy dự án phù hợp' : 'Chưa có dự án nào'}
          </p>
          {!search && filterStatus === 'ALL' && (
            <>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Tạo dự án đầu tiên để bắt đầu phân tích yêu cầu</p>
              <Link href="/projects/new">
                <Button size="sm">
                  <Plus size={14} />
                  Tạo dự án
                </Button>
              </Link>
            </>
          )}
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((project) => (
            <Card key={project.id} className="flex items-center justify-between py-4 hover:border-primary/30 transition-colors">
              <Link href={`/projects/${project.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <FolderOpen size={18} className="text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{project.name}</p>
                  {project.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{project.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cập nhật {new Date(project.updatedAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <Badge variant={project.status === 'ACTIVE' ? 'success' : 'muted'}>
                  {project.status === 'ACTIVE' ? 'Đang hoạt động' : 'Lưu trữ'}
                </Badge>
                <Link href={`/projects/${project.id}/edit`}>
                  <Button variant="ghost" size="sm">Sửa</Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(project)}
                  loading={deleteMutation.isPending && deleteMutation.variables === project.id}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={14} />
                </Button>
                <Link href={`/projects/${project.id}`}>
                  <ArrowRight size={16} className="text-muted-foreground" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
