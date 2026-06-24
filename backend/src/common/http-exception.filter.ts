import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { traceId?: string }>();

    const traceId = request.traceId ?? 'unknown';
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? this.extractMessage(exception)
        : 'Internal server error';

    if (status >= 500) {
      this.logger.error(
        `[${traceId}] ${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`[${traceId}] ${request.method} ${request.url} → ${status}: ${message}`);
    }

    response.status(status).json({
      statusCode: status,
      message,
      traceId,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private extractMessage(exception: HttpException): string | string[] {
    const resp = exception.getResponse();
    if (typeof resp === 'string') return resp;
    if (typeof resp === 'object' && resp !== null) {
      const r = resp as Record<string, unknown>;
      if (typeof r.message === 'string') return r.message;
      if (Array.isArray(r.message)) return r.message as string[];
    }
    return exception.message;
  }
}
