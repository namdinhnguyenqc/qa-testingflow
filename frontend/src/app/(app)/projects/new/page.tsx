import { ProjectForm } from '@/components/projects/ProjectForm';

export default function NewProjectPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Tạo dự án mới</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Nhập thông tin cơ bản để bắt đầu</p>
      </div>
      <ProjectForm />
    </div>
  );
}
