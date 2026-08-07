import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ObservabilityService {
  constructor(private readonly dataSource: DataSource) {}

  live() {
    return { status: 'ok', uptimeSeconds: Math.floor(process.uptime()) };
  }

  async ready() {
    const startedAt = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ready',
        database: 'up',
        latencyMs: Date.now() - startedAt,
      };
    } catch {
      return {
        status: 'not_ready',
        database: 'down',
        latencyMs: Date.now() - startedAt,
      };
    }
  }

  version() {
    return {
      revision: process.env.APP_REVISION ?? 'unknown',
      buildId: process.env.BUILD_ID ?? 'unknown',
      environment: process.env.NODE_ENV ?? 'development',
    };
  }

  metrics(): string {
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    return [
      '# HELP gallery_process_uptime_seconds Process uptime in seconds.',
      '# TYPE gallery_process_uptime_seconds gauge',
      `gallery_process_uptime_seconds ${uptime}`,
      '# HELP gallery_process_resident_memory_bytes Resident memory size.',
      '# TYPE gallery_process_resident_memory_bytes gauge',
      `gallery_process_resident_memory_bytes ${memory.rss}`,
      '# HELP gallery_process_heap_used_bytes Heap bytes currently used.',
      '# TYPE gallery_process_heap_used_bytes gauge',
      `gallery_process_heap_used_bytes ${memory.heapUsed}`,
      '',
    ].join('\n');
  }
}
