import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface TrendInfo {
  value: number;
  label: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  trend?: TrendInfo;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
}: StatCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      {/* Top row: icon + trend badge */}
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', iconBg)}>
          <Icon size={20} className={iconColor} />
        </div>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
              isPositive
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700',
            )}
          >
            {isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            {trend.label && <span className="ml-1 font-normal">{trend.label}</span>}
          </span>
        )}
      </div>

      {/* Value */}
      <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>

      {/* Title */}
      <p className="text-sm text-gray-500 mt-0.5">{title}</p>

      {/* Optional subtitle */}
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}
