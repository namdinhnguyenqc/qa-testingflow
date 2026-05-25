# Engineering Standards & Implementation Rules — QAFlow AI

## 1. Mục tiêu

Tài liệu này quy định cách code đúng cho toàn bộ dự án. Coding agent hoặc developer không được hy sinh maintainability, security hoặc traceability để hoàn thành UI nhanh.

---

## 2. Thứ tự ưu tiên khi đưa ra quyết định code

1. Đúng yêu cầu và scope phase.
2. Không làm mất/lộ dữ liệu.
3. Dữ liệu/output có cấu trúc và traceable.
4. Kiến trúc tách lớp, dễ mở rộng.
5. UX rõ ràng trong các trạng thái lỗi/chờ.
6. Test và validation đủ trước khi merge.
7. Tối ưu hiệu năng sau khi flow đúng.

---

## 3. Implementation Workflow bắt buộc

```text
Read assigned docs/tasks
  ↓
Output implementation checklist
  ↓
Confirm scope/files/risks
  ↓
Implement small vertical task
  ↓
Run validation/tests
  ↓
Report changes and remaining risks
  ↓
Proceed to next assigned task only
```

### Không được phép

- “Tự tiện làm luôn phase sau cho tiện.”
- Sửa DB schema trực tiếp mà không có migration.
- Sử dụng mock data để che flow chưa kết nối thật mà không ghi rõ.
- Đưa AI output chưa validate vào artifact final.

---

## 4. Code Organization Rules

### 4.1. Separation of concerns

| Layer | Chứa gì | Không chứa gì |
|---|---|---|
| `app/` | Routing/page/layout/API boundary | Business logic lớn, provider calls trực tiếp |
| `components/` | UI components | DB queries, AI SDK calls |
| `domain/` | Entities, types, status, rules | UI/server framework detail |
| `application/` | Use-cases/services | Provider-specific implementation |
| `infrastructure/` | Supabase/model/storage adapters | UI state |
| `qa-core/` | Markdown/config/contracts | Runtime user data |

### 4.2. Naming

- Dùng thuật ngữ thống nhất: `Project`, `Feature`, `InputSource`, `WorkflowRun`, `StepRun`, `Artifact`, `TestCase`.
- Không dùng lẫn `Task`, `Feature`, `Ticket` khi ám chỉ cùng entity.
- `workflow_key`, `step_key`, `artifact_type` là constants/type-safe enum ở app boundary.

---

## 5. Type Safety & Validation

- TypeScript `strict: true`.
- Zod validate user/server input và environment config.
- JSON Schema/AJV validate model artifact contract.
- DB JSONB phải được parse/validate thành domain type trước khi render.
- Không dùng `as unknown as` để ép dữ liệu AI qua validation.

### Validation layers

```text
User Form Input → Zod
File Metadata → Zod + MIME/size rules
AI Response → JSON Schema + semantic validator
DB Reads → Zod/domain parser where needed
Export Input → Final testcase schema
```

---

## 6. AI Integration Rules

- Model calls chỉ thực hiện server-side.
- Provider key không đưa vào client bundle.
- Mọi step call phải có timeout/error handling phù hợp.
- Lưu model ID, provider ID, skill path/revision và schema version.
- Không đưa toàn bộ file nhạy cảm vào logs.
- Cần giới hạn repair attempts và hiển thị failure thay vì loop vô hạn.
- Model adapter phải có fake/test adapter cho unit/integration tests.

---

## 7. Skill/Workflow Rules

- Prompt nghiệp vụ nằm ở `qa-core/skills`, không nằm rải trong source.
- Workflow phải điều khiển gate; skill không được tự bỏ gate.
- Khi thêm/sửa skill, ghi rõ output schema nào bị ảnh hưởng.
- Nếu thay đổi schema breaking, tạo version mới và migration/render compatibility rõ.
- Golden example phải dùng data giả/ẩn thông tin nhạy cảm.

---

## 8. Database & Storage Rules

- Supabase migration là nguồn thay đổi schema duy nhất.
- Không gọi service role key từ client.
- Storage bucket private theo mặc định.
- File path sanitize và UUID-based.
- File type/size validate server-side.
- Không ghi file user vào source repository hoặc public folder.
- Artifact và testcase phải versioned; regenerate không overwrite version đã confirm/final.

---

## 9. API & Server Action Rules

- Endpoint/action phải validate auth/access mode (khi bật), input, entity existence và state transition.
- Không cho gọi generation step khi feature state không phù hợp.
- Trả lỗi có mã/message rõ cho UI.
- Các thao tác gây side effect phải idempotent hoặc chống double submit nơi cần thiết.

### Error response convention gợi ý

```json
{
  "error": {
    "code": "FEATURE_UNDERSTANDING_NOT_CONFIRMED",
    "message": "Confirm feature understanding before generating official test cases.",
    "details": {}
  }
}
```

---

## 10. UX Implementation Rules

- Form có validation hiển thị ngay đúng field.
- AI run có progress/status và ngăn double-run không chủ ý.
- Khi step failed, user vẫn xem được input/artifact cũ và retry.
- Confirm gate phải rõ: official vs draft with assumptions.
- Testcase editor phải tránh mất chỉnh sửa chưa save; có dirty-state warning.
- Export chỉ lấy từ version user đang chọn rõ ràng.

---

## 11. Testing Strategy

## 11.1. Unit tests

Bắt buộc cho:

- State transition rules.
- Schema validators/semantic validators.
- Workflow/skill loader parsing.
- Excel export formatting.
- Utility sanitization/path generation.

## 11.2. Integration tests

Cần có cho:

- Supabase repository CRUD hoặc test adapter.
- Artifact version creation.
- Step execution với fake model response valid/invalid/repaired.
- Upload metadata flow.

## 11.3. E2E tests — MVP critical path

```text
Create Project → Create Feature → Add input → Run mocked analysis
→ Answer clarification → Confirm understanding → Generate mocked TC
→ Edit/save final → Export Excel
```

E2E có thể dùng mocked AI adapter để ổn định; một smoke integration riêng có thể kiểm tra provider thật khi được cấu hình.

---

## 12. Definition of Done — mọi task code

- [ ] Đã làm đúng task/scope, không lén thêm phase khác.
- [ ] TypeScript types/schema cập nhật đầy đủ.
- [ ] Migration/env docs cập nhật nếu có.
- [ ] Loading/error/empty UI xử lý nếu có UI mới.
- [ ] Tests phù hợp đã thêm/cập nhật.
- [ ] `lint`, `typecheck`, `test`, `build` pass hoặc ghi rõ blocker.
- [ ] Không commit secret/file nhạy cảm.
- [ ] Báo cáo files changed và bước tiếp theo.

---

## 13. Pull Request Checklist

```markdown
### Scope
- Task IDs:
- Phase:
- Không triển khai ngoài scope: Yes/No

### Changes
- UI:
- API/application:
- Database/storage:
- qa-core/schema/skill:

### Validation
- [ ] lint
- [ ] typecheck
- [ ] unit/integration tests
- [ ] build
- [ ] manual verification nếu cần

### Security/Data
- [ ] No secrets committed
- [ ] Storage remains private
- [ ] Artifact traceability retained

### Screenshots / Notes
- ...
```
