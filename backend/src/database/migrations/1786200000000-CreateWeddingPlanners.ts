import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateWeddingPlanners1786200000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const dateType =
      queryRunner.connection.options.type === 'better-sqlite3'
        ? 'datetime'
        : 'timestamp';

    await queryRunner.createTable(
      new Table({
        name: 'wedding_planners',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'userId', type: 'uuid', isNullable: false },
          { name: 'eventDate', type: 'date', isNullable: false },
          { name: 'ceremonyTypes', type: 'text', default: "'[]'" },
          { name: 'completedTaskIds', type: 'text', default: "'[]'" },
          { name: 'version', type: 'integer', default: '1' },
          { name: 'createdAt', type: dateType, default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: dateType, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'wedding_planners',
      new TableIndex({
        name: 'UQ_wedding_planners_user_id',
        columnNames: ['userId'],
        isUnique: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('wedding_planners', true);
  }
}
