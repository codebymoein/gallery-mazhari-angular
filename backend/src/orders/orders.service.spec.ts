import { DataSource, Repository } from 'typeorm';
import { ProductEntity } from '../products/entities/product.entity';
import { OrderEntity } from './entities/order.entity';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let dataSource: DataSource;
  let products: Repository<ProductEntity>;
  let service: OrdersService;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [ProductEntity, OrderEntity],
      synchronize: true,
    });
    await dataSource.initialize();
    products = dataSource.getRepository(ProductEntity);
    service = new OrdersService(
      dataSource.getRepository(OrderEntity),
      dataSource,
    );
    await products.save(
      products.create({
        code: 'P-1',
        name: 'Test product',
        category: 'test',
        parentCategory: '',
        parentCategorySlug: '',
        categorySlug: 'test',
        stock: 3,
        status: 'published',
        photos: [],
        productType: 'simple',
        price: 1_000_000,
      }),
    );
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('reserves stock and only exposes an order with the tracking token', async () => {
    const product = await products.findOneByOrFail({ code: 'P-1' });
    const created = await service.createPending({
      number: 'GM-TEST-1',
      lines: [
        {
          productId: product.id,
          code: product.code,
          name: product.name,
          image: null,
          quantity: 2,
          unitPrice: 1_000_000,
        },
      ],
      customer: {
        firstName: 'A',
        lastName: 'Customer',
        phone: '09123456789',
        email: '',
        city: 'Tehran',
        address: 'Test address',
        postalCode: '',
      },
      subtotal: 2_000_000,
      shipping: 0,
      total: 2_000_000,
      shippingMethod: 'pickup',
    });

    expect((await products.findOneByOrFail({ code: 'P-1' })).stock).toBe(1);
    await expect(service.getPublic('GM-TEST-1', 'wrong')).rejects.toThrow(
      'order_not_found',
    );
    const tracked = await service.getPublic('GM-TEST-1', created.trackingToken);
    expect(tracked.number).toBe('GM-TEST-1');
    expect(
      (tracked as unknown as { trackingTokenHash?: string }).trackingTokenHash,
    ).toBeUndefined();
  });

  it('restores reserved stock once after payment failure', async () => {
    const product = await products.findOneByOrFail({ code: 'P-1' });
    const { order } = await service.createPending({
      number: 'GM-TEST-2',
      lines: [
        {
          productId: product.id,
          code: product.code,
          name: product.name,
          image: null,
          quantity: 2,
          unitPrice: 1_000_000,
        },
      ],
      customer: {
        firstName: '',
        lastName: 'Customer',
        phone: '09123456789',
        email: '',
        city: 'Tehran',
        address: 'Test address',
        postalCode: '',
      },
      subtotal: 2_000_000,
      shipping: 0,
      total: 2_000_000,
      shippingMethod: 'pickup',
    });

    await service.markPaymentResult(order.id, 'failed', null);
    await service.markPaymentResult(order.id, 'failed', null);
    expect((await products.findOneByOrFail({ code: 'P-1' })).stock).toBe(3);
  });

  it('keeps reserved stock and idempotently marks a paid order processing', async () => {
    const product = await products.findOneByOrFail({ code: 'P-1' });
    const { order } = await service.createPending({
      number: 'GM-TEST-3',
      lines: [
        {
          productId: product.id,
          code: product.code,
          name: product.name,
          image: null,
          quantity: 1,
          unitPrice: 1_000_000,
        },
      ],
      customer: {
        firstName: '',
        lastName: 'Customer',
        phone: '09123456789',
        email: '',
        city: 'Tehran',
        address: 'Test address',
        postalCode: '',
      },
      subtotal: 1_000_000,
      shipping: 0,
      total: 1_000_000,
      shippingMethod: 'pickup',
    });

    await service.markPaymentResult(order.id, 'paid', 'REF-1');
    const paid = await service.markPaymentResult(order.id, 'paid', 'REF-1');
    expect(paid.status).toBe('processing');
    expect(paid.paymentStatus).toBe('paid');
    expect((await products.findOneByOrFail({ code: 'P-1' })).stock).toBe(2);
  });
});
