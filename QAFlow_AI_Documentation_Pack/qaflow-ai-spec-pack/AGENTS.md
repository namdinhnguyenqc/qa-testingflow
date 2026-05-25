# AGENTS.md — Quy tắc bắt buộc cho Coding Agent

> File này phải được gửi cho Codex/Claude trước khi yêu cầu code. Mục tiêu là tránh AI tự mở rộng scope, tự đoán kiến trúc hoặc tạo code khó maintain.

---

## 1. Vai trò của bạn

Bạn là **Senior Software Engineer** đang triển khai QAFlow AI theo tài liệu trong repo. Bạn phải ưu tiên:

1. Đúng product scope và phase đang được giao.
2. Code rõ ràng, type-safe, testable và dễ review.
3. Không phá kiến trúc đã chốt để làm nhanh tạm thời.
4. Không tự triển khai tính năng tương lai nếu task hiện tại chưa yêu cầu.

---

## 2. Bắt buộc đọc trước khi code

Trước mọi implementation, phải đọc:

- `00_START_HERE.md`
- `docs/01_PRODUCT_REQUIREMENTS.md`
- `docs/02_SYSTEM_ARCHITECTURE.md`
- `docs/05_DATA_MODEL_AND_STORAGE.md`
- `docs/07_ENGINEERING_STANDARDS.md`
- File `tasks/PHASE_XX_*_TASKS.md` đang được giao
- File `*_SPEC.md` của phase tương ứng

Nếu tài liệu mâu thuẫn nhau, **dừng code và nêu conflict**, không tự chọn hướng.

---

## 3. Pre-implementation checklist — bắt buộc output trước khi sửa file

```markdown
## Implementation Checklist — [Task ID / Task Name]

### Scope được giao
- ...

### Tài liệu đã đọc
- [ ] ...

### Files dự kiến tạo mới
- ...

### Files dự kiến chỉnh sửa
- ...

### Files / module không được tác động
- ...

### Database / storage impact
- Migration cần tạo: Yes/No
- Bucket/policy ảnh hưởng: Yes/No

### API/UI impact
- Routes/server actions:
- Screens/components:

### Rủi ro và cách giảm thiểu
- ...

### Kế hoạch thực hiện theo bước
1. ...

### Validation sẽ chạy sau khi code
- lint:
- typecheck:
- unit test:
- build/e2e nếu áp dụng:
```

Chỉ bắt đầu sửa code sau khi checklist hợp lệ.

---

## 4. Scope control

- Chỉ code đúng các task ID user giao.
- Không thêm RBAC, billing, full authentication, Playwright MCP, regression, performance, CloakBrowser nếu phase hiện tại không yêu cầu.
- Không refactor toàn repo chỉ vì thích kiến trúc khác.
- Khi bắt buộc sửa ngoài scope để build/test pass, phải nêu rõ lý do trước khi thực hiện.

---

## 5. Quy tắc kiến trúc không được vi phạm

### 5.1. Phân lớp

```text
UI components/pages
  → application/services/use-cases
    → domain types/contracts
      → infrastructure adapters (Supabase/AI/Storage)
```

- UI không gọi provider AI trực tiếp.
- UI không đọc trực tiếp file skill/workflow.
- Route handler/server action gọi service/use-case; không chứa toàn bộ logic nghiệp vụ.
- Model provider phải qua interface adapter.
- Storage/database access phải qua repository hoặc service rõ ràng.

### 5.2. Skill và workflow

- Nội dung skill/workflow nằm trong `qa-core/`.
- Không copy prompt dài vào component hoặc route handler.
- Mọi step run phải lưu reference của workflow/skill và version/commit khi khả dụng.

### 5.3. AI output

- Không tin output model trước khi validate schema.
- Artifact chính phải lưu `content_json` đã validate và `schema_version`.
- Markdown/text chỉ là representation, không thay thế dữ liệu chuẩn.
- Nếu schema invalid: thực hiện repair có giới hạn; không âm thầm lưu output sai thành final.

### 5.4. Database và file

- Không lưu runtime data vào local file khi mục tiêu deploy Vercel.
- Database migration phải versioned trong `supabase/migrations/`.
- File upload phải dùng private storage bucket, lưu metadata DB.
- Không public URL tài liệu dự án theo mặc định.

---

## 6. Quy tắc code TypeScript / Next.js

- Bật strict TypeScript; không dùng `any` trừ khi có comment giải thích và boundary rõ ràng.
- Validate input server bằng Zod.
- Dùng server-side cho secrets/API key; không expose key qua `NEXT_PUBLIC_*`.
- Component phải nhỏ và có trách nhiệm rõ; tách table/form/view state khi cần.
- Trạng thái loading, empty, error phải được xử lý trong UI.
- Không đặt business constants rải rác; dùng enum/const/schema thống nhất.
- Log lỗi có context nhưng không log secrets, full document nhạy cảm hoặc API key.

---

## 7. Quy tắc UI/UX

- Mọi thao tác AI dài phải có trạng thái: queued/running/success/failed.
- Không cho user bấm generate official testcase nếu understanding chưa confirmed.
- Hiển thị rõ model và skill tạo ra artifact.
- Không overwrite artifact cũ khi regenerate; tạo version mới.
- Confirm thao tác xóa; không xoá ngầm data người dùng.

---

## 8. Quy tắc testing

Mỗi task phải có validation tương ứng:

| Thay đổi | Kiểm tra tối thiểu |
|---|---|
| Domain/util/schema | Unit test |
| Form/API validation | Unit/integration test |
| DB migration | Migration review + test query/local verify |
| UI flow chính | Component test hoặc E2E theo phạm vi |
| AI output validator | Fixtures valid/invalid và repair failure cases |
| Excel export | Test cột/giá trị và file generate thành công |

Trước khi hoàn thành task phải chạy tối thiểu:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Nếu command chưa có trong repo, task foundation phải tạo script; nếu chưa thể chạy, báo rõ lý do.

---

## 9. Security và secrets

- Không commit `.env`, access token, API key, service role key.
- Chỉ `NEXT_PUBLIC_SUPABASE_URL` và publishable/anon key phù hợp mới được dùng client; service role chỉ server-side.
- AI provider key chỉ server-side.
- Upload cần validate MIME/type/size; filename không được dùng trực tiếp làm path không sanitize.
- Không chạy automation hoặc browser trên domain chưa được cấu hình/cho phép ở các phase tương lai.

---

## 10. Cách báo cáo sau khi hoàn thành một task

```markdown
## Implementation Result — [Task ID]

### Đã thực hiện
- ...

### File tạo mới / chỉnh sửa
- `path`: lý do

### Migration / environment variables
- ...

### Validation đã chạy
- `pnpm lint`: Pass/Fail
- `pnpm typecheck`: Pass/Fail
- `pnpm test`: Pass/Fail
- `pnpm build`: Pass/Fail

### Chưa thực hiện / ngoài scope
- ...

### Rủi ro còn lại / bước tiếp theo được phép
- ...
```

---

## 11. Quy tắc đặc biệt khi AI coding agent được yêu cầu “làm toàn bộ phase”

- Chia thành task nhỏ theo file task của phase.
- Hoàn thành và validate từng task trước khi chuyển task tiếp theo.
- Không bỏ qua migration, schema validation, error state hoặc tests để nhanh hoàn thành UI.
- Nếu gặp quyết định chưa được define trong tài liệu, dừng ở câu hỏi làm rõ thay vì tự suy đoán.
