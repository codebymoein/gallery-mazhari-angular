import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import {
  DeletePlannerDto,
  UpdatePlannerTaskDto,
  UpsertPlannerDto,
} from './dto/planner.dto';
import { WeddingPlannerEntity } from './entities/wedding-planner.entity';
import {
  CeremonyType,
  PLANNER_TASK_CATALOG,
  PlannerTaskDefinition,
  taskAppliesToCeremonies,
} from './planner-task-catalog';

export type PlannerTaskStatus = 'completed' | 'overdue' | 'upcoming' | 'later';

export interface PlannerTaskView extends PlannerTaskDefinition {
  dueDate: string;
  status: PlannerTaskStatus;
  completed: boolean;
}

@Injectable()
export class PlannerService {
  constructor(
    @InjectRepository(WeddingPlannerEntity)
    private readonly planners: Repository<WeddingPlannerEntity>,
  ) {}

  async getMine(userId: string) {
    const planner = await this.planners.findOne({ where: { userId } });
    return planner ? this.toView(planner) : null;
  }

  async upsert(userId: string, dto: UpsertPlannerDto) {
    this.assertValidEventDate(dto.eventDate);
    const ceremonyTypes = this.normalizeCeremonyTypes(dto.ceremonyTypes);
    const existing = await this.planners.findOne({ where: { userId } });

    if (!existing) {
      if (dto.version !== undefined) {
        throw new ConflictException({
          code: 'planner_version_conflict',
          message: 'Planner no longer matches this client state.',
        });
      }

      try {
        const created = await this.planners.save(
          this.planners.create({
            id: randomUUID(),
            userId,
            eventDate: dto.eventDate,
            ceremonyTypes,
            completedTaskIds: [],
            version: 1,
          }),
        );
        return this.toView(created);
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          throw new ConflictException({
            code: 'planner_version_conflict',
            message:
              'Planner was created by another request. Refresh and try again.',
          });
        }
        throw error;
      }
    }

    if (dto.version !== existing.version) {
      this.throwVersionConflict();
    }

    const allowedTaskIds = new Set(
      PLANNER_TASK_CATALOG.filter((task) =>
        taskAppliesToCeremonies(task, ceremonyTypes),
      ).map((task) => task.id),
    );
    const completedTaskIds = existing.completedTaskIds.filter((id) =>
      allowedTaskIds.has(id),
    );

    const result = await this.planners
      .createQueryBuilder()
      .update(WeddingPlannerEntity)
      .set({
        eventDate: dto.eventDate,
        ceremonyTypes,
        completedTaskIds,
        version: () => '"version" + 1',
      })
      .where('id = :id AND version = :version', {
        id: existing.id,
        version: dto.version,
      })
      .execute();

