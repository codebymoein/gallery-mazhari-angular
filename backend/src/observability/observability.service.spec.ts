import type { DataSource } from 'typeorm';
import { ObservabilityService } from './observability.service';

describe('ObservabilityService', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('reports readiness when PostgreSQL responds', async () => {
    const query = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    const dataSource = { query } as unknown as DataSource;
    const service = new ObservabilityService(dataSource);

    await expect(service.ready()).resolves.toMatchObject({
      status: 'ready',
      database: 'up',
    });
    expect(query).toHaveBeenCalledWith('SELECT 1');
  });

  it('fails readiness without leaking database error details', async () => {
    const query = jest
      .fn()
      .mockRejectedValue(new Error('secret connection detail'));
    const dataSource = { query } as unknown as DataSource;
    const service = new ObservabilityService(dataSource);

    const result = await service.ready();
    expect(result).toMatchObject({ status: 'not_ready', database: 'down' });
    expect(JSON.stringify(result)).not.toContain('secret connection detail');
  });

  it('exposes safe release provenance', () => {
    process.env.APP_REVISION = 'abc123';
    process.env.BUILD_ID = 'build-42';
    process.env.NODE_ENV = 'staging';
    const service = new ObservabilityService({} as DataSource);

    expect(service.version()).toEqual({
      revision: 'abc123',
      buildId: 'build-42',
      environment: 'staging',
    });
  });

  it('emits scrape-friendly process metrics', () => {
    const service = new ObservabilityService({} as DataSource);
    const metrics = service.metrics();

    expect(metrics).toContain('gallery_process_uptime_seconds');
    expect(metrics).toContain('gallery_process_resident_memory_bytes');
    expect(metrics).toContain('gallery_process_heap_used_bytes');
  });
});
