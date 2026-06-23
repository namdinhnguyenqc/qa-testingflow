import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEvent {
  projectId?: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(event: AuditEvent): Promise<{ id: string }> {
    return this.prisma.auditLog.create({
      data: {
        projectId: event.projectId,
        actorId: event.actorId,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        beforeJson: event.before as never,
        afterJson: event.after as never,
        metadata: event.metadata as never,
      },
      select: { id: true },
    });
  }
}
