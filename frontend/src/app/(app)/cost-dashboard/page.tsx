'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { costDashboardApi } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageSpinner } from '@/components/ui/Spinner';

type Period = 'day' | 'week' | 'month';

interface DashboardData {
  projectId: string;
  period: string;
  totalCostUsd: number;
  totalCalls: number;
  totalTokens: number;
  byModel: { provider: string; model: string; calls: number; costUsd: number; totalTokens: number; errors: number }[];
  bySkill: { skillName: string; calls: number; costUsd: number; errors: number }[];
  dailySeries: { date: string; calls: number; costUsd: number }[];
}

function MiniBar({ value, max, color = 'bg-blue-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-12 text-right">{value}</span>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function DailyChart({ series }: { series: DashboardData['dailySeries'] }) {
  if (!series.length) return null;
  const maxCost = Math.max(...series.map((d) => d.costUsd), 0.0001);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold mb-4">Chi phí theo ngày (USD)</h3>
      <div className="flex items-end gap-1 h-28">
        {series.map((d) => {
          const h = maxCost > 0 ? Math.max((d.costUsd / maxCost) * 100, 2) : 2;
          return (
            <div key={d.date} className="flex flex-col items-center gap-1 flex-1 group relative">
              <div
                className="w-full bg-blue-400 hover:bg-blue-500 rounded-t transition-colors cursor-default"
                style={{ height: `${h}%` }}
              />
              <div className="absolute bottom-full mb-1 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                {d.date}<br />${d.costUsd.toFixed(4)} · {d.calls} calls
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>{series[0]?.date}</span>
        <span>{series[series.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export default function CostDashboardPage() {
  const [period, setPeriod] = useState<Period>('month');

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['cost-dashboard', 'global', period],
    queryFn: () => costDashboardApi.getGlobal(period),
    retry: false,
  });

  const maxModelCost = Math.max(...(data?.byModel.map((m) => m.costUsd) ?? [0]));
  const maxSkillCalls = Math.max(...(data?.bySkill.map((s) => s.calls) ?? [0]));

  return (
    <div className="p-8">
      <PageHeader title="Chi phí AI" subtitle="Phân tích chi phí theo provider, model và skill">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['day', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                period === p ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p === 'day' ? 'Hôm nay' : p === 'week' ? '7 ngày' : '30 ngày'}
            </button>
          ))}
        </div>
      </PageHeader>

      {isLoading ? (
        <PageSpinner />
      ) : !data ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-gray-400">
          Chưa có dữ liệu chi phí. Chạy một vài workflow để bắt đầu tracking.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Tổng chi phí"
              value={`$${data.totalCostUsd.toFixed(4)}`}
              sub={`Kỳ: ${period === 'day' ? '24 giờ' : period === 'week' ? '7 ngày' : '30 ngày'}`}
            />
            <StatCard
              label="Tổng lần gọi AI"
              value={data.totalCalls.toLocaleString()}
              sub={`Trung bình $${data.totalCalls > 0 ? (data.totalCostUsd / data.totalCalls).toFixed(4) : '0'}/call`}
            />
            <StatCard
              label="Tổng token"
              value={data.totalTokens.toLocaleString()}
              sub={`~${data.totalTokens > 0 ? (data.totalCostUsd / data.totalTokens * 1000).toFixed(4) : '0'}/1k tokens`}
            />
          </div>

          {/* Daily chart */}
          <DailyChart series={data.dailySeries} />

          <div className="grid grid-cols-2 gap-6">
            {/* By model */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold mb-4">Theo model</h3>
              {data.byModel.length === 0 ? (
                <p className="text-xs text-gray-400">Không có dữ liệu</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {[...data.byModel]
                    .sort((a, b) => b.costUsd - a.costUsd)
                    .map((m) => (
                      <div key={`${m.provider}-${m.model}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <span className="text-xs font-medium">{m.model}</span>
                            <span className="text-xs text-gray-400 ml-1">({m.provider})</span>
                          </div>
                          <span className="text-xs font-mono text-gray-600">${m.costUsd.toFixed(4)}</span>
                        </div>
                        <MiniBar value={m.costUsd} max={maxModelCost} color="bg-blue-400" />
                        {m.errors > 0 && (
                          <p className="text-xs text-red-400 mt-0.5">{m.errors} lỗi</p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* By skill */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold mb-4">Theo skill</h3>
              {data.bySkill.length === 0 ? (
                <p className="text-xs text-gray-400">Không có dữ liệu</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {[...data.bySkill]
                    .sort((a, b) => b.calls - a.calls)
                    .map((s) => (
                      <div key={s.skillName}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{s.skillName.replace(/_/g, ' ')}</span>
                          <span className="text-xs font-mono text-gray-600">${s.costUsd.toFixed(4)}</span>
                        </div>
                        <MiniBar value={s.calls} max={maxSkillCalls} color="bg-purple-400" />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
