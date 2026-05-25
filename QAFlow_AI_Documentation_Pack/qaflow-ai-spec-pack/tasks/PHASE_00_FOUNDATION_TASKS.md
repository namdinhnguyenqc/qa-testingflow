# Phase 00 Tasks — Foundation & Persistent Web Skeleton

> Dùng file này làm task list giao cho coding agent. Agent phải đọc `AGENTS.md` và `PHASE_00_FOUNDATION_SPEC.md` trước khi code.

## Task execution rule

- Chỉ thực hiện các task ID được giao.
- Sau mỗi task, chạy validation thích hợp và report files changed.
- Không triển khai AI generation/clarification trong Phase 00.

---

## P00-T01 — Bootstrap project và engineering baseline

### Goal

Khởi tạo codebase Next.js chuẩn để maintain lâu dài.

### Tasks

- Tạo Next.js App Router project dùng TypeScript strict và Tailwind.
- Thiết lập package manager `pnpm` và lockfile.
- Thiết lập cấu trúc source theo kiến trúc trong docs.
- Thiết lập lint/format/typecheck/test/build scripts.
- Tạo `.env.example` và module validate env.
- Thêm `AGENTS.md`, `docs/`, `tasks/`, `qa-core/` vào repo đích.

### Expected files/modules

- `src/app/*`, `src/components/*`, `src/domain/*`, `src/application/*`, `src/infrastructure/*`.
- `package.json`, `tsconfig.json`, lint config, test config.
- `src/lib/env.ts` hoặc tương đương.

### Acceptance checks

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` chạy được.
- Không có provider secret hard-code.

---

## P00-T02 — Supabase configuration và migrations nền

### Goal

Thiết lập persistent DB cho project/feature/input; không dùng SQLite runtime.

### Tasks

- Tạo Supabase client adapter server/browser theo phạm vi cần thiết.
- Tạo migrations cho `projects`, `features`, `input_sources`.
- Khai báo status/workflow constants ở domain layer.
- Tạo repository/service CRUD cần thiết.
- Tạo seed/demo strategy nếu cần, không chứa secret.

### Required tests

- Validate create/read project.
- Validate feature thuộc project.
- Validate feature status ban đầu.

### Do not do

- Không tạo bảng AI runs/testcases phức tạp nếu chưa cần cho UI nền; có thể tạo ở Phase 01.
- Không bật public file access.

---

## P00-T03 — Supabase private storage và input source upload

### Goal

Cho user đưa đầu vào vào feature và lưu bền vững.

### Tasks

- Chuẩn bị bucket `qa-inputs` private và document setup steps.
- Implement upload service server-side.
- Sanitize filename và tạo UUID-based storage path.
- Validate file extension/MIME/size theo allowlist MVP.
- Implement paste requirement text như một input source.
- Render input list/status trong feature workspace.

### Acceptance checks

- Paste text tạo input record và feature đủ điều kiện chuyển `INPUT_READY`.
- Upload file hợp lệ lưu thành công và hiển thị metadata.
- File không hợp lệ bị reject có message rõ.
- Không có public permanent URL leak trên UI.

---

## P00-T04 — Project screens

### Goal

User quản lý project cơ bản.

### Tasks

- Dashboard/project list.
- Create project form có validation.
- Project detail.
- Edit project name/description/default model.
- Empty/loading/error states.

### Acceptance checks

- CRUD trong scope hoạt động và persist sau reload.
- Xóa chỉ làm khi được giao rõ; mặc định hoãn delete.

---

## P00-T05 — Feature setup & workspace shell

### Goal

Tạo nơi làm việc cho từng feature.

### Tasks

- New Feature form: name, description, workflow, selected model.
- Feature detail shell với overview và inputs.
- Workflow stepper hiển thị các bước Manual workflow; chỉ Inputs available trong Phase 00.
- Status badge `DRAFT`/`INPUT_READY`.

### Acceptance checks

- User tạo/open feature được.
- Khi có input tối thiểu, UI/status đúng.
- Step tương lai disabled, không gọi API giả.

---

## P00-T06 — Test coverage và deployment documentation

### Goal

Kết thúc foundation có thể deploy và kiểm tra được.

### Tasks

- Unit tests cho form/state/path validation.
- E2E hoặc integration test luồng create project → feature → input.
- Update README local setup + Supabase setup + Vercel env vars.
- Verify build/deploy preview với demo data.

### Definition of Done Phase 00

- [ ] App build/deploy được.
- [ ] Data/file persistence hoạt động.
- [ ] Core screens usable.
- [ ] Không có AI/automation ngoài scope.
- [ ] Tests và docs cập nhật.
