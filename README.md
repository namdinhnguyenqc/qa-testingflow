# QAFlow AI — AI QA Workflow & Skill Platform

QAFlow AI là nền tảng web hỗ trợ quy trình thiết kế kịch bản kiểm thử (QA Workflow) tự động bằng AI, dựa trên các skill versioned bằng Markdown. 

Hệ thống cho phép tester dán mô tả requirement, tải lên tài liệu PRD hoặc hình ảnh Figma screenshot, chạy AI phân tích gap/clarification, thống nhất hiểu biết về tính năng (understanding) rồi mới sinh test kịch bản hoàn chỉnh và xuất Excel.

---

## 1. Tech Stack Overview

- **Core**: Next.js App Router (14+), React, TypeScript (Strict), Tailwind CSS, Radix UI (dialog, dropdown, label, etc.)
- **Forms & Tables**: React Hook Form, Zod, TanStack Table
- **DB & Storage**: Supabase Postgres (relational & JSONB data) + Private Supabase Storage (`qa-inputs` bucket)
- **Validation**: Zod (app boundary/env), AJV (future model artifact JSON Schema validation)
- **Unit/E2E Tests**: Vitest + Playwright Test

---

## Platform Architecture Update

QAFlow AI is a multi-workflow QA platform. A shared Requirement Understanding Layer feeds Manual QA, Automation QA, API QA, Performance QA, and common Evaluation/History/Reports.

The core engine owns workflow execution, persistence, validation, security, UI, and integration boundaries. Team-specific behavior stays in Git-versioned skills, schemas, and templates under `qa-core/`: `.md` skills, `.json` schemas, and templates. Those files define how to read requirements, format testcases, follow automation conventions, and apply API/performance rules.

Model integration is provider-agnostic. Phase 01B adds real provider verification through API keys without locking the product to Claude, Codex, or a single vendor. The OpenAI-compatible adapter can be used with DeepSeek or compatible providers; a Claude-native adapter is optional/future. Team and production mode must not fall back to mock AI output.

MCP is a tool protocol, not a model and not an output framework. Browser exploration should go through a `BrowserToolAdapter`; `PlaywrightMcpAdapter` is the first provider and `SeleniumMcpAdapter` can be added later. Workflow code should not call Playwright MCP directly.

---

## 2. Local Development Setup

Làm theo các bước sau để chạy dự án dưới máy local:

### Bước 2.1: Cài đặt Dependencies
```bash
# Cài đặt pnpm toàn cục nếu chưa có
npm install -g pnpm

# Cài đặt dependencies (bỏ qua scripts build nếu bị chặn)
pnpm install --ignore-scripts
```

### Bước 2.2: Thiết lập Biến môi trường
Sao chép file `.env.example` thành `.env.local` và điền các khóa kết nối Supabase của bạn:
```bash
cp .env.example .env.local
```
Mở file `.env.local` và cập nhật:
- `NEXT_PUBLIC_SUPABASE_URL`: Đường dẫn URL của dự án Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon/public key an toàn cho client.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key chỉ dùng phía server (được dùng để bypass RLS).

### Bước 2.3: Áp dụng Database Schema
Chạy script SQL khởi tạo trong thư mục `supabase/migrations/20260525000000_init_schema.sql` trên Supabase Database SQL Editor để tạo 3 bảng nền tảng:
- `projects`
- `features`
- `input_sources`

### Bước 2.4: Cấu hình Supabase Storage
1. Đi tới Supabase console $\rightarrow$ Storage.
2. Tạo mới một bucket tên là `qa-inputs`.
3. Bật cấu hình ở chế độ **Private** (mặc định) để bảo vệ tài liệu đầu vào an toàn.

### Bước 2.5: Khởi động Local Server
```bash
pnpm dev
```
Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000)

---

## 3. Scripts Command Khả dụng

| Command | Mục đích |
|---|---|
| `pnpm dev` | Khởi chạy máy chủ phát triển local |
| `pnpm build` | Biên dịch dự án phục vụ production build |
| `pnpm lint` | Kiểm tra cú pháp lỗi code |
| `pnpm typecheck` | Kiểm tra type-safety của TypeScript |
| `pnpm test` | Chạy bộ unit tests với Vitest |
| `pnpm test:e2e` | Chạy bộ kiểm thử E2E với Playwright |

---

## 4. Kiểm thử & Xác minh luồng Phase 00

Để chạy bộ unit tests:
```bash
pnpm test
```

Bộ unit tests kiểm tra:
- Khả năng tự chuyển trạng thái của Feature (`determineFeatureStatus`) từ `DRAFT` sang `INPUT_READY` khi thỏa mãn điều kiện requirement.
- Tính hợp lệ của các bước chuyển đổi trạng thái (`isValidTransition`).
- Validation schema của Projects và Features bằng Zod.
