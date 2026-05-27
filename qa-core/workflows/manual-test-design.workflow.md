# Workflow: Manual Test Design

## Metadata

- Key: `manual_test_design`
- Version: `0.1.0`
- Purpose: Phân tích nguồn đầu vào, làm rõ nghiệp vụ và sinh manual test cases đúng chuẩn team.

## Global Rules

1. Không sinh official test cases trước khi Feature Understanding được user xác nhận.
2. Mọi AI output phải theo output contract tương ứng và được validator kiểm tra.
3. Critical unknown ảnh hưởng expected result phải tạo clarification question.
4. Model có thể đổi nhưng workflow, skill và output contract không đổi.

## Steps

### Step 1 — Source Intake

- Key: `source_intake`
- Skill: `qa-core/skills/common/source-intake.skill.md`
- Input: Feature metadata + InputSources.
- Output: Normalized source inventory.
- Exit condition: Có ít nhất requirement text hoặc document usable.

### Step 2 — Requirement Analysis

- Key: `requirement_analysis`
- Skill: `qa-core/skills/common/requirement-reader.skill.md`
- Input: Normalized input sources; optional authorized `UI_EXPLORATION` artifact.
- Output contract: Requirement Analysis.
- Exit condition: Structured output valid.

### Step 3 — Gap Analysis & Clarification

- Key: `clarification`
- Skill: `qa-core/skills/common/clarification.skill.md`
- Input: Requirement Analysis + prior answers nếu có.
- Output contract: Clarification Questions.
- Branch:
  - Có unresolved critical gaps: user phải trả lời hoặc chọn draft-only.
  - Không có critical gaps: tiếp tục Understanding.

### Step 4 — Feature Understanding

- Key: `feature_understanding`
- Skill: `qa-core/skills/manual/feature-understanding.skill.md`
- Input: Analysis + Clarification decisions.
- Output contract: Feature Understanding.
- Gate: User confirmation required.

### Step 5 — Test Case Generation

- Key: `testcase_generation`
- Skill: `qa-core/skills/manual/testcase-generator.skill.md`
- Input: Confirmed Feature Understanding; hoặc explicit draft-only request.
- Output contract: Manual Testcase Set.
- Rule: Draft-only output phải ghi assumptions và không được dùng làm official automation input.

### Step 6 — Test Case Review

- Key: `testcase_review`
- Skill: `qa-core/skills/manual/testcase-reviewer.skill.md`
- Input: Testcase set + understanding.
- Output: Review warnings/recommendations.
- User action: Edit/save final.

### Step 7 — Export

- Key: `export`
- Execution: Deterministic application service, không gọi AI mặc định.
- Input: User-selected test case artifact version.
- Output: Excel file theo template team.
