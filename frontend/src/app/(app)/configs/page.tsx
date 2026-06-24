'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Loader2, Plus, Zap, GitCompare } from 'lucide-react';
import { aiGatewayApi, configsApi, promptsApi, promptCompareApi } from '@/lib/api';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import type { CreatePromptVersionRequest } from '@/types/api';

type ConfigTab = 'providers' | 'gates' | 'prompts' | 'secrets';

const PROVIDER_LIST = [
  { id: 'openai', label: 'OpenAI', models: ['gpt-4.1-mini', 'gpt-4o', 'gpt-4-turbo'] },
  { id: 'anthropic', label: 'Anthropic', models: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-8'] },
];

const SKILL_NAMES = [
  'requirement_reader',
  'requirement_quality_checker',
  'gap_detector',
  'requirement_rewriter',
  'testcase_generator',
  'coverage_checker',
];

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<ConfigTab>('providers');

  return (
    <div className="p-8">
      <PageHeader title="Cấu hình hệ thống" subtitle="Providers, quality gates, và prompt versions" />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Tab nav */}
        <div className="flex gap-1 border-b mb-6">
          {([
            { id: 'providers', label: 'AI Providers' },
            { id: 'gates', label: 'Quality Gates' },
            { id: 'prompts', label: 'Prompt Versions' },
            { id: 'secrets', label: 'Secrets' },
          ] as { id: ConfigTab; label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'providers' && <ProvidersTab />}
        {activeTab === 'gates' && <GatesTab />}
        {activeTab === 'prompts' && <PromptsTab />}
        {activeTab === 'secrets' && <SecretsTab />}
      </div>
    </div>
  );
}

// ── Providers tab ────────────────────────────────────────────────────────────

function ProvidersTab() {
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; message: string } | null>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});

  async function testProvider(id: string) {
    setTesting((p) => ({ ...p, [id]: true }));
    try {
      const result = await aiGatewayApi.testConnection(id);
      setTestResults((p) => ({
        ...p,
        [id]: { ok: result.ok, message: result.ok ? `OK · ${result.models.slice(0, 2).join(', ')}` : 'Kết nối thất bại' },
      }));
    } catch (e) {
      setTestResults((p) => ({ ...p, [id]: { ok: false, message: e instanceof Error ? e.message : 'Lỗi kết nối' } }));
    } finally {
      setTesting((p) => ({ ...p, [id]: false }));
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <p className="text-xs text-muted-foreground">
        API keys đọc từ biến môi trường (<code>OPENAI_API_KEY</code>, <code>ANTHROPIC_API_KEY</code>).
      </p>
      {PROVIDER_LIST.map(({ id, label, models }) => {
        const result = testResults[id];
        return (
          <Card key={id} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{models.join(' · ')}</p>
              {result && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${result.ok ? 'text-green-600' : 'text-destructive'}`}>
                  {result.ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                  {result.message}
                </p>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => testProvider(id)} disabled={testing[id]}>
              {testing[id] ? <Loader2 size={13} className="animate-spin" /> : 'Test kết nối'}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}

// ── Gates tab ────────────────────────────────────────────────────────────────

function GatesTab() {
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState('');
  const [minScore, setMinScore] = useState(70);
  const [blockGaps, setBlockGaps] = useState(true);
  const [saved, setSaved] = useState(false);

  useQuery({
    queryKey: ['gate-config', projectId],
    queryFn: () => configsApi.getGate(projectId),
    enabled: !!projectId,
    select: (data) => {
      if (data) {
        setMinScore(data.contentJson.minQualityScore);
        setBlockGaps(data.contentJson.blockIfOpenGaps);
      }
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      configsApi.upsertGate(projectId, { minQualityScore: minScore, blockIfOpenGaps: blockGaps }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-config', projectId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <p className="text-xs text-muted-foreground">
        Cấu hình gate cho từng dự án. Nhập Project ID để load và chỉnh sửa.
      </p>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Project ID</label>
        <input
          type="text"
          placeholder="Nhập project ID..."
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <Card className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium">Điểm chất lượng tối thiểu</label>
          <p className="text-xs text-muted-foreground mt-0.5">Yêu cầu không đủ điểm sẽ cảnh báo khi duyệt</p>
          <div className="flex items-center gap-3 mt-2">
            <input
              type="range"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="text-sm font-bold w-8 text-right">{minScore}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Chặn khi còn gap OPEN</label>
            <p className="text-xs text-muted-foreground mt-0.5">Yêu cầu override nếu gap chưa giải quyết</p>
          </div>
          <button
            onClick={() => setBlockGaps((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              blockGaps ? 'bg-primary' : 'bg-muted border border-border'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                blockGaps ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} disabled={!projectId}>
          {saved ? '✓ Đã lưu' : 'Lưu cấu hình'}
        </Button>
      </Card>
    </div>
  );
}

// ── Prompts tab ──────────────────────────────────────────────────────────────

function PromptsTab() {
  const queryClient = useQueryClient();
  const [selectedSkill, setSelectedSkill] = useState(SKILL_NAMES[0]);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState<Partial<CreatePromptVersionRequest>>({});
  const [compareIds, setCompareIds] = useState<{ a: string; b: string } | null>(null);
  const [compareResult, setCompareResult] = useState<null | {
    a: { versionNo: number }; b: { versionNo: number };
    diff: { type: 'equal' | 'removed' | 'added'; line: string }[];
  }>(null);
  const [comparing, setComparing] = useState(false);

  const { data: prompts, isLoading } = useQuery({
    queryKey: ['prompt-versions', selectedSkill],
    queryFn: () => promptsApi.list(selectedSkill),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      promptsApi.create({ name: selectedSkill, content: draft.content ?? '', notes: draft.notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-versions', selectedSkill] });
      setShowCreate(false);
      setDraft({});
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => promptsApi.activate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prompt-versions', selectedSkill] }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {SKILL_NAMES.map((name) => (
            <button
              key={name}
              onClick={() => setSelectedSkill(name)}
              className={`text-xs rounded-md border px-3 py-1.5 transition-colors ${
                selectedSkill === name
                  ? 'border-primary bg-primary/5 text-primary font-medium'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {name.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {compareIds && (
            <Button
              size="sm"
              variant="outline"
              loading={comparing}
              onClick={async () => {
                setComparing(true);
                try {
                  const r = await promptCompareApi.compare(compareIds.a, compareIds.b);
                  setCompareResult(r);
                } finally {
                  setComparing(false);
                }
              }}
            >
              <GitCompare size={13} />
              So sánh đã chọn
            </Button>
          )}
          <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
            <Plus size={13} />
            Tạo version mới
          </Button>
        </div>
      </div>

      {showCreate && (
        <Card className="flex flex-col gap-3">
          <p className="text-sm font-medium">
            Prompt mới cho <code className="bg-muted px-1 rounded text-xs">{selectedSkill}</code>
          </p>
          <textarea
            rows={8}
            placeholder="Nội dung prompt... (dùng {{variable}} cho biến động)"
            value={draft.content ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
            className="rounded-md border border-input bg-background px-3 py-2 text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
          <input
            type="text"
            placeholder="Ghi chú (tùy chọn)"
            value={draft.notes ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
              disabled={!draft.content?.trim()}
            >
              Tạo
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowCreate(false);
                setDraft({});
              }}
            >
              Hủy
            </Button>
          </div>
        </Card>
      )}

      {/* Compare result */}
      {compareResult && (
        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">
              So sánh v{compareResult.a.versionNo} → v{compareResult.b.versionNo}
            </p>
            <button onClick={() => { setCompareResult(null); setCompareIds(null); }} className="text-xs text-muted-foreground hover:text-foreground">Đóng</button>
          </div>
          <div className="rounded-md border overflow-auto max-h-64 font-mono text-xs">
            {compareResult.diff.map((line, i) => (
              <div key={i} className={`px-3 py-0.5 ${
                line.type === 'removed' ? 'bg-red-50 text-red-700' :
                line.type === 'added' ? 'bg-green-50 text-green-700' : 'text-gray-600'
              }`}>
                {line.type === 'removed' ? '− ' : line.type === 'added' ? '+ ' : '  '}
                {line.line}
              </div>
            ))}
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
        </div>
      ) : !prompts?.length ? (
        <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          Chưa có prompt version nào cho skill này.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {prompts.map((p) => {
            const isSelA = compareIds?.a === p.id;
            const isSelB = compareIds?.b === p.id;
            return (
            <Card key={p.id} className={`flex flex-col gap-2 ${isSelA || isSelB ? 'ring-2 ring-primary/40' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    title="Chọn để so sánh"
                    onClick={() => {
                      setCompareResult(null);
                      if (isSelA) { setCompareIds((c) => c ? { a: '', b: c.b } : null); return; }
                      if (isSelB) { setCompareIds((c) => c ? { a: c.a, b: '' } : null); return; }
                      if (!compareIds?.a) setCompareIds((c) => ({ a: p.id, b: c?.b ?? '' }));
                      else setCompareIds((c) => ({ a: c?.a ?? '', b: p.id }));
                    }}
                    className={`text-xs px-1.5 py-0.5 rounded border font-mono transition-colors ${
                      isSelA ? 'border-blue-500 bg-blue-50 text-blue-600' :
                      isSelB ? 'border-purple-500 bg-purple-50 text-purple-600' :
                      'border-gray-200 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    {isSelA ? 'A' : isSelB ? 'B' : '□'}
                  </button>
                  <span className="text-xs font-mono text-muted-foreground">v{p.versionNo}</span>
                  {p.isActive && (
                    <Badge variant="success">
                      <Zap size={9} className="mr-0.5" />
                      Đang dùng
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                  {!p.isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => activateMutation.mutate(p.id)}
                      loading={activateMutation.isPending}
                    >
                      Kích hoạt
                    </Button>
                  )}
                </div>
              </div>
              {p.notes && <p className="text-xs text-muted-foreground italic">{p.notes}</p>}
              <pre className="text-xs bg-muted rounded-md p-3 whitespace-pre-wrap max-h-32 overflow-y-auto font-mono">
                {p.content}
              </pre>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Secrets tab (A3.1) ───────────────────────────────────────────────────────

interface SecretMeta { name: string; envKey: string; masked: string; configured: boolean; rotatedAt: string | null }

function SecretsTab() {
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [rotated, setRotated] = useState<Record<string, string>>({});

  const { data: secrets, isLoading, refetch } = useQuery<SecretMeta[]>({
    queryKey: ['secrets'],
    queryFn: () => apiClient.get<SecretMeta[]>('/configs/secrets').then((r) => r.data),
    staleTime: 60_000,
  });

  async function handleRotate(name: string) {
    setRotatingId(name);
    try {
      const { data } = await apiClient.post<{ rotatedAt: string }>(`/configs/secrets/${name}/rotate`);
      setRotated((p) => ({ ...p, [name]: data.rotatedAt }));
      void refetch();
    } catch {
      // error surfaced by apiClient interceptor
    } finally {
      setRotatingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <p className="text-xs text-muted-foreground">
        Secrets được đọc từ environment variables. Nhấn Rotate để đánh dấu secret cần thay thế.
      </p>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Secret</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Env var</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Giá trị</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rotated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {secrets?.map((s) => (
                <tr key={s.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs font-mono font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{s.envKey}</td>
                  <td className="px-4 py-3">
                    {s.configured ? (
                      <Badge variant="success">{s.masked}</Badge>
                    ) : (
                      <Badge variant="muted">Chưa cấu hình</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {(rotated[s.name] ?? s.rotatedAt)
                      ? new Date(rotated[s.name] ?? s.rotatedAt!).toLocaleString('vi-VN')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!s.configured || rotatingId === s.name}
                      loading={rotatingId === s.name}
                      onClick={() => handleRotate(s.name)}
                    >
                      Rotate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
