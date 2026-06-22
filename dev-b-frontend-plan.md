# Dev B — Frontend + BFF Glue

> Plan copy-paste-ready. Mỗi task có **Build / Dep / DoD** (Definition of Done). Tick `[x]` khi xong.
> Bạn không bị chặn bởi Dev A: dùng **mock từ OpenAPI** (MSW) cho tới khi endpoint thật sẵn.

## Context

Hệ thống: **config-driven AI QA platform**. Người dùng đi qua stepper:
`Input → Analyze → Gap Review → Final Requirement → Testcase → Coverage → Export.`
Bạn build toàn bộ UI (các tab trong Project Detail + Config module + Dashboard + Audit) và lớp API client/state.

## Stack (đã chốt)

- **Next.js (App Router)** + React + TypeScript; data fetching/cache bằng **TanStack Query**.
- BFF: Next.js **route handlers / server actions** làm lớp mỏng cho auth/session + proxy sang **NestJS** API (không để client cầm trực tiếp secret/key).
- API client typed: sinh type từ OpenAPI (`openapi-typescript` hoặc `orval`).
- Mock API: **MSW** sinh từ OpenAPI để dev độc lập, switch sang NestJS thật qua env.
- Bảng testcase: **dùng grid library** (TanStack Table / AG Grid) — đừng tự build grid.

## Quy ước (bắt buộc đọc trước khi code)

- **Contract-first:** import type + endpoint từ `/contracts` (OpenAPI + JSON schema §12). Không tự đoán field.
- **Async-aware UI:** các bước AI chạy nền → mọi tab phải có loading/job-status (poll hoặc SSE), không block UI.
- **Human-in-the-loop:** nút approve ở 3 chỗ (resolve gap, approve requirement, approve testcase set) phải rõ ràng, có xác nhận.
- Sentence case, error/empty states đầy đủ (§14, §15). Sprint 2 tuần, demo cuối sprint.

## Đã CHỐT (áp dụng xuyên suốt)

| # | Quyết định | Chi tiết |
|---|---|---|
| 1 | Gate = **warning + override** | Không block cứng. Hiện warning rõ + nút override ghi label "Draft with unresolved risk". Áp cho approve requirement (B1.6) và coverage (B1.9). |
| 2 | Coverage % **loại Not Testable** khỏi mẫu số | Hiển thị Not Testable riêng, không tính vào %. |
| 3 | `testcase_sets` **có version** | UI cần version selector nếu user regenerate nhiều lần. |
| 4 | File size = **per-tool** | Hiển thị limit đúng theo loại file khi upload: image ≤ 10MB, xlsx ≤ 20MB, doc ≤ 30MB. |
| 5 | Default language = **Vietnamese** | UI label/output mặc định VI. Project config có thể đổi sang EN. |
| 6 | Phase 1 = **single user, auth mỏng** | Login đơn giản, không phân role. Gác config nhạy cảm (AUTH-AC-05) sang Phase 3. |

---

## Phase 0 — Foundation (2 tuần)

- [ ] **B0.1 FE skeleton**
  - Build: Next.js App Router scaffold (route groups, layouts), design system/tokens, layout shell, auth guard (middleware).
  - DoD: app chạy, điều hướng giữa các route rỗng.
- [ ] **B0.2 API client + mock (co-own contract với Dev A)**
  - Build: type sinh từ OpenAPI (`openapi-typescript`/`orval`); MSW mock theo schema §12; route handler proxy mỏng sang NestJS.
  - DoD: dev được mọi màn bằng mock, switch sang NestJS thật qua 1 cờ env.
- [ ] **B0.3 Login (mỏng) + Dashboard shell**
  - Build: login form (§8.1), dashboard summary cards + empty state (§8.2, §15).
  - DoD: login redirect Dashboard; chưa có project → empty state.
- [ ] **B0.4 Project List + Create/Edit**
  - Build: list + search/filter/sort (§8.3), form tạo/sửa + domain/language/default config (§8.4), wire API thật.
  - DoD: tạo project → redirect Project Detail; required field thiếu không cho save.

**Milestone P0:** Project CRUD chạy trên API thật.

---

## Phase 1 — Core flow / MVP1 (6 tuần)

- [ ] **B1.1 Project Detail layout**
  - Build: header + stepper 7 bước + tab nav + step status (§8.5).
  - DoD: chuyển tab giữ state; status hiển thị đúng.
- [ ] **B1.2 Tab Input**
  - Build: upload (drag/drop), paste text, Figma URL, UI screenshot; artifact table; parse status; error states (§8.6, §14.1).
  - DoD: upload/parse hiển thị status; file lỗi show reason; Figma lỗi chỉ warning.
