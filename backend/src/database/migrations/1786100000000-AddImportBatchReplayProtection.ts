import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableIndex,
} from 'typeorm';

const IMPORT_RUNS_TABLE = 'platform_import_runs';
const CHECKSUM_INDEX = 'IDX_platform_import_runs_file_checksum';
const FINGERPRINT_INDEX = 'IDX_platform_import_runs_fingerprint';

export class AddImportBatchReplayProtection1786100000000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    const sqlite = queryRunner.connection.options.type === 'better-sqlite3';
    const dateType = sqlite ? 'datetime' : 'timestamp';

    let table = await queryRunner.getTable(IMPORT_RUNS_TABLE);

    // Historical environments may already have this table because the legacy
    // application once relied on synchronize/manual schema creation. Fresh
    // environments must now be reproducible from migrations only.
    if (!table) {
      await queryRunner.createTable(
        new Table({
          name: IMPORT_RUNS_TABLE,
          columns: [
            sqlite
              ? {
                  name: 'id',
                  type: 'varchar',
                  length: '36',
                  isPrimary: true,
                }
              : {
                  name: 'id',
                  type: 'uuid',
                  isPrimary: true,
                  isGenerated: true,
                  generationStrategy: 'uuid',
                },
            {
              name: 'fileChecksum',
              type: 'varchar',
              length: '64',
              default: "''",
            },
            { name: 'fingerprint', type: 'varchar', length: '64' },
            {
              name: 'mode',
              type: 'varchar',
              length: '20',
              default: "'dry_run'",
            },
            {
              name: 'status',
              type: 'varchar',
              length: '30',
              default: "'dry_run_complete'",
            },
            {
              name: 'fileName',
              type: 'varchar',
              length: '260',
              default: "''",
            },
            { name: 'mapping', type: 'text' },
            { name: 'mappingConfidence', type: 'float', default: 0 },
            { name: 'report', type: 'text', isNullable: true },
            { name: 'changeSet', type: 'text', isNullable: true },
            {
              name: 'createdBy',
              type: 'varchar',
              length: '120',
              isNullable: true,
            },
            {
              name: 'confirmedBy',
              type: 'varchar',
              length: '120',
              isNullable: true,
            },
            { name: 'confirmedAt', type: dateType, isNullable: true },
            {
              name: 'sourceTimestamp',
              type: 'varchar',
              length: '40',
              isNullable: true,
            },
            {
              name: 'jobId',
              type: 'varchar',
              length: '80',
              isNullable: true,
            },
            { name: 'createdAt', type: dateType, default: 'CURRENT_TIMESTAMP' },
            { name: 'updatedAt', type: dateType, default: 'CURRENT_TIMESTAMP' },
          ],
        }),
        true,
      );

      await queryRunner.createIndices(IMPORT_RUNS_TABLE, [
        new TableIndex({
          name: FINGERPRINT_INDEX,
          columnNames: ['fingerprint'],
          isUnique: true,
        }),
        new TableIndex({
          name: CHECKSUM_INDEX,
          columnNames: ['fileChecksum'],
        }),
      ]);
      return;
    }

    if (!table.findColumnByName('fileChecksum')) {
      await queryRunner.addColumn(
        IMPORT_RUNS_TABLE,
        new TableColumn({
          name: 'fileChecksum',
          type: 'varchar',
          length: '64',
          default: "''",
        }),
      );
    }

    if (!table.findColumnByName('confirmedAt')) {
      await queryRunner.addColumn(
        IMPORT_RUNS_TABLE,
        new TableColumn({
          name: 'confirmedAt',
          type: dateType,
          isNullable: true,
        }),
      );
    }

    table = await queryRunner.getTable(IMPORT_RUNS_TABLE);
    if (table && !table.indices.some((index) => index.name === CHECKSUM_INDEX)) {
      await queryRunner.createIndex(
        IMPORT_RUNS_TABLE,
        new TableIndex({
          name: CHECKSUM_INDEX,
          columnNames: ['fileChecksum'],
        }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(IMPORT_RUNS_TABLE);
    if (!table) return;

    const checksumIndex = table.indices.find(
      (index) => index.name === CHECKSUM_INDEX,
    );
    if (checksumIndex) {
      await queryRunner.dropIndex(IMPORT_RUNS_TABLE, checksumIndex);
    }

    if (table.findColumnByName('confirmedAt')) {
      await queryRunner.dropColumn(IMPORT_RUNS_TABLE, 'confirmedAt');
    }
    if (table.findColumnByName('fileChecksum')) {
      await queryRunner.dropColumn(IMPORT_RUNS_TABLE, 'fileChecksum');
    }
  }
}
