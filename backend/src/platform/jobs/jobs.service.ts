import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PlatformJobEntity,
  PlatformJobStatus,
} from './entities/platform-job.entity';

type JobHandler = (job: PlatformJobEntity) => Promise<Record<string, unknown>>;

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private readonly handlers = new Map<string, JobHandler>();
  private pumping = false;

  constructor(
    @InjectRepository(PlatformJobEntity)
    private readonly repo: Repository<PlatformJobEntity>,
  ) {}

  registerHandler(type: string, handler: JobHandler): void {
    this.handlers.set(type, handler);
  }

  async enqueue(input: {
    type: string;
    payload?: Record<string, unknown>;
    createdBy?: string | null;
    totalItems?: number;
  }): Promise<PlatformJobEntity> {
    const job = this.repo.create({
      type: input.type,
      status: 'queued',
      payload: input.payload ?? null,
      createdBy: input.createdBy ?? null,
      totalItems: input.totalItems ?? 0,
      progressPercent: 0,
      currentStep: 'queued',
    });
    const saved = await this.repo.save(job);
    setImmediate(() => void this.pump());
    return saved;
  }

  async get(id: string): Promise<PlatformJobEntity> {
    const job = await this.repo.findOne({ where: { id } });
    if (!job) throw new NotFoundException('job_not_found');
    return job;
  }

  list(limit = 50): Promise<PlatformJobEntity[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 200),
    });
  }

  async cancel(id: string): Promise<PlatformJobEntity> {
    const job = await this.get(id);
    if (job.status === 'completed' || job.status === 'cancelled') return job;
    job.status = 'cancelled';
    job.finishedAt = new Date().toISOString();
    return this.repo.save(job);
  }

  async updateProgress(
    id: string,
    patch: Partial<
      Pick<
        PlatformJobEntity,
        | 'progressPercent'
        | 'currentStep'
        | 'completedItems'
        | 'failedItems'
        | 'totalItems'
        | 'status'
      >
    >,
  ): Promise<void> {
    await this.repo.update({ id }, patch);
  }

  private async pump(): Promise<void> {
    if (this.pumping) return;
    this.pumping = true;
    try {
      while (true) {
        const next = await this.repo.findOne({
          where: { status: 'queued' as PlatformJobStatus },
          order: { createdAt: 'ASC' },
        });
        if (!next) break;
        await this.runOne(next);
      }
    } finally {
      this.pumping = false;
    }
  }

  private async runOne(job: PlatformJobEntity): Promise<void> {
    const handler = this.handlers.get(job.type);
    job.status = 'running';
    job.startedAt = new Date().toISOString();
    job.attempt += 1;
    job.currentStep = 'running';
    await this.repo.save(job);

    if (!handler) {
      job.status = 'dead_letter';
      job.lastError = `no_handler:${job.type}`;
      job.finishedAt = new Date().toISOString();
      await this.repo.save(job);
      return;
    }

    try {
      const result = await handler(job);
      const fresh = await this.get(job.id);
      if (fresh.status === 'cancelled') return;
      fresh.status = 'completed';
      fresh.result = result;
      fresh.progressPercent = 100;
      fresh.currentStep = 'completed';
      fresh.finishedAt = new Date().toISOString();
      await this.repo.save(fresh);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown_error';
      this.logger.error(`Job ${job.id} failed: ${message}`);
      const fresh = await this.get(job.id);
      fresh.lastError = message.slice(0, 500);
      if (fresh.attempt >= 3) {
        fresh.status = 'dead_letter';
      } else {
        fresh.status = 'failed';
      }
      fresh.finishedAt = new Date().toISOString();
      await this.repo.save(fresh);
    }
  }
}
