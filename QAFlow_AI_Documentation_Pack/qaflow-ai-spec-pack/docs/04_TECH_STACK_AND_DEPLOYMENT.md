# Tech Stack & Deployment README — QAFlow AI

## 1. Stack chốt cho MVP

| Layer | Technology | Lý do chọn |
|---|---|---|
| Language | TypeScript strict mode | Một ngôn ngữ xuyên frontend/backend, giảm sai kiểu dữ liệu artifact/schema |
| Web framework | Next.js App Router | Full-stack web, route handlers/server actions, deploy thuận lợi |
| Styling/UI | Tailwind CSS + shadcn/ui | Dựng dashboard/form/table nhanh, component rõ ràng |
| Forms | React Hook Form + Zod | Form input/validation maintainable |
| Table | TanStack Table | Testcase table cần filter/edit/render động |
| DB | Supabase Postgres | Persistent relational/jsonb data cho project/artifact/testcase |
| File storage | Supabase Storage private buckets | Docs/Figma/Excel file lưu ngoài Vercel runtime |
| AI abstraction | `ModelAdapter` + provider-specific adapters | Switch model, không coupling UI vào một API |
| AI structured validation | JSON Schema + AJV; Zod ở app boundary | Ép output cùng format và validate runtime |
| Skills/workflows | Markdown files trong GitHub repo | Version/review/rollback đơn giản |
| Excel | ExcelJS | Export cột/format testcase có kiểm soát |
| Unit test | Vitest | Nhanh cho TypeScript logic/schema/services |
| Platform E2E test | Playwright Test | Test chính web platform |
| Hosting MVP | Vercel + Supabase | Dễ deploy PoC từ GitHub |
| Package manager | pnpm | Workspace/dependency management nhanh, lockfile ổn định |

---

## 2. Cảnh báo quan trọng về hosting free

- Vercel Hobby phù hợp để prototype/cá nhân thử nghiệm. Theo tài liệu hiện hành của Vercel, Hobby bị giới hạn cho **personal/non-commercial use**; nếu website được dùng cho công việc tạo giá trị thương mại hoặc nội bộ doanh nghiệp, phải kiểm tra và chọn plan/hosting phù hợp trước khi đưa vào sử dụng thực tế.
- Supabase Free phù hợp MVP dung lượng nhỏ; quota/giới hạn có thể thay đổi và phải kiểm tra lại ở thời điểm triển khai.
- Browser automation/regression/MCP không chạy trong web request MVP; dùng worker host riêng khi đến phase tương ứng.

---

## 3. Stack theo phase

| Phase | Web/control plane | Persistence | Worker/tools |
|---:|---|---|---|
| 00–02 | Next.js/Vercel | Supabase DB/Storage | Không cần worker |
| 03 | Next.js/Vercel | Supabase | Worker + Playwright MCP |
| 04 | Next.js/Vercel | Supabase + Git repo ref | Worker + Playwright Test/POM |
| 05 | Dashboard + webhook | Supabase evidence/report | Worker/GitHub Actions |
| 06 | API workflow UI | Supabase | API runner worker |
| 07 | Performance UI | Supabase | k6 worker riêng |
| 08 | Authorized anti-bot UI | Supabase/audit metadata | Controlled runtime only |

---

## 4. Model integration strategy

### MVP recommended

- Implement `ModelAdapter` interface.
- Start with one server-accessible provider/endpoint.
- Add provider/model selection UI through config.
- Do not let browser client hold model API key.

### 9Router usage decision

9Router can act as an OpenAI-compatible routing gateway for coding tools/models. In a local development workflow, endpoint may be on local machine. A Vercel-deployed website cannot rely on developer `localhost`; use 9Router only when it is hosted on a reachable secured server or when execution is local/worker-controlled.

---

## 5. Recommended repository structure

```text
qaflow-ai/
├── AGENTS.md
├── docs/
├── tasks/
├── qa-core/
│   ├── workflows/
│   ├── skills/
│   ├── schemas/
│   ├── templates/
│   └── examples/
├── src/
│   ├── app/
│   ├── components/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── lib/
├── supabase/migrations/
├── tests/
├── public/
├── .env.example
├── package.json
└── README.md
```

---

## 6. Initial dependencies đề xuất

> Version cụ thể phải được lock ở thời điểm khởi tạo repo; không copy version cũ từ tài liệu này.

