'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Search, FolderOpen, ArrowRight, Trash2, MoreHorizontal, Pencil } from 'lucide-react';
import { projectsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { PageHeader } from '@/components/ui/PageHeader';
import type { Project } from '@/types/api';

function ProjectCardMenu({ project, onDelete }: { project: Project; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
          <Link
            href={`/projects/${project.id}/edit`}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(false)}
          >
            <Pencil size={14} />
            Chỉnh sửa
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Xóa dự án
          </button>
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  onDelete,
}: {
  project: Project;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col p-0 overflow-hidden hover:shadow-md hover:border-blue-100 transition-all">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <p className="font-semibold text-gray-900 text-sm truncate flex-1 mr-2">{project.name}</p>
        <ProjectCardMenu project={project} onDelete={onDelete} />
      </div>

      {/* Description */}
      <div className="px-5 pb-4 flex-1">
        {project.description ? (
          <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
        ) : (
          <p className="text-sm text-gray-300 italic">Chưa có mô tả</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <Badge variant={project.status === 'ACTIVE' ? 'success' : 'muted'}>
            {project.status === 'ACTIVE' ? 'Đang hoạt động' : 'Lưu trữ'}
          </Badge>
          <span className="text-xs text-gray-400">
            {new Date(project.updatedAt).toLocaleDateString('vi-VN')}
          </span>
        </div>
        <Link
          href={`/projects/${project.id}`}
          className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <ArrowRight size={15} />
        </Link>
      </div>
    </Card>
  );
}

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

  const filtered =
    projects?.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description ?? '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
      return matchSearch && matchStatus;
    }) ?? [];

  return (
    <div className="p-8">
      <PageHeader title="Dự án" subtitle="Quản lý tất cả dự án QA">
        <Link href="/projects/new">
          <Button size="sm">
            <Plus size={14} />
            Dự án mới
          </Button>
        </Link>
      </PageHeader>

      {/* Search + filter row */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm dự án..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-sm"
          />
        </div>
        <div className="flex gap-1">
          {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                filterStatus === s
                  ? 'bg-blue-500 text-white'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
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
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FolderOpen size={28} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700">
            {search || filterStatus !== 'ALL' ? 'Không tìm thấy dự án phù hợp' : 'Chưa có dự án nào'}
          </p>
          {!search && filterStatus === 'ALL' && (
            <>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                Tạo dự án đầu tiên để bắt đầu phân tích yêu cầu
              </p>
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
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={() => handleDelete(project)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
