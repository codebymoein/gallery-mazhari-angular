import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCustomRequestContactDetails1785900000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('custom_requests', [
      new TableColumn({ name: 'email', type: 'varchar', length: '160', isNullable: true }),
      new TableColumn({ name: 'contactTime', type: 'varchar', length: '40', default: "'anytime'" }),
      new TableColumn({ name: 'preferredContact', type: 'varchar', length: '30', default: "'phone'" }),
      new TableColumn({ name: 'fabric', type: 'varchar', length: '120', isNullable: true }),
    ]);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('custom_requests', 'fabric');
    await queryRunner.dropColumn('custom_requests', 'preferredContact');
    await queryRunner.dropColumn('custom_requests', 'contactTime');
    await queryRunner.dropColumn('custom_requests', 'email');
  }
}
