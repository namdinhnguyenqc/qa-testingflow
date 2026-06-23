import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ParseResult {
  text: string;
  parser: string;
  pageCount?: number;
  sheetNames?: string[];
  warnings?: string[];
}

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);

  async parseBuffer(
    buffer: Buffer,
    mimeType: string,
    fileName?: string,
  ): Promise<ParseResult> {
    const ext = fileName ? path.extname(fileName).toLowerCase() : '';

    if (
      mimeType === 'application/pdf' ||
      ext === '.pdf'
    ) {
      return this.parsePdf(buffer);
    }

    if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      ext === '.docx'
    ) {
      return this.parseDocx(buffer);
    }

    if (mimeType === 'text/plain' || ext === '.txt') {
      return {
        text: buffer.toString('utf-8'),
        parser: 'text_plain',
      };
    }

    if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      ext === '.xlsx'
    ) {
      return this.parseXlsx(buffer);
    }

    if (mimeType === 'text/csv' || ext === '.csv') {
      return {
        text: buffer.toString('utf-8'),
        parser: 'text_csv',
      };
    }

    // Fallback for unknown types — return raw text if valid UTF-8
    try {
      const text = buffer.toString('utf-8');
      return { text, parser: 'raw_text_fallback' };
    } catch {
      return { text: '', parser: 'unsupported', warnings: [`Unsupported mime type: ${mimeType}`] };
    }
  }

  private async parsePdf(buffer: Buffer): Promise<ParseResult> {
    // Write to temp file — pdf-parse works better with file path on some envs
    const tmpPath = path.join(os.tmpdir(), `qa_pdf_${Date.now()}.pdf`);
    try {
      fs.writeFileSync(tmpPath, buffer);
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse') as (
        buf: Buffer,
      ) => Promise<{ text: string; numpages: number }>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await pdfParse(buffer as any);
      return {
        text: result.text.trim(),
        parser: 'pdf_parse',
        pageCount: result.numpages,
      };
    } catch (err) {
      this.logger.warn(`PDF parse error: ${String(err)}`);
      return { text: '', parser: 'pdf_parse', warnings: [String(err)] };
    } finally {
      fs.rmSync(tmpPath, { force: true });
    }
  }

  private async parseDocx(buffer: Buffer): Promise<ParseResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require('mammoth') as {
        extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string; messages: { message: string }[] }>;
      };
      const result = await mammoth.extractRawText({ buffer });
      return {
        text: result.value.trim(),
        parser: 'mammoth_docx',
        warnings: result.messages.map((m) => m.message).filter(Boolean),
      };
    } catch (err) {
      this.logger.warn(`DOCX parse error: ${String(err)}`);
      return { text: '', parser: 'mammoth_docx', warnings: [String(err)] };
    }
  }

  private async parseXlsx(buffer: Buffer): Promise<ParseResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ExcelJS = require('exceljs') as typeof import('exceljs');
      const workbook = new ExcelJS.Workbook();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await workbook.xlsx.load(buffer as any);

      const lines: string[] = [];
      const sheetNames: string[] = [];

      workbook.eachSheet((sheet) => {
        sheetNames.push(sheet.name);
        lines.push(`=== Sheet: ${sheet.name} ===`);
        sheet.eachRow((row) => {
          const values = (row.values as unknown[])
            .slice(1)
            .map((v) => (v == null ? '' : String(v)))
            .join('\t');
          if (values.trim()) lines.push(values);
        });
      });

      return {
        text: lines.join('\n'),
        parser: 'exceljs_xlsx',
        sheetNames,
      };
    } catch (err) {
      this.logger.warn(`XLSX parse error: ${String(err)}`);
      return { text: '', parser: 'exceljs_xlsx', warnings: [String(err)] };
    }
  }
}
