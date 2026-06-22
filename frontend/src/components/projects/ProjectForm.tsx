'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { projectsApi } from '@/lib/api';
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '@/types/api';

interface ProjectFormProps {
  project?: Project;
}

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!project;

  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [language, setLanguage] = useState<'vi' | 'en'>(project?.defaultLanguage ?? 'vi');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (body: CreateProjectRequest) => projectsApi.create(body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push(`/projects/${data.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (body: UpdateProjectRequest) => projectsApi.update(project!.id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', project!.id] });
      router.push(`/projects/${project!.id}`);
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const serverError = createMutation.error?.message || updateMutation.error?.message;

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Tên dự án không được để trống.';
    if (name.length > 120) errs.name = 'Tên tối đa 120 ký tự.';
    if (description.length > 1000) errs.description = 'Mô tả tối đa 1000 ký tự.';
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});

    const body = { name: name.trim(), description: description.trim() || undefined, defaultLanguage: language };
    if (isEdit) {
      updateMutation.mutate(body);
    } else {
      createMutation.mutate(body);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-lg">
      <Input
        id="name"
        label="Tên dự án *"
        placeholder="VD: E-commerce Payment Module"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        maxLength={120}
        required
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">Mô tả</label>
        <textarea
          id="description"
          rows={3}
          placeholder="Mô tả ngắn về phạm vi hoặc mục tiêu dự án"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="language" className="text-sm font-medium">Ngôn ngữ output mặc định</label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'vi' | 'en')}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="vi">Tiếng Việt (mặc định)</option>
          <option value="en">English</option>
        </select>
      </div>

      {serverError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive">{serverError}</p>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={isPending}>
          {isEdit ? 'Lưu thay đổi' : 'Tạo dự án'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Hủy
        </Button>
      </div>
    </form>
  );
}
