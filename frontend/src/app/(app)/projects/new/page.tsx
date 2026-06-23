import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProjectForm } from '@/components/projects/ProjectForm';

export default function NewProjectPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={14} /> Quay lại
      </Link>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Tạo dự án mới</h1>
          <p className="text-sm text-gray-500 mt-1">Nhập thông tin cơ bản để bắt đầu</p>
        </div>
        <ProjectForm />
      </div>
    </div>
  );
}
