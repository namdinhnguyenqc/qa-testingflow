'use client';

import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CheckSquare, Square, Minus, Check, X, Pencil } from 'lucide-react';
import { testcasesApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { Priority, TestcaseStatus, TestCase } from '@/types/api';

const PRIORITY_VARIANT: Record<Priority, 'danger' | 'warning' | 'info' | 'muted'> = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'muted',
};

const STATUS_VARIANT: Record<TestcaseStatus, 'success' | 'warning' | 'danger' | 'info' | 'muted'> = {
  DRAFT: 'muted',
  READY: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
  NEEDS_REVIEW: 'warning',
};

interface Props {
  testcaseSetId: string | null;
}

interface EditState {
  id: string;
  title: string;
  expectedResult: string;
  status: TestcaseStatus;
}

export function TabTestcaseReview({ testcaseSetId }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<TestcaseStatus | 'ALL'>('ALL');
  const [editing, setEditing] = useState<EditState | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: testcaseSet, isLoading } = useQuery({
    queryKey: ['testcase-set', testcaseSetId],
    queryFn: () => testcasesApi.getSet(testcaseSetId!),
    enabled: !!testcaseSetId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: EditState) => testcasesApi.updateCase(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testcase-set', testcaseSetId] });
      setEditing(null);
    },
  });

  const bulkMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: TestcaseStatus }) =>
      Promise.all(ids.map((id) => testcasesApi.updateCase(id, { status }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testcase-set', testcaseSetId] });
      setSelectedIds(new Set());
    },
  });

  const quickStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TestcaseStatus }) =>
      testcasesApi.updateCase(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testcase-set', testcaseSetId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map((id) => testcasesApi.deleteCase(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testcase-set', testcaseSetId] });
      setSelectedIds(new Set());
    },
  });

  const testCases = testcaseSet?.testCases ?? [];
  const modules = [...new Set(testCases.map((t) => t.module).filter(Boolean))] as string[];

  const filtered = testCases.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.externalId.toLowerCase().includes(search.toLowerCase());
    const matchModule = !filterModule || t.module === filterModule;
    const matchPriority = filterPriority === 'ALL' || t.priority === filterPriority;
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchSearch && matchModule && matchPriority && matchStatus;
  });

  const filteredIds = filtered.map((t) => t.id);
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const someSelected = filteredIds.some((id) => selectedIds.has(id));
  const selectedCount = [...selectedIds].filter((id) => filteredIds.includes(id)).length;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function bulkApply(status: TestcaseStatus) {
    const ids = [...selectedIds].filter((id) => filteredIds.includes(id));
    bulkMutation.mutate({ ids, status });
  }

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });
  const useVirtual = filtered.length > 50;

  return (
    <div className="p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold">Review testcase</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {testCases.length} testcase{testcaseSet?.versionNo ? ` · Phiên bản v${testcaseSet.versionNo}` : ''}
          {useVirtual && <span className="ml-1 text-blue-500">(virtual scroll)</span>}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Tìm theo tiêu đề hoặc ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {modules.length > 0 && (
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none"
          >
            <option value="">Tất cả module</option>
            {modules.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as Priority | 'ALL')}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none"
        >
          <option value="ALL">Tất cả ưu tiên</option>
          {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Priority[]).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as TestcaseStatus | 'ALL')}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none"
        >
          <option value="ALL">Tất cả trạng thái</option>
          {(['DRAFT', 'READY', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW'] as TestcaseStatus[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-md border border-primary/30 bg-primary/5 px-4 py-2">
          <span className="text-xs font-medium text-primary">{selectedCount} đã chọn</span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkApply('APPROVED')}
              loading={bulkMutation.isPending}
            >
              Duyệt
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkApply('REJECTED')}
              loading={bulkMutation.isPending}
            >
              Từ chối
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkApply('NEEDS_REVIEW')}
              loading={bulkMutation.isPending}
            >
              Cần xem lại
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
            >
              Bỏ chọn
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                const ids = [...selectedIds].filter((id) => filteredIds.includes(id));
                deleteMutation.mutate(ids);
              }}
              loading={deleteMutation.isPending}
            >
              Xóa
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" /></div>
      ) : !testcaseSetId ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          Chưa có bộ testcase. Vào tab "Sinh testcase" để tạo.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          Không tìm thấy testcase phù hợp.
        </div>
      ) : (
        <div ref={tableContainerRef} className="rounded-md border overflow-auto bg-white" style={{ maxHeight: useVirtual ? 520 : undefined }}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 w-8">
                  <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground">
                    {allSelected ? (
                      <CheckSquare size={14} className="text-primary" />
                    ) : someSelected ? (
                      <Minus size={14} className="text-primary" />
                    ) : (
                      <Square size={14} />
                    )}
                  </button>
                </th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-28">ID</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Tiêu đề</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-24">Module</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-20">Ưu tiên</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-24">Trạng thái</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-24">Yêu cầu</th>
                <th className="px-3 py-2 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y" style={useVirtual ? { height: rowVirtualizer.getTotalSize() } : undefined}>
              {(useVirtual ? rowVirtualizer.getVirtualItems().map((vRow) => filtered[vRow.index]) : filtered).map((tc) => {
                const isEditing = editing?.id === tc.id;
                const isExpanded = expandedId === tc.id;
                const isSelected = selectedIds.has(tc.id);
                return (
                  <>
                    <tr
                      key={tc.id}
                      className={cn(
                        'hover:bg-muted/20',
                        isEditing && 'bg-primary/5',
                        isSelected && 'bg-blue-50/50',
                        isExpanded && !isSelected && 'bg-muted/10',
                      )}
                    >
                      <td className="px-3 py-2">
                        <button onClick={() => toggleOne(tc.id)} className="text-muted-foreground hover:text-foreground">
                          {isSelected ? <CheckSquare size={13} className="text-primary" /> : <Square size={13} />}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-xs font-mono text-muted-foreground">{tc.externalId}</td>
                      <td className="px-3 py-2 text-xs">
                        {isEditing ? (
                          <input
                            className="h-7 w-full rounded border border-input px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            value={editing.title}
                            onChange={(e) => setEditing((prev) => prev && { ...prev, title: e.target.value })}
                          />
                        ) : (
                          <button
                            className="text-left hover:text-primary"
                            onClick={() => setExpandedId(isExpanded ? null : tc.id)}
                          >
                            {tc.title}
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{tc.module}</td>
                      <td className="px-3 py-2">
                        <Badge variant={PRIORITY_VARIANT[tc.priority]}>{tc.priority}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <select
                            value={editing.status}
                            onChange={(e) =>
                              setEditing((prev) => prev && { ...prev, status: e.target.value as TestcaseStatus })
                            }
                            className="h-7 rounded border border-input px-1 text-xs focus:outline-none"
                          >
                            {(['DRAFT', 'READY', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW'] as TestcaseStatus[]).map(
                              (s) => (
                                <option key={s} value={s}>{s}</option>
                              ),
                            )}
                          </select>
                        ) : (
                          <Badge variant={STATUS_VARIANT[tc.status]}>{tc.status}</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {tc.requirementRefs.join(', ')}
                      </td>
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              loading={updateMutation.isPending}
                              onClick={() => updateMutation.mutate(editing)}
                            >
                              Lưu
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                              Hủy
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1 items-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 px-2"
                              title="Duyệt"
                              onClick={() => quickStatusMutation.mutate({ id: tc.id, status: 'APPROVED' })}
                              loading={quickStatusMutation.isPending && quickStatusMutation.variables?.id === tc.id}
                            >
                              <Check size={13} />
                              <span className="text-xs">Duyệt</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                              title="Từ chối"
                              onClick={() => quickStatusMutation.mutate({ id: tc.id, status: 'REJECTED' })}
                              loading={quickStatusMutation.isPending && quickStatusMutation.variables?.id === tc.id}
                            >
                              <X size={13} />
                              <span className="text-xs">Từ chối</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="px-2"
                              title="Sửa"
                              onClick={() =>
                                setEditing({
                                  id: tc.id,
                                  title: tc.title,
                                  expectedResult: tc.expectedResult,
                                  status: tc.status,
                                })
                              }
                            >
                              <Pencil size={13} />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {isExpanded && !isEditing && (
                      <tr key={`${tc.id}-expand`} className="bg-muted/10">
                        <td colSpan={8} className="px-6 py-3">
                          <div className="flex gap-6 text-xs">
                            <div className="flex-1">
                              <p className="font-medium text-muted-foreground mb-1">Điều kiện tiên quyết</p>
                              <p>{tc.preconditions ?? '—'}</p>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-muted-foreground mb-1">Các bước</p>
                              <ol className="list-decimal list-inside space-y-0.5">
                                {tc.steps.map((s, i) => <li key={i}>{s}</li>)}
                              </ol>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-muted-foreground mb-1">Kết quả mong đợi</p>
                              <p>{tc.expectedResult}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
