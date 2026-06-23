import { Module } from '@nestjs/common';
import { ExcelExporterService } from './excel-exporter.service';

@Module({
  providers: [ExcelExporterService],
  exports: [ExcelExporterService],
})
export class ExporterModule {}
