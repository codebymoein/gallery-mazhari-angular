import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ProductEntity } from '../../products/entities/product.entity';
import { AuditService } from '../audit/audit.service';
import { AuditLogEntity } from '../audit/entities/audit-log.entity';
import { InventoryAuditEntity } from '../media/entities/media-asset.entity';
import { ProductTagEntity } from '../taxonomy/entities/taxonomy.entities';
import { ImportRunEntity } from './entities/import-run.entity';
import { ProductVariationEntity } from './entities/product-variation.entity';
import { ImportService } from './import.service';

const IMPORT_LOCK_NAMESPACE = 42016;
const IMPORT_LOCK_KEY = 1;

type CommitHandler = (job: unknown) => Promise<Record<string, unknown>>;

type ImportServiceInternals = {
  handleCommitJob: CommitHandler;
  runs: unknown;
  products: unknown;
  variations: unknown;
  inventoryAudits: unknown;
  productTags: unknown;
  audit: AuditService;
};

type AuditServiceInternals = {
  repo: unknown;
};

/**
 * Wraps the existing import commit handler without changing its business logic.
 * Every repository used by a commit is rebound to one transaction-scoped
 * EntityManager. PostgreSQL additionally gets a transaction advisory lock so
 * two inventory commits cannot interleave.
 */
@Injectable()
export class ImportTransactionBoundaryService implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    private readonly imports: ImportService,
    private readonly audit: AuditService,
  ) {}

  onModuleInit(): void {
    const service = this.imports as unknown as ImportServiceInternals;
    const original = service.handleCommitJob;

    service.handleCommitJob = (job: unknown) =>
      this.runInTransaction(service, original, job);
  }

  private runInTransaction(
    service: ImportServiceInternals,
    original: CommitHandler,
    job: unknown,
  ): Promise<Record<string, unknown>> {
    return this.dataSource.transaction<Record<string, unknown>>(
      async (manager): Promise<Record<string, unknown>> => {
        await this.acquireCommitLock(manager);

        const scoped = Object.create(service) as ImportServiceInternals;
        const scopedAudit = Object.create(this.audit) as AuditServiceInternals;

        Object.assign(scopedAudit, {
          repo: manager.getRepository(AuditLogEntity),
        });

        Object.assign(scoped, {
          runs: manager.getRepository(ImportRunEntity),
          products: manager.getRepository(ProductEntity),
          variations: manager.getRepository(ProductVariationEntity),
          inventoryAudits: manager.getRepository(InventoryAuditEntity),
          productTags: manager.getRepository(ProductTagEntity),
          audit: scopedAudit,
        });

        return original.call(scoped, job);
      },
    );
  }

  private async acquireCommitLock(manager: EntityManager): Promise<void> {
    if (this.dataSource.options.type !== 'postgres') return;

    const rawRows: unknown = await manager.query(
      'SELECT pg_try_advisory_xact_lock($1, $2) AS locked',
      [IMPORT_LOCK_NAMESPACE, IMPORT_LOCK_KEY],
    );
    const rows = Array.isArray(rawRows)
      ? (rawRows as Array<{ locked?: unknown }>)
      : [];

    if (rows[0]?.locked !== true) {
      throw new Error('import_commit_in_progress');
    }
  }
}
