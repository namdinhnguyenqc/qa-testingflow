'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';

const ACTION_COLORS: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'muted'> = {
  ARTIFACT_PARSED: 'success',
  REQUIREMENT_ANALYZED: 'success',
  REQUIREMENT_APPROVED: 'success',
  REQUIREMENT_REWRITTEN: 'info',
  GAP_RESOLVED: 'info',
  TESTCASE_GENERATED: 'success',
  TESTCASE_APPROVED: 'success',
  TESTCASE_REJECTED: 'danger',
  EXPORT_CREATED: 'info',
  AI_CALL: 'muted',
  BUDGET_WARNING: 'warning',
  BUDGET_EXCEEDED: 'danger',
};

export default function AuditLogsPage() {
  const [projectId, setProjectId] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityType, setEntityType] = useState('');
  const [dateFrom, setDateFrom] = useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', projectId, actionFilter],
    queryFn: () =>
      auditApi.listAll({
        projectId: projectId || undefined,
        action: actionFilter || undefined,
      }),
    refetchInterval: 30_000,
    select: (data) => {
      let result = data;
      if (entityType) result = result.filter((l) => l.entityType?.toLowerCase().includes(entityType.toLowerCase()));
      if (dateFrom) result = result.filter((l) => new Date(l.createdAt) >= new Date(dateFrom));
      return result;
    },
  });

  return (
    <div className="p-8">
      <PageHeader title="Audit Log" subtitle="Lịch sử hoạt động hệ thống" />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Project ID..."
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="h-9 w-48 rounded-lg border border-gray-200 bg-white px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm"
          />
          <input
            type="text"
            placeholder="Action (VD: ARTIFACT_PARSED)..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-9 w-64 rounded-lg border border-gray-200 bg-white px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm"
          />
          <input
            type="text"
            placeholder="Entity type..."
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="h-9 w-40 rounded-lg border border-gray-200 bg-white px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title="Từ ngày"
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm"
          />
          {(projectId || actionFilter || entityType || dateFrom) && (
            <button
              onClick={() => { setProjectId(''); setActionFilter(''); setEntityType(''); setDateFrom(''); }}
              className="h-9 px-3 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50"
            >
              Xóa filter
            </button>
          )}
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : !logs?.length ? (
          <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
            Không có audit log nào phù hợp.
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Thời gian</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Project ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ACTION_COLORS[log.action] ?? 'muted'} className="text-xs">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-medium">{log.entityType}</span>
                      {log.entityId && (
                        <span className="text-muted-foreground ml-1 font-mono">
                          {log.entityId.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {log.projectId ? log.projectId.slice(0, 8) + '…' : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {log.actorId ?? 'system'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {logs && (
          <p className="text-xs text-muted-foreground mt-3">{logs.length} bản ghi · Auto-refresh mỗi 30s</p>
        )}
      </div>
    </div>
  );
}