- [ ] **B1.3 Job-status hook (reusable)**
  - Build: hook poll/SSE theo `workflow_runs` status (§7.2) cho mọi bước AI.
  - Dep: B0.2.
  - DoD: 1 hook dùng lại được ở Analyze/Gap/Rewrite/Generate/Coverage.
- [ ] **B1.4 Tab Analyze**
  - Build: source preview + structured requirement items (edit/add/delete) + quality score panel (§8.7).
  - DoD: edit item lưu được; score hiển thị breakdown; re-analyze gọi lại job.
- [ ] **B1.5 Tab Gap Review**
  - Build: summary cards, gap table + filter (severity/category/status), detail drawer, resolve/answer/accept/reject (§8.8).
  - DoD: resolve gap cập nhật status; Critical/High chưa resolve → cảnh báo khi approve.
- [ ] **B1.6 Tab Final Requirement**
  - Build: version selector + **diff viewer** + approve + trạng thái lock (§8.9).
  - Dep: chốt block/warn.
  - DoD: xem diff giữa version; approve → requirement lock; unlock → đánh dấu testcase "Needs Review".
- [ ] **B1.7 Tab Testcase Generation**
  - Build: form config (template/language/scope/detail/types/max…) (§8.10).
  - DoD: chỉ approved mới cho generate; submit → tạo job.
- [ ] **B1.8 Testcase Review Table** ⚠️ phần khó nhất
  - Build: grid với inline edit từng cell, filter (module/feature/priority/type/status), search, freeze cột đầu, cột status/confidence (§8.11).
  - DoD: edit cell lưu; filter/search hoạt động; mỗi row trace requirement.
- [ ] **B1.9 Tab Coverage Matrix**
  - Build: summary cards + coverage table + status badge (§8.12).
  - DoD: hiển thị covered/partial/missing/not-testable; missing show warning.
- [ ] **B1.10 Tab Export**
  - Build: export options + trigger + download + history table (§8.13).
  - DoD: export → file tải được; lịch sử export hiển thị; failed show reason.

**Milestone P1:** đi hết stepper Input → Export trên UI.

---

## Phase 2 — Config & robustness / MVP2 (4–6 tuần)

- [ ] **B2.1 Config shell + nav** (§9.1). DoD: điều hướng giữa các nhóm config.
- [ ] **B2.2 Config: AI Providers / Model Policies / Quality Gates**
  - Build: form provider (secret **masked**, nút Test Connection), model policy (primary/fallback), quality gate (threshold/override) (§9.2, §9.3, §9.8).
  - DoD: secret không hiện lại sau lưu; test connection trả kết quả.
- [ ] **B2.3 Config: Prompts / Templates / Skills / Tools**
  - Build: prompt (version + activate), testcase/export template, skills (read/edit), tools (read-only) (§9.4–§9.6, §9.9, §9.10).
  - DoD: chỉ 1 prompt active/name; tool phase=future hiển thị disabled.
- [ ] **B2.4 Testcase table nâng cao**
  - Build: bulk actions (approve/reject/delete/regenerate/export selected) + row actions (regenerate, improve expected, split, duplicate) (§8.11).
  - DoD: bulk + per-row chạy đúng; regenerate giữ trace requirement.
- [ ] **B2.5 Audit Log screen** (§8.14) + filter. DoD: filter theo project/user/action; không hiện secret.
- [ ] **B2.6 Figma context UI + polish** — Figma input, coverage gate warning, hoàn thiện error/empty states (§14, §15). DoD: Figma lỗi không block; states đầy đủ.
- [ ] **B2.7 Cost indicator** trên Dashboard (basic, nếu cost tracking bật).

**Milestone P2:** admin cấu hình hệ thống qua UI.

---

## Phase 3 — Scale & polish / MVP3 (4 tuần)

- [ ] **B3.1 AI Cost Dashboard** (charts theo project/provider/model) (§17.2).
- [ ] **B3.2 Prompt version compare UI.**
- [ ] **B3.3 Virtualized grid** cho testcase set lớn (perf).
- [ ] **B3.4 Advanced audit filter + accessibility pass** (+ workspace/role UI nếu chốt cần).

**Milestone P3:** UI đạt Functional DoD (§19.1), mượt với data lớn.

---

## Điểm sync với Dev A

- Cuối P0: contract v1 freeze; mock của bạn khớp endpoint thật.
- Thứ tự bạn cần endpoint (xin Dev A theo thứ tự này): project CRUD → artifact/parse → analyze/quality → gap → rewrite/diff/approve → testcase generate → coverage → export.
- Khi schema đổi: cập nhật type từ `/contracts`, chạy lại mock.
