# Template Columns: Manual Test Cases

Các cột bắt buộc xuất file Excel (.xlsx) theo đúng chuẩn QA Team:

1. **Test Case ID** (`test_case_code`): Mã định danh duy nhất của kịch bản, ví dụ: `TC_AUTH_001`.
2. **Module** (`module`): Tên phân hệ nghiệp vụ cần kiểm thử, ví dụ: `Authentication`.
3. **Test Scenario** (`scenario`): Tên kịch bản kiểm thử chi tiết.
4. **Case Type** (`case_type`): Phân loại kịch bản (`Happy`, `Validation`, `Negative`, `Boundary`, `Permission`, `UI`, `Error Handling`, `Regression`).
5. **Priority** (`priority`): Mức độ ưu tiên (`P0`, `P1`, `P2`, `P3`).
6. **Preconditions** (`preconditions_json`): Điều kiện tiên quyết trước khi thực hiện test.
7. **Test Steps** (`steps_json`): Các bước thực hiện chi tiết (kèm theo expected result từng bước nếu có).
8. **Test Data** (`test_data_json`): Dữ liệu đầu vào cần chuẩn bị.
9. **Expected Result** (`expected_result`): Kết quả mong đợi cuối cùng.
10. **Automation Candidate** (`automation_candidate`): Đánh dấu kịch bản có khả năng tự động hóa (`Yes`/`No`).
11. **Requirement Mapping** (`requirement_mapping_json`): Ánh xạ về rule/story nghiệp vụ gốc.
12. **Status** (`status`): Trạng thái kịch bản (`Draft`/`Final`).
