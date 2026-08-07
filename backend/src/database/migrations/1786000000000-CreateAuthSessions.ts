import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAuthSessions1786000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'auth_sessions',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'userId', type: 'uuid' },
          { name: 'expiresAt', type: 'timestamp' },
          { name: 'revokedAt', type: 'timestamp', isNullable: true },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
    await queryRunner.createIndex(
      'auth_sessions',
      new TableIndex({
        name: 'IDX_auth_sessions_userId',
        columnNames: ['userId'],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('auth_sessions');
  }
}
