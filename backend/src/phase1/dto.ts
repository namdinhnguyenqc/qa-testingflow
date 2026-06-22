import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateArtifactDto {
  @IsIn(['DOCUMENT', 'SPREADSHEET', 'IMAGE', 'TEXT', 'FIGMA'])
  type: 'DOCUMENT' | 'SPREADSHEET' | 'IMAGE' | 'TEXT' | 'FIGMA';

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  sizeBytes?: number;

  @IsOptional()
  @IsString()
  storageKey?: string;

  @IsOptional()
  @IsString()
  sourceText?: string;

  @IsOptional()
  @IsObject()
  parsedContent?: Record<string, unknown>;
}

export class AnalyzeRequirementDto {
  @IsString()
  artifactId: string;

  @IsOptional()
  @IsIn(['vi', 'en'])
  language?: 'vi' | 'en';
}

export class UpdateGapDto {
  @IsOptional()
  @IsIn(['OPEN', 'RESOLVED', 'ACCEPTED_RISK', 'REJECTED'])
  status?: 'OPEN' | 'RESOLVED' | 'ACCEPTED_RISK' | 'REJECTED';

  @IsOptional()
  @IsString()
  resolutionNote?: string;
}

export class ApproveDto {
  @IsOptional()
  @IsBoolean()
  override?: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class GenerateTestcasesDto {
  @IsOptional()
  @IsIn(['vi', 'en'])
  language?: 'vi' | 'en';

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsIn(['smoke', 'standard', 'exhaustive'])
  detailLevel?: 'smoke' | 'standard' | 'exhaustive';

  @IsOptional()
  @IsInt()
  @Min(1)
  maxCases?: number;
}

export class UpdateTestCaseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  preconditions?: string;

  @IsOptional()
  steps?: unknown;

  @IsOptional()
  @IsString()
  expectedResult?: string;

  @IsOptional()
  @IsIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

  @IsOptional()
  @IsIn(['DRAFT', 'READY', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW'])
  status?: 'DRAFT' | 'READY' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW';
}
