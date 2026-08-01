import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {}

  async record(input: {
    action: string;
    entityType?: string;
    entityId?: string;
    importId?: string | null;
    actor?: string | null;
    previousValue?: unknown;
    newValue?: unknown;
    source?: string | null;
    ruleVersion?: string | null;
  }): Promise<AuditLogEntity> {
    const row = this.repo.create({
      action: input.action,
      entityType: input.entityType ?? '',
      entityId: input.entityId ?? '',
      importId: input.importId ?? null,
      actor: input.actor ?? null,
      previousValue: input.previousValue ?? null,
      newValue: input.newValue ?? null,
      source: input.source ?? null,
      ruleVersion: input.ruleVersion ?? null,
    });
    return this.repo.save(row);
  }

  list(limit = 100): Promise<AuditLogEntity[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 500),
    });
  }

  byImport(importId: string): Promise<AuditLogEntity[]> {
    return this.repo.find({
      where: { importId },
      order: { createdAt: 'ASC' },
    });
  }
}
