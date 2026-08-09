import { BadRequestException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { WeddingPlannerEntity } from './entities/wedding-planner.entity';
import { CeremonyType } from './planner-task-catalog';
import { PlannerService } from './planner.service';

function futureDate(days: number): string {
  const now = new Date();
  const date = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days),
  );
  return date.toISOString().slice(0, 10);
}

describe('PlannerService', () => {
  const findOne = jest.fn();
  const save = jest.fn();
  const create = jest.fn(
    (value: Partial<WeddingPlannerEntity>): WeddingPlannerEntity =>
      value as WeddingPlannerEntity,
  );
  const exists = jest.fn();
  const createQueryBuilder = jest.fn();
  const repository = {
    findOne,
    save,
    create,
    exists,
    createQueryBuilder,
  } as unknown as Repository<WeddingPlannerEntity>;

  let service: PlannerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlannerService(repository);
  });

  it('creates a customer planner and returns server-derived tasks', async () => {
    findOne.mockResolvedValue(null);
    save.mockImplementation((value: WeddingPlannerEntity) =>
      Promise.resolve({
        ...value,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    );

    const result = await service.upsert('user-1', {
      eventDate: futureDate(200),
      ceremonyTypes: [CeremonyType.WEDDING],
    });

    expect(result.version).toBe(1);
    expect(result.progress.completed).toBe(0);
    expect(result.tasks.some((task) => task.id === 'choose-bridal-look')).toBe(
      true,
    );
    expect(result.tasks.every((task) => typeof task.dueDate === 'string')).toBe(
      true,
    );
  });

  it('rejects event dates outside the supported future window', async () => {
    await expect(
      service.upsert('user-1', {
        eventDate: '2000-01-01',
        ceremonyTypes: [CeremonyType.WEDDING],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects stale planner versions before mutation', async () => {
    findOne.mockResolvedValue({
      id: 'planner-1',
      userId: 'user-1',
      eventDate: futureDate(200),
      ceremonyTypes: [CeremonyType.WEDDING],
      completedTaskIds: [],
      version: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies WeddingPlannerEntity);

    await expect(
      service.upsert('user-1', {
        eventDate: futureDate(180),
        ceremonyTypes: [CeremonyType.WEDDING],
        version: 3,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(createQueryBuilder).not.toHaveBeenCalled();
  });

  it('rejects unknown task identifiers', async () => {
    findOne.mockResolvedValue({
      id: 'planner-1',
      userId: 'user-1',
      eventDate: futureDate(200),
      ceremonyTypes: [CeremonyType.WEDDING],
      completedTaskIds: [],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies WeddingPlannerEntity);

    await expect(
      service.updateTask('user-1', 'not-a-real-task', {
        completed: true,
        version: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(createQueryBuilder).not.toHaveBeenCalled();
  });
});
