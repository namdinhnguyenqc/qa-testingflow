import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly localRoot: string;

  constructor(private readonly config: ConfigService) {
    this.localRoot = this.config.get<string>('STORAGE_LOCAL_PATH') ?? path.join(process.cwd(), 'uploads');
    fs.mkdirSync(this.localRoot, { recursive: true });
  }

  async save(key: string, buffer: Buffer): Promise<void> {
    const fullPath = path.join(this.localRoot, key);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);
    this.logger.debug(`Saved ${buffer.byteLength} bytes → ${fullPath}`);
  }

  async read(key: string): Promise<Buffer | null> {
    const fullPath = path.join(this.localRoot, key);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath);
  }

  getLocalPath(key: string): string {
    return path.join(this.localRoot, key);
  }

  exists(key: string): boolean {
    return fs.existsSync(path.join(this.localRoot, key));
  }
}
