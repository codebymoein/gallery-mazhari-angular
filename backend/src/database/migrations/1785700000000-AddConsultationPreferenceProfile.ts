import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddConsultationPreferenceProfile1785700000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('consultations', new TableColumn({ name: 'preferenceProfile', type: 'text', isNullable: true }));
    await queryRunner.addColumn('consultations', new TableColumn({ name: 'desiredTags', type: 'text', isNullable: true }));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('consultations', 'desiredTags');
    await queryRunner.dropColumn('consultations', 'preferenceProfile');
  }
}
