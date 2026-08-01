import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateNotificationsAndConsultations1785600000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const dateType =
      queryRunner.connection.options.type === 'better-sqlite3'
        ? 'datetime'
        : 'timestamp';
    await queryRunner.createTable(
      new Table({
        name: 'notification_settings',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true },
          { name: 'enabled', type: 'boolean', default: false },
          {
            name: 'mode',
            type: 'varchar',
            length: '20',
            default: "'disabled'",
          },
          {
            name: 'telegramBotToken',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          { name: 'telegramChatIds', type: 'text', isNullable: true },
          {
            name: 'smsApiUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'smsApiKey',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'smsSender',
            type: 'varchar',
            length: '80',
            isNullable: true,
          },
          { name: 'smsRecipients', type: 'text', isNullable: true },
          {
            name: 'smsAuthHeader',
            type: 'varchar',
            length: '50',
            default: "'Authorization'",
          },
          {
            name: 'smsAuthScheme',
            type: 'varchar',
            length: '30',
            default: "'Bearer'",
          },
          { name: 'timeoutMs', type: 'integer', default: 8000 },
          { name: 'updatedAt', type: dateType, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
    await queryRunner.createTable(
      new Table({
        name: 'notification_deliveries',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'eventType', type: 'varchar', length: '30' },
          {
            name: 'status',
            type: 'varchar',
            length: '30',
            default: "'pending'",
          },
          { name: 'channel', type: 'varchar', length: '30', isNullable: true },
          { name: 'message', type: 'text' },
          { name: 'context', type: 'text', isNullable: true },
          { name: 'lastError', type: 'text', isNullable: true },
          { name: 'attempts', type: 'integer', default: 0 },
          { name: 'createdAt', type: dateType, default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: dateType, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'notification_deliveries',
      new TableIndex({
        name: 'idx_notification_delivery_status',
        columnNames: ['status', 'createdAt'],
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: 'consultations',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'lastName', type: 'varchar', length: '80' },
          { name: 'phone', type: 'varchar', length: '20' },
          { name: 'ceremonyDate', type: 'varchar', length: '20' },
          { name: 'contactTime', type: 'varchar', length: '40' },
          { name: 'message', type: 'varchar', length: '800', isNullable: true },
          { name: 'source', type: 'varchar', length: '40' },
          {
            name: 'productName',
            type: 'varchar',
            length: '160',
            isNullable: true,
          },
          {
            name: 'productId',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          { name: 'dreamItems', type: 'text', isNullable: true },
          {
            name: 'followUpTag',
            type: 'varchar',
            length: '30',
            default: "'needs_followup'",
          },
          {
            name: 'adminNote',
            type: 'varchar',
            length: '1000',
            isNullable: true,
          },
          { name: 'createdAt', type: dateType, default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: dateType, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'consultations',
      new TableIndex({
        name: 'idx_consultations_phone',
        columnNames: ['phone'],
      }),
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('consultations', true);
    await queryRunner.dropTable('notification_deliveries', true);
    await queryRunner.dropTable('notification_settings', true);
  }
}
