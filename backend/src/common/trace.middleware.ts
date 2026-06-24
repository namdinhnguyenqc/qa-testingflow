import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class TraceMiddleware implements NestMiddleware {
  use(req: Request & { traceId?: string }, res: Response, next: NextFunction) {
    const traceId = (req.headers['x-trace-id'] as string) ?? randomUUID();
    req.traceId = traceId;
    res.setHeader('X-Trace-Id', traceId);
    next();
  }
}
