import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'AI QA Demo' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({
    example: 'Requirement analysis and testcase generation demo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 'vi', enum: ['vi', 'en'] })
  @IsOptional()
  @IsString()
  @IsIn(['vi', 'en'])
  defaultLanguage?: string;

  @ApiPropertyOptional({
    example: {
      gates: {
        requirement: { minQualityScore: 70, allowUserOverride: true },
      },
    },
  })
  @IsOptional()
  @IsObject()
  configOverrides?: Record<string, unknown>;
}
