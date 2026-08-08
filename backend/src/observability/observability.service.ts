import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import type { WebVitalDto } from './dto/web-vital.dto';

@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger(ObservabilityService.name);

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
    const releaseRoot = join(process.cwd(), '..');
    const revision = this.readText(join(releaseRoot, 'REVISION'));
    const build = this.readJson(join(releaseRoot, 'BUILD.json'));
    return {
      revision: revision ?? process.env.APP_REVISION ?? 'unknown',
      buildId:
        typeof build?.workflow_run === 'string'
          ? build.workflow_run
          : (process.env.BUILD_ID ?? 'unknown'),
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

  recordWebVital(metric: WebVitalDto): void {
    this.logger.log({
      event: 'web_vital',
      name: metric.name,
      value: Number(metric.value.toFixed(metric.name === 'CLS' ? 4 : 2)),
      route: metric.route,
      navigationType: metric.navigationType,
    });
  }

  private readText(path: string): string | null {
    try {
      return readFileSync(path, 'utf8').trim() || null;
    } catch {
      return null;
    }
  }

  private readJson(path: string): Record<string, unknown> | null {
    try {
      return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