    if (result.affected !== 1) this.throwVersionConflict();
    return this.getRequired(userId);
  }

  async updateTask(userId: string, taskId: string, dto: UpdatePlannerTaskDto) {
    const existing = await this.planners.findOne({ where: { userId } });
    if (!existing) {
      throw new NotFoundException({
        code: 'planner_not_found',
        message: 'Planner not found.',
      });
    }
    if (dto.version !== existing.version) this.throwVersionConflict();

    const task = PLANNER_TASK_CATALOG.find((item) => item.id === taskId);
    if (!task) {
      throw new BadRequestException({
        code: 'planner_unknown_task',
        message: 'Unknown planner task.',
      });
    }
    if (!taskAppliesToCeremonies(task, existing.ceremonyTypes)) {
      throw new BadRequestException({
        code: 'planner_task_not_available',
        message: 'Task does not apply to this planner.',
      });
    }

    const next = new Set(existing.completedTaskIds);
    if (dto.completed) next.add(taskId);
    else next.delete(taskId);

    const result = await this.planners
      .createQueryBuilder()
      .update(WeddingPlannerEntity)
      .set({
        completedTaskIds: [...next],
        version: () => '"version" + 1',
      })
      .where('id = :id AND version = :version', {
        id: existing.id,
        version: dto.version,
      })
      .execute();

    if (result.affected !== 1) this.throwVersionConflict();
    return this.getRequired(userId);
  }

  async remove(userId: string, dto: DeletePlannerDto) {
    const result = await this.planners
      .createQueryBuilder()
      .delete()
      .from(WeddingPlannerEntity)
      .where('userId = :userId AND version = :version', {
        userId,
        version: dto.version,
      })
      .execute();

    if (result.affected !== 1) {
      const exists = await this.planners.exists({ where: { userId } });
      if (exists) this.throwVersionConflict();
      throw new NotFoundException({
        code: 'planner_not_found',
        message: 'Planner not found.',
      });
    }

    return { deleted: true };
  }

  private async getRequired(userId: string) {
    const planner = await this.planners.findOne({ where: { userId } });
    if (!planner) {
      throw new NotFoundException({
        code: 'planner_not_found',
        message: 'Planner not found.',
      });
    }
    return this.toView(planner);
  }

  private toView(planner: WeddingPlannerEntity) {
    const tasks = PLANNER_TASK_CATALOG.filter((task) =>
      taskAppliesToCeremonies(task, planner.ceremonyTypes),
    ).map((task) =>
      this.toTaskView(task, planner.eventDate, planner.completedTaskIds),
    );
    const completedCount = tasks.filter((task) => task.completed).length;
    const totalCount = tasks.length;
    const daysRemaining = this.daysBetween(
      this.todayUtcMs(),
      this.parseDateUtc(planner.eventDate),
    );

    return {
      id: planner.id,
      eventDate: planner.eventDate,
      ceremonyTypes: planner.ceremonyTypes,
      version: planner.version,
      daysRemaining,
      phase: this.phase(daysRemaining),
      progress: {
        completed: completedCount,
        total: totalCount,
        percent:
          totalCount === 0
            ? 0
            : Math.round((completedCount / totalCount) * 100),
      },
      tasks,
      createdAt: planner.createdAt,
      updatedAt: planner.updatedAt,
    };
  }

  private toTaskView(
    task: PlannerTaskDefinition,
    eventDate: string,
    completedTaskIds: readonly string[],
  ): PlannerTaskView {
    const eventMs = this.parseDateUtc(eventDate);
    const dueMs = eventMs - task.daysBefore * 24 * 60 * 60 * 1000;
    const dueDate = this.formatUtcDate(dueMs);
    const completed = completedTaskIds.includes(task.id);
    const daysUntilDue = this.daysBetween(this.todayUtcMs(), dueMs);

    let status: PlannerTaskStatus = 'later';
    if (completed) status = 'completed';
    else if (daysUntilDue < 0) status = 'overdue';
    else if (daysUntilDue <= 14) status = 'upcoming';

    return { ...task, dueDate, status, completed };
  }

  private normalizeCeremonyTypes(values: CeremonyType[]): CeremonyType[] {
    return [...new Set(values)];
  }

  private assertValidEventDate(value: string): void {
    const eventMs = this.parseDateUtc(value);
    if (!Number.isFinite(eventMs)) this.throwInvalidDate();

    const today = new Date(this.todayUtcMs());
    const max = Date.UTC(
      today.getUTCFullYear() + 3,
      today.getUTCMonth(),
      today.getUTCDate(),
    );
    if (eventMs < this.todayUtcMs() || eventMs > max) this.throwInvalidDate();
  }

  private parseDateUtc(value: string): number {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return Number.NaN;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const ms = Date.UTC(year, month - 1, day);
    const date = new Date(ms);
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return Number.NaN;
    }
    return ms;
  }

  private todayUtcMs(): number {
    const now = new Date();
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  }

  private daysBetween(fromMs: number, toMs: number): number {
    return Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000));
  }

  private formatUtcDate(ms: number): string {
    return new Date(ms).toISOString().slice(0, 10);
  }

  private phase(
    daysRemaining: number,
  ): 'planning' | 'soon' | 'urgent' | 'today' | 'past' {
    if (daysRemaining < 0) return 'past';
    if (daysRemaining === 0) return 'today';
    if (daysRemaining <= 30) return 'urgent';
    if (daysRemaining <= 90) return 'soon';
    return 'planning';
  }

  private throwInvalidDate(): never {
    throw new BadRequestException({
      code: 'planner_invalid_event_date',
      message: 'Event date must be between today and three years from today.',
    });
  }

  private throwVersionConflict(): never {
    throw new ConflictException({
      code: 'planner_version_conflict',
      message: 'Planner changed elsewhere. Refresh before saving again.',
    });
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as { code?: string; message?: string };
    return (
      candidate.code === '23505' ||
      candidate.message?.includes('UNIQUE constraint failed') === true
    );
  }
}
