import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateWeddingPlanners1786200000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'wedding_planners',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
          { name: 'userId', type: 'uuid', isNullable: false },
          { name: 'eventDate', type: 'date', isNullable: false },
          { name: 'ceremonyTypes', type: 'text', default: "'[]'" },
          { name: 'completedTaskIds', type: 'text', default: "'[]'" },
          { name: 'version', type: 'integer', default: '1' },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );

    await queryRunner.createIndex(
      'wedding_planners',
      new TableIndex({
        name: 'UQ_wedding_planners_user_id',
        columnNames: ['userId'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'wedding_planners',
      new TableForeignKey({
        name: 'FK_wedding_planners_user',
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('wedding_planners');
  }
}
