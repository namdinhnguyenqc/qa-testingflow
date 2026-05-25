# Phase 00 Specification — Foundation & Persistent Web Skeleton

## 1. Mục tiêu phase

Dựng nền móng kỹ thuật đúng để các phase AI/manual/automation được thêm vào mà không phải đập kiến trúc:

- Next.js web app có layout cơ bản.
- Supabase DB + Storage persistence.
- Project/Feature/Input Source cơ bản.
- Cấu trúc `qa-core/` cho workflow/skill/schema/template.
- Model adapter contract và artifact/run entity skeleton, **chưa cần chạy AI thật** nếu chưa được giao thêm.

---

## 2. Outcome nhìn thấy được

User có thể:

1. Mở web app.
2. Tạo project.
3. Tạo feature Manual Test Design.
4. Nhập requirement text hoặc upload input file.
5. Refresh/mở lại feature và thấy dữ liệu vẫn còn.
6. Xem placeholder stepper cho workflow tương lai.

---

## 3. In Scope

- Bootstrap Next.js/TypeScript/Tailwind/shadcn structure.
- Environment validation và Supabase integration.
- Database migrations: projects, features, input_sources; có thể thêm minimal artifact/run tables nếu task yêu cầu.
- Private storage bucket convention và upload flow.
- Project list/detail/create/edit.
- Feature create/detail/setup/input listing.
- Workflow state enum tối thiểu: `DRAFT`, `INPUT_READY`.
- `qa-core/` folder scaffold và sample Markdown assets.
- Basic tests/build/lint setup.

## 4. Out of Scope

- AI provider call.
- Model selection execution thật ngoài việc lưu selected model text/config.
- Requirement analysis/clarification/testcase.
- Direct Figma integration.
- Authentication/RBAC đầy đủ.
- MCP/automation/regression/performance.

---

## 5. Business Rules

| Rule ID | Rule |
|---|---|
| P00-R01 | Project name bắt buộc, không chỉ chứa whitespace |
| P00-R02 | Feature phải thuộc một project tồn tại |
| P00-R03 | Feature phải có workflow key; MVP mặc định `manual_test_design` |
| P00-R04 | Feature chỉ chuyển `INPUT_READY` khi có requirement text hoặc requirement file hợp lệ |
| P00-R05 | Input upload lưu private storage, metadata lưu DB |
| P00-R06 | Runtime user data không được lưu local file trong app deploy |
| P00-R07 | Không hard delete dữ liệu nếu chưa implement confirmation/recovery rõ; có thể hoãn delete |

---

## 6. UI Deliverables

- App shell/header/sidebar tối thiểu.
- Dashboard/project list.
- Create/Edit Project form.
- Project detail với feature list.
- New Feature form.
- Feature workspace: overview + inputs tab + disabled future stepper.
- Upload/paste input UI với loading/error/empty states.

---

## 7. Technical Deliverables

- Project setup và scripts lint/typecheck/test/build.
- `.env.example` và env validation.
- Supabase client/server adapters.
- Initial migrations.
- Storage upload/download abstraction.
- Domain types/status constants.
- Unit tests cho validation/status rule/path sanitizer.
- E2E happy path tối thiểu với test DB/mock adapter hoặc documented test strategy.

---

## 8. Acceptance Criteria

| AC | Criteria |
|---:|---|
| AC-01 | App khởi chạy local và build thành công |
| AC-02 | User tạo project, dữ liệu persist DB |
| AC-03 | User tạo feature thuộc project và mở lại được |
| AC-04 | User paste requirement text; feature chuyển `INPUT_READY` |
| AC-05 | User upload file hợp lệ; file lưu storage private và metadata hiển thị lại |
| AC-06 | Invalid file/form hiển thị lỗi rõ, không tạo record sai |
| AC-07 | Refresh/reload không mất records |
| AC-08 | Folder `qa-core/` tồn tại và không bị hard-code prompt vào UI |
| AC-09 | Lint/typecheck/test/build pass |

---

## 9. Exit Gate

Chỉ bắt đầu Phase 01 khi persistence, input upload và feature state nền đã đáng tin cậy; không bắt đầu AI workflow khi dữ liệu đầu vào còn dễ mất/sai.
