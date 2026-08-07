import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddImportBatchReplayProtection1786100000000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'platform_import_runs',
      new TableColumn({
        name: 'fileChecksum',
        type: 'varchar',
        length: '64',
        default: "''",
      }),
    );
    await queryRunner.addColumn(
      'platform_import_runs',
      new TableColumn({
        name: 'confirmedAt',
        type:
          queryRunner.connection.options.type === 'better-sqlite3'
            ? 'datetime'
            : 'timestamp',
        isNullable: true,
      }),
    );
    await queryRunner.createIndex(
      'platform_import_runs',
      new TableIndex({
        name: 'IDX_platform_import_runs_file_checksum',
        columnNames: ['fileChecksum'],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'platform_import_runs',
      'IDX_platform_import_runs_file_checksum',
    );
    await queryRunner.dropColumn('platform_import_runs', 'confirmedAt');
    await queryRunner.dropColumn('platform_import_runs', 'fileChecksum');
  }
}
