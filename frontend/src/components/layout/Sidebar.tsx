'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  ClipboardList,
  LogOut,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: 'TỔNG QUAN',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'QUẢN LÝ DỰ ÁN',
    items: [
      { href: '/projects', label: 'Dự án', icon: FolderOpen },
    ],
  },
  {
    label: 'CÀI ĐẶT',
    items: [
      { href: '/configs', label: 'Cấu hình', icon: Settings },
      { href: '/audit-logs', label: 'Audit Log', icon: ClipboardList },
    ],
  },
];

function NavItemLink({ href, label, icon: Icon }: NavItem) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-600'
          : 'text-gray-600 hover:bg-gray-50 border-l-2 border-transparent',
      )}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}

export function Sidebar() {
  function handleLogout() {
    document.cookie = 'auth-token=; Max-Age=0; path=/';
    window.location.href = '/login';
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-white flex flex-col border-r border-gray-100 h-full">
      {/* Logo area */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
          <Cpu size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm tracking-wide">AI QA Platform</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="text-xs text-gray-400 uppercase font-semibold px-3 mb-1 mt-4 first:mt-0 tracking-wider">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItemLink key={item.href} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom user section */}
      <div className="border-t border-gray-100">
        <div className="p-3 flex items-center gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">A</span>
          </div>
          {/* User info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
            <p className="text-xs text-gray-400 truncate">admin@gmail.com</p>
          </div>
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Đăng xuất"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
