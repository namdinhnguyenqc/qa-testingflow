'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Loader2, Plus, Zap } from 'lucide-react';
import { aiGatewayApi, configsApi, promptsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import type { CreatePromptVersionRequest } from '@/types/api';

type ConfigTab = 'providers' | 'gates' | 'prompts';

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

      {/* Tab nav */}
      <div className="flex gap-1 border-b mb-6">
        {([
          { id: 'providers', label: 'AI Providers' },
          { id: 'gates', label: 'Quality Gates' },
          { id: 'prompts', label: 'Prompt Versions' },
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
        <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
          <Plus size={13} />
          Tạo version mới
        </Button>
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
          {prompts.map((p) => (
            <Card key={p.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
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
          ))}
        </div>
      )}
    </div>
  );
}
