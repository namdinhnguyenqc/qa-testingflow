export type ProjectTab =
  | 'input'
  | 'analyze'
  | 'gap-review'
  | 'final-requirement'
  | 'testcase-generation'
  | 'testcase-review'
  | 'coverage'
  | 'export';

export interface TabConfig {
  id: ProjectTab;
  label: string;
  step: number;
}

export const PROJECT_TABS: TabConfig[] = [
  { id: 'input', label: 'Đầu vào', step: 1 },
  { id: 'analyze', label: 'Phân tích', step: 2 },
  { id: 'gap-review', label: 'Kiểm tra Gap', step: 3 },
  { id: 'final-requirement', label: 'Yêu cầu cuối', step: 4 },
  { id: 'testcase-generation', label: 'Sinh testcase', step: 5 },
  { id: 'testcase-review', label: 'Review testcase', step: 6 },
  { id: 'coverage', label: 'Coverage', step: 7 },
  { id: 'export', label: 'Xuất file', step: 8 },
];
