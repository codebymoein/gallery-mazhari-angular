import 'reflect-metadata';
import { DataSource, EntityManager } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { ImportService } from './import.service';
import { ImportTransactionBoundaryService } from './import-transaction-boundary.service';

describe('ImportTransactionBoundaryService', () => {
  const repository = { marker: 'transaction-repository' };

  function createHarness(options?: { postgres?: boolean; locked?: boolean }) {
    const manager = {
      getRepository: jest.fn(() => repository),
      query: jest.fn().mockResolvedValue([
        { locked: options?.locked ?? true },
      ]),
    } as unknown as EntityManager;

    const dataSource = {
      options: { type: options?.postgres === false ? 'better-sqlite3' : 'postgres' },
      transaction: jest.fn(async (work: (manager: EntityManager) => unknown) =>
        work(manager),
      ),
    } as unknown as DataSource;

    const originalHandler = jest.fn(async function (this: Record<string, unknown>) {
      return {
        runs: this['runs'],
        products: this['products'],
        variations: this['variations'],
        inventoryAudits: this['inventoryAudits'],
        productTags: this['productTags'],
        audit: this['audit'],
      };
    });

    const imports = {
      handleCommitJob: originalHandler,
    } as unknown as ImportService;
    const audit = {} as AuditService;

    const boundary = new ImportTransactionBoundaryService(
      dataSource,
      imports,
      audit,
    );
    boundary.onModuleInit();

    return {
      boundary,
      dataSource,
      manager,
      imports: imports as unknown as {
        handleCommitJob: (job: unknown) => Promise<Record<string, unknown>>;
      },
      originalHandler,
    };
  }

  it('executes the commit handler with transaction-scoped repositories', async () => {
    const harness = createHarness();

    const result = await harness.imports.handleCommitJob({ id: 'job-1' });

    expect(harness.dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(harness.manager.getRepository).toHaveBeenCalledTimes(6);
    expect(result['runs']).toBe(repository);
    expect(result['products']).toBe(repository);
    expect(result['variations']).toBe(repository);
    expect(result['inventoryAudits']).toBe(repository);
    expect(result['productTags']).toBe(repository);
    expect(result['audit']).not.toBeUndefined();
    expect(harness.originalHandler).toHaveBeenCalledTimes(1);
  });

  it('takes a PostgreSQL transaction advisory lock before commit work', async () => {
    const harness = createHarness({ postgres: true, locked: true });

    await harness.imports.handleCommitJob({ id: 'job-1' });

    expect(harness.manager.query).toHaveBeenCalledWith(
      'SELECT pg_try_advisory_xact_lock($1, $2) AS locked',
      [42016, 1],
    );
  });

  it('rejects a concurrent PostgreSQL import before invoking business writes', async () => {
    const harness = createHarness({ postgres: true, locked: false });

    await expect(
      harness.imports.handleCommitJob({ id: 'job-2' }),
    ).rejects.toThrow('import_commit_in_progress');

    expect(harness.originalHandler).not.toHaveBeenCalled();
  });

  it('does not use PostgreSQL advisory SQL for disposable SQLite tests', async () => {
    const harness = createHarness({ postgres: false });

    await harness.imports.handleCommitJob({ id: 'job-1' });

    expect(harness.manager.query).not.toHaveBeenCalled();
    expect(harness.originalHandler).toHaveBeenCalledTimes(1);
  });
});
