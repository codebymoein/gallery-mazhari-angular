import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class CreateOrders1785500000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const dateType =
      queryRunner.connection.options.type === 'better-sqlite3'
        ? 'datetime'
        : 'timestamp';
    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'number', type: 'varchar', length: '30', isUnique: true },
          {
            name: 'status',
            type: 'varchar',
            length: '30',
            default: "'pending-payment'",
          },
          {
            name: 'paymentStatus',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          { name: 'lines', type: 'text' },
          { name: 'customer', type: 'text' },
          { name: 'customerPhone', type: 'varchar', length: '20' },
          { name: 'subtotal', type: 'bigint' },
          { name: 'shipping', type: 'bigint' },
          { name: 'total', type: 'bigint' },
          { name: 'shippingMethod', type: 'varchar', length: '20' },
          { name: 'note', type: 'varchar', length: '500', isNullable: true },
          {
            name: 'paymentReference',
            type: 'varchar',
            length: '120',
            isNullable: true,
          },
          { name: 'trackingTokenHash', type: 'varchar', length: '64' },
          { name: 'stockReserved', type: 'boolean', default: true },
          { name: 'paidAt', type: 'varchar', length: '40', isNullable: true },
          {
            name: 'cancelledAt',
            type: 'varchar',
            length: '40',
            isNullable: true,
          },
          { name: 'version', type: 'integer', default: 1 },
          { name: 'createdAt', type: dateType, default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: dateType, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
    await queryRunner.createIndices('orders', [
      new TableIndex({
        name: 'idx_orders_number',
        columnNames: ['number'],
        isUnique: true,
      }),
      new TableIndex({
        name: 'idx_orders_phone',
        columnNames: ['customerPhone'],
      }),
      new TableIndex({ name: 'idx_orders_status', columnNames: ['status'] }),
    ]);

    const paymentTable = await queryRunner.getTable('payment_transactions');
    if (paymentTable && !paymentTable.findColumnByName('orderId')) {
      await queryRunner.addColumn(
        'payment_transactions',
        new TableColumn({
          name: 'orderId',
          type: 'varchar',
          length: '36',
          isNullable: true,
        }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const paymentTable = await queryRunner.getTable('payment_transactions');
    if (paymentTable?.findColumnByName('orderId')) {
      await queryRunner.dropColumn('payment_transactions', 'orderId');
    }
    await queryRunner.dropTable('orders', true);
  }
}