```text
Production:
- next, react, react-dom
- @supabase/supabase-js
- zod
- ajv, ajv-formats
- react-hook-form, @hookform/resolvers
- @tanstack/react-table
- exceljs
- react-markdown (khi hiển thị markdown)

UI:
- tailwindcss
- shadcn/ui generated components
- lucide-react

Development/testing:
- typescript
- eslint
- prettier hoặc biome (chọn một, không trộn tùy tiện)
- vitest
- @testing-library/react nếu component tests cần
- @playwright/test
```

---

## 7. Environment Variables

```env
# App
NEXT_PUBLIC_APP_NAME=QAFlow AI
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_BUILD_COMMIT=local

# Supabase — public-safe client values
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Supabase — SERVER ONLY
SUPABASE_SERVICE_ROLE_KEY=

# AI configuration — SERVER ONLY
AI_PROVIDER_TYPE=
AI_PROVIDER_BASE_URL=
AI_PROVIDER_API_KEY=
AI_DEFAULT_MODEL=

# Optional: access gate when real team/data begins
APP_ACCESS_MODE=demo
```

### Secret rules

- Không commit `.env.local`.
- `SUPABASE_SERVICE_ROLE_KEY` và `AI_PROVIDER_API_KEY` không bao giờ có prefix `NEXT_PUBLIC_`.
- Log không được in full request chứa tài liệu hoặc secret.

---

## 8. Local Setup Target

```bash
pnpm install
cp .env.example .env.local
# điền Supabase + AI keys
pnpm dev
```

### Minimum scripts cần có trong `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

---

## 9. Vercel Deployment Target

### MVP deployment sequence

```text
1. Tạo GitHub repository.
2. Connect project vào Vercel.
3. Tạo Supabase project và apply migrations.
4. Tạo private storage buckets.
5. Thêm environment variables vào Vercel.
6. Deploy preview → test flows với demo data.
7. Deploy production URL chỉ khi security/access gate phù hợp.
```

### Không được làm trên Vercel runtime

- Lưu DB bằng SQLite file trong deployed project.
- Lưu uploaded docs vào filesystem runtime.
- Chạy browser/test suite dài trong API route MVP.
- Gọi gateway `localhost` ở máy cá nhân.

---

## 10. Supabase Configuration Target

### Database

- Postgres tables theo `docs/05_DATA_MODEL_AND_STORAGE.md`.
- Migrations được commit trong `supabase/migrations/`.
- Dữ liệu artifact dùng JSONB có schema version.

### Storage buckets

| Bucket | Visibility | Mục đích |
|---|---|---|
| `qa-inputs` | Private | Requirement, Figma exports, API docs |
| `qa-outputs` | Private | Excel exports, rendered outputs |
| `qa-evidence` | Private; phase sau | Screenshots, traces, reports |

---

## 11. Phase Automation/Worker Tech Decisions

Khi bắt đầu MCP/automation:

| Concern | Decision |
|---|---|
| Browser interaction bởi AI | Microsoft Playwright MCP |
| Actual test execution | Playwright Test + TypeScript |
| Test architecture | Page Object Model + fixtures + test-data separation |
| Code storage | Repo automation riêng theo target project |
| CI | GitHub Actions hoặc pipeline đang dùng của dự án |
| Browser worker host | Container/server host phù hợp long-running process, không mặc định Vercel |
| Evidence retention | Failed-only, giới hạn thời gian |

---

## 12. References cần kiểm tra trước khi implement/deploy

- Next.js App Router: <https://nextjs.org/docs/app>
- Next.js install/TypeScript/system requirements: <https://nextjs.org/docs/app/getting-started/installation>
- Vercel Next.js deployment: <https://vercel.com/docs/frameworks/full-stack/nextjs>
- Vercel Functions: <https://vercel.com/docs/functions>
- Vercel Hobby plan/fair use: <https://vercel.com/docs/plans/hobby>, <https://vercel.com/docs/limits/fair-use-guidelines>
- Supabase Database: <https://supabase.com/docs/guides/database/overview>
- Supabase Storage: <https://supabase.com/docs/guides/storage>
- Supabase Storage pricing/quota: <https://supabase.com/docs/guides/storage/pricing>
- Playwright MCP: <https://playwright.dev/docs/getting-started-mcp>
- Playwright CI: <https://playwright.dev/docs/ci-intro>
- 9Router repository: <https://github.com/decolua/9router>
