import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateCustomRequests1785800000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const dateType = queryRunner.connection.options.type === 'better-sqlite3' ? 'datetime' : 'timestamp';
    await queryRunner.createTable(new Table({ name: 'custom_requests', columns: [
      { name: 'id', type: 'varchar', length: '36', isPrimary: true },
      { name: 'type', type: 'varchar', length: '20' },
      { name: 'fullName', type: 'varchar', length: '100' },
      { name: 'phone', type: 'varchar', length: '20' },
      { name: 'city', type: 'varchar', length: '80', isNullable: true },
      { name: 'ceremonyDate', type: 'varchar', length: '20', isNullable: true },
      { name: 'modelTitle', type: 'varchar', length: '160' },
      { name: 'description', type: 'varchar', length: '2000' },
      { name: 'color', type: 'varchar', length: '80', isNullable: true },
      { name: 'sizeOrLength', type: 'varchar', length: '80', isNullable: true },
      { name: 'budget', type: 'varchar', length: '120', isNullable: true },
      { name: 'imageUrls', type: 'text', isNullable: true },
      { name: 'status', type: 'varchar', length: '30', default: "'new'" },
      { name: 'adminNote', type: 'varchar', length: '1000', isNullable: true },
      { name: 'createdAt', type: dateType, default: 'CURRENT_TIMESTAMP' },
      { name: 'updatedAt', type: dateType, default: 'CURRENT_TIMESTAMP' },
    ] }), true);
    await queryRunner.createIndex('custom_requests', new TableIndex({ name: 'idx_custom_requests_type_status', columnNames: ['type', 'status'] }));
  }
  async down(queryRunner: QueryRunner): Promise<void> { await queryRunner.dropTable('custom_requests', true); }
}
