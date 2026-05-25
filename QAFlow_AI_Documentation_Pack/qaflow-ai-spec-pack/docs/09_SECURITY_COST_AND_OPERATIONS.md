# Security, Cost & Operations Specification — QAFlow AI

## 1. Security posture theo giai đoạn

MVP có thể bỏ phân quyền phức tạp, nhưng không đồng nghĩa được phép public tài liệu dự án. Có hai chế độ rõ ràng:

| Mode | Dữ liệu dùng | Security expectation |
|---|---|---|
| Demo/PoC cá nhân | Dữ liệu giả, không nhạy cảm | Có thể chưa cần login; vẫn bảo vệ secret/storage |
| Team sử dụng thật | Requirement/test data nội bộ | Phải có access gate/login tối thiểu và hosting plan phù hợp |

---

## 2. Secrets Management

### Secrets bắt buộc server-only

- `SUPABASE_SERVICE_ROLE_KEY`.
- AI provider/API gateway key.
- Worker/GitHub token ở phase sau.
- Figma API token nếu tích hợp về sau.

### Rules

- Không commit secret.
- Không expose server key trong client env/build.
- Không log secret hoặc request headers chứa auth.
- Vercel environment variables dùng theo environment Preview/Production phù hợp.

---

## 3. File Security

### MVP rules

- Storage buckets private.
- Không dùng public URL vĩnh viễn cho requirement/Figma/export.
- Validate extension, MIME và size server-side.
- Path sanitize; dùng UUID.
- Không cho upload executable hoặc file không thuộc allowlist trong MVP.

### Allowlist gợi ý MVP

| Purpose | Extensions/MIME |
|---|---|
| Requirement | `.md`, `.txt`, `.pdf`, `.docx` |
| Figma export | `.png`, `.jpg`, `.jpeg`, `.webp`, `.pdf` |
| Existing testcase optional | `.xlsx`, `.csv` |

---

## 4. AI Data Handling

- Hiển thị cho user rõ input nào được gửi model ở mỗi run.
- Không gửi nguồn không được chọn/đã remove.
- Với tài liệu nhạy cảm, xem xét provider policy trước khi dùng thực tế.
- Lưu raw output có thể cấu hình; canonical structured artifact vẫn cần lưu.
- Không gửi credentials/test passwords trong requirement/test data trừ khi đã masked.

---

## 5. Model/Gateway Operational Decision

### Direct provider MVP

Ưu điểm: dễ deploy, endpoint truy cập được từ server.

### 9Router later/local option

Nếu dùng gateway như 9Router:

- Endpoint phải truy cập được từ web/worker runtime.
- Phải bảo vệ bằng network/auth và không public trần.
- Không cấu hình production web gọi `localhost` máy cá nhân.
- Cần kiểm tra chính sách provider/accounts được route qua gateway.

---

## 6. Vercel Plan Consideration

Vercel Hobby hiện được mô tả dành cho personal/non-commercial use. Do đó:

- Dùng Hobby để tự build/demo/validate ý tưởng cá nhân là phù hợp theo hướng thử nghiệm.
- Trước khi team dùng cho dự án công việc hoặc dữ liệu thật, kiểm tra terms và chuyển sang plan/host phù hợp nếu required.
- Không viết tài liệu nội bộ rằng “team dùng miễn phí vĩnh viễn” như một giả định sản phẩm.

---

## 7. Storage/Cost Strategy

### MVP storage usage

| Loại dữ liệu | Chính sách |
|---|---|
| Requirements/Figma inputs | Giữ lâu dài hoặc tới khi user xóa |
| Structured JSON artifacts | Giữ version để evaluation |
| Excel exports | Có thể giữ versions hoặc tái sinh; tùy quota |
| Evidence phase sau | Failed-only, retention time-limited |

### Khi có regression evidence

Khuyến nghị:

- Screenshot failed: giữ 30 ngày.
- Trace failed: giữ 14 ngày.
- Video: chỉ failed/critical; giữ 7 ngày hoặc không bật mặc định.
- Passed run: chỉ metadata/report nhỏ nếu không cần debug.

---

## 8. Monitoring & Logging MVP

### Log cần có

- Request/action failure không chứa secret.
- AI run failure: provider/model/step/error type.
- Schema validation failure count.
- File upload failure.
- Export failure.

### Không log

- Full sensitive document content.
- API keys/service role.
- Test account password.

### Product observability qua DB

- Run history.
- Step status/duration.
- Validation/repair counts.
- User final edits/feedback về sau.

---

## 9. Backup & Recovery

MVP tối thiểu:

- GitHub giữ source/skills/workflows.
- Supabase là persistent source của user data; cấu hình backup/restore theo plan khi đưa data thật vào.
- Export TC quan trọng có thể download và lưu trong repo/team drive tùy quy trình thực tế.
- Skill regression có thể rollback bằng Git revert + redeploy.

---

## 10. Operations Checklist trước khi share team

- [ ] Chỉ dùng hosting plan phù hợp mục đích sử dụng.
- [ ] Có access gate/login tối thiểu nếu upload tài liệu thật.
- [ ] Storage bucket private và file access test pass.
- [ ] Service role/API keys chỉ server-side.
- [ ] Có data retention rule.
- [ ] Có demo/test dataset không chứa secrets.
- [ ] Có cách backup/export final testcase.
- [ ] Đã test refresh/redeploy không mất dữ liệu.
- [ ] Đã giới hạn/quan sát usage AI/storage để tránh chi phí bất ngờ.
