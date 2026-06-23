import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePromptVersionDto {
  @IsString()
  name: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ActivatePromptVersionDto {
  // body intentionally empty — ID comes from param
}

export class UpdateGateConfigDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  minQualityScore?: number;

  @IsOptional()
  @IsBoolean()
  blockIfOpenGaps?: boolean;
}

export class UpdateBudgetConfigDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  hardLimitUsd?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  warnAtPercent?: number;
}

export class ReadFigmaDto {
  @IsString()
  fileKey: string;

  @IsOptional()
  @IsString()
  nodeIds?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;
}

export class CostSummaryQueryDto {
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  period?: 'day' | 'week' | 'month';
}

export class TestSkillDto {
  @IsString()
  provider: string;

  @IsString()
  model: string;

  @IsString()
  prompt: string;

  @IsOptional()
  @IsString()
  fallbackProvider?: string;

  @IsOptional()
  @IsString()
  fallbackModel?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  skillName?: string;

  @IsOptional()
  @IsString()
  promptVersion?: string;
}
