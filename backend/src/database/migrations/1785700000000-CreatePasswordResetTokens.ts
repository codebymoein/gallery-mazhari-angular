import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePasswordResetTokens1785700000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const dateType =
      queryRunner.connection.options.type === 'better-sqlite3'
        ? 'datetime'
        : 'timestamp';
    await queryRunner.createTable(
      new Table({
        name: 'password_reset_tokens',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'tokenHash', type: 'varchar', length: '64', isUnique: true },
          { name: 'userId', type: 'varchar', length: '36' },
          { name: 'expiresAt', type: 'varchar', length: '40' },
          { name: 'usedAt', type: 'varchar', length: '40', isNullable: true },
          { name: 'createdAt', type: dateType, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'password_reset_tokens',
      new TableIndex({
        name: 'idx_password_reset_hash',
        columnNames: ['tokenHash'],
        isUnique: true,
      }),
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('password_reset_tokens', true);
  }
}
