import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProductEntity } from '../products/entities/product.entity';
import { CreatePaymentDto, UpdatePaymentSettingsDto } from './dto/payment.dto';
import { PaymentSettingsEntity } from './entities/payment-settings.entity';
import { PaymentTransactionEntity } from './entities/payment-transaction.entity';
import { CustomRequestEntity } from '../custom-requests/entities/custom-request.entity';
import { DiscountsService } from '../discounts/discounts.service';
import { OrdersService } from '../orders/orders.service';
import type { OrderCustomer } from '../orders/entities/order.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentSettingsEntity)
    private readonly settingsRepo: Repository<PaymentSettingsEntity>,
    @InjectRepository(PaymentTransactionEntity)
    private readonly transactions: Repository<PaymentTransactionEntity>,
    @InjectRepository(CustomRequestEntity)
    private readonly customRequests: Repository<CustomRequestEntity>,
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    private readonly discounts: DiscountsService,
    private readonly orders: OrdersService,
  ) {}

  async publicSettings() {
    const value = await this.getSettings();
    return {
      enabled: value.enabled && value.provider !== 'disabled',
      provider: value.provider,
      displayName: value.displayName,
      sandbox: value.sandbox,
      currency: 'IRR',
    };
  }

  async adminSettings() {
    const value = await this.getSettings();
    return {
      ...value,
      merchantId: value.merchantId ?? '',
      customApiKey: value.customApiKey ? '••••••••' : '',
    };
  }

  async updateSettings(dto: UpdatePaymentSettingsDto) {
    const current = await this.getSettings();
    current.provider = dto.provider;
    current.enabled = dto.enabled;
    current.displayName = dto.displayName.trim() || 'پرداخت آنلاین';
    current.merchantId = dto.merchantId?.trim() || null;
    current.customRequestUrl = dto.customRequestUrl?.trim() || null;
    current.customVerifyUrl = dto.customVerifyUrl?.trim() || null;
    current.customPaymentUrlTemplate =
      dto.customPaymentUrlTemplate?.trim() || null;
    if (dto.customApiKey && dto.customApiKey !== '••••••••') {
      current.customApiKey = dto.customApiKey.trim();
    }
    current.sandbox = dto.sandbox;
    if (
      current.enabled &&
      current.provider === 'zarinpal' &&
      !current.merchantId
    ) {
      throw new BadRequestException('شناسه پذیرنده زرین‌پال الزامی است.');
    }
    return this.settingsRepo.save(current);
  }

  async createPayment(dto: CreatePaymentDto, backendBaseUrl: string) {
    await this.orders.expirePendingReservations();
    const settings = await this.getSettings();
    if (!settings.enabled || settings.provider === 'disabled') {
      throw new ServiceUnavailableException(
        'درگاه پرداخت در حال حاضر غیرفعال است.',
      );
    }
    if (!dto.items.length) throw new BadRequestException('سبد خرید خالی است.');

    const codes = [...new Set(dto.items.map((item) => item.code.trim()))];
    const products = await this.products.find({
      where: { code: In(codes), status: 'published' },
    });
    const pricedProducts = await this.discounts.applyToProducts(products);
    const byCode = new Map(
      pricedProducts.map((product) => [product.code, product]),
    );
    const lines = dto.items.map((item) => {
      if (item.code.trim() === 'HOME-TRIAL-DEPOSIT') {
        return { productId: 'home-trial-deposit', code: item.code.trim(), name: 'بیعانه تست در محل تهران', image: null, quantity: 1, unitPrice: 10_000_000, customization: undefined, requestId: item.requestId };
      }
      const product = byCode.get(item.code.trim());
      if (!product || product.stock < item.quantity) {
        throw new BadRequestException(
          `محصول ${item.code} موجود یا قابل خرید نیست.`,
        );
      }
      const price = Number(product.salePrice ?? product.price);
      if (!Number.isSafeInteger(price) || price <= 0) {
        throw new BadRequestException(
          `قیمت ریالی محصول ${item.code} معتبر نیست.`,
        );
      }
      const customizationFee =
        item.customization === 'veil-print'
          ? 10_000_000
          : item.customization === 'engraving'
            ? 8_000_000
            : 0;
      let rental: { ceremonyDate: string; returnDueDate: string; refundAmount: number; rentalFee: number } | undefined;
      if (item.rental) {
        const rentableCategories = new Set([
          'bridal-tiaras', 'bridal-headbands', 'imported-hairpiece',
          'chignon-pins', 'bridal-capes',
        ]);
        if (!rentableCategories.has(product.categorySlug)) {
          throw new BadRequestException('این کالا در گروه محصولات قابل اجاره قرار ندارد.');
        }
        if (!item.ceremonyDate) throw new BadRequestException('تاریخ مراسم برای اجاره الزامی است.');
        const ceremony = new Date(`${item.ceremonyDate}T12:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const returnDue = new Date(ceremony);
        returnDue.setDate(returnDue.getDate() + 7);
        const latestReturn = new Date(today);
        latestReturn.setDate(latestReturn.getDate() + 45);
        if (!Number.isFinite(ceremony.getTime()) || ceremony < today || returnDue > latestReturn) {
          throw new BadRequestException('بازه تاریخ اجاره معتبر نیست؛ بازگشت باید حداکثر تا ۴۵ روز پس از ثبت سفارش باشد.');
        }
        const rentalFee = Math.round(price / 2);
        rental = {
          ceremonyDate: item.ceremonyDate,
          returnDueDate: returnDue.toISOString().slice(0, 10),
          rentalFee,
          refundAmount: price - rentalFee,
        };
      }
      return {
        productId: product.id,
        code: product.code,
        name: product.name,
        image:
          product.photos?.find((photo) => photo.role === 'primary')?.url ||
          product.photos?.[0]?.url ||
          null,
        quantity: item.quantity,
        unitPrice: price + customizationFee,
        customization: item.customization,
        rental,
        requestId: item.requestId,
      };
    });

    const shipping = dto.shippingMethod === 'standard' ? 2_500_000 : 0;
    const amount =
      lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) +
      shipping;
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new BadRequestException('مبلغ نهایی پرداخت معتبر نیست.');
    }

    const orderNumber = this.orderNumber();
    const customer: OrderCustomer = {
      firstName: dto.customer.firstName.trim().slice(0, 80),
      lastName: dto.customer.lastName.trim().slice(0, 100),
      phone: dto.customer.phone.trim(),
      email: dto.customer.email.trim().slice(0, 160),
      city: dto.customer.city.trim().slice(0, 100),
      address: dto.customer.address.trim().slice(0, 300),
      postalCode: dto.customer.postalCode.trim(),
    };
    const pending = await this.orders.createPending({
      number: orderNumber,
      lines,
      customer: { ...customer },
      subtotal: amount - shipping,
      shipping,
      total: amount,
      shippingMethod: dto.shippingMethod,
      note: dto.note,
    });

    let transaction = this.transactions.create({
      orderNumber,
      orderId: pending.order.id,
      provider: settings.provider,
      amount,
      authority: null,
      status: 'created',
      referenceId: null,
      items: lines.map(({ code, quantity, unitPrice, rental, requestId }) => ({
        code,
        quantity,
        unitPrice,
        rental,
        requestId,
      })),
      customer,
      gatewayResponse: null,
    });
    try {
      transaction = await this.transactions.save(transaction);
    } catch (error) {
      await this.orders.releaseAfterGatewayFailure(pending.order.id);
      throw error;
    }
    const callbackUrl = `${backendBaseUrl}/api/payments/callback/${transaction.id}`;

    let gateway;
    try {
      gateway =
        settings.provider === 'zarinpal'
          ? await this.requestZarinpal(settings, transaction, callbackUrl)
          : await this.requestCustom(settings, transaction, callbackUrl);
    } catch (error) {
      transaction.status = 'failed';
      await this.transactions.save(transaction);
      await this.orders.releaseAfterGatewayFailure(pending.order.id);
      throw error;
    }

    transaction.authority = gateway.authority;
    transaction.status = 'redirected';
    transaction.gatewayResponse = gateway.raw;
    await this.transactions.save(transaction);
    return {
      transactionId: transaction.id,
      orderNumber: transaction.orderNumber,
      orderToken: pending.trackingToken,
      amount,
      currency: 'IRR',
      redirectUrl: gateway.redirectUrl,
    };
  }

  async callback(id: string, query: Record<string, string | undefined>) {
    const transaction = await this.transactions.findOne({ where: { id } });
    if (!transaction) throw new NotFoundException('تراکنش پیدا نشد.');
    if (transaction.status === 'paid') return transaction;
    const settings = await this.getSettings();
    if (transaction.provider === 'zarinpal') {
      if (query['Status'] !== 'OK' || !query['Authority']) {
        transaction.status = 'cancelled';
        await this.transactions.save(transaction);
        if (transaction.orderId) {
          await this.orders.markPaymentResult(
            transaction.orderId,
            'cancelled',
            null,
          );
        }
        return transaction;
      }
      if (
        transaction.authority &&
        query['Authority'] !== transaction.authority
      ) {
        throw new BadRequestException('payment_authority_mismatch');
      }
      const result = await this.verifyZarinpal(
        settings,
        transaction,
        query['Authority'],
      );
      transaction.status = result.paid ? 'paid' : 'failed';
      transaction.referenceId = result.referenceId;
      transaction.gatewayResponse = result.raw;
      const saved = await this.transactions.save(transaction);
      if (transaction.orderId) {
        await this.orders.markPaymentResult(
          transaction.orderId,
          result.paid ? 'paid' : 'failed',
          result.referenceId,
        );
      }
      if (result.paid) await this.confirmHomeTrial(transaction);
      return saved;
    }
    const custom = await this.verifyCustom(settings, transaction, query);
    transaction.status = custom.paid ? 'paid' : 'failed';
    transaction.referenceId = custom.referenceId;
    transaction.gatewayResponse = custom.raw;
    const saved = await this.transactions.save(transaction);
    if (transaction.orderId) {
      await this.orders.markPaymentResult(
        transaction.orderId,
        custom.paid ? 'paid' : 'failed',
        custom.referenceId,
      );
    }
    if (custom.paid) await this.confirmHomeTrial(transaction);
    return saved;
  }

  private async confirmHomeTrial(transaction: PaymentTransactionEntity): Promise<void> {
    const requestId = transaction.items.find(item => item.code === 'HOME-TRIAL-DEPOSIT')?.requestId;
    if (!requestId) return;
    await this.customRequests.update({ id: requestId, type: 'home-trial' }, { status: 'new' });
  }

  private async getSettings(): Promise<PaymentSettingsEntity> {
    return (
      (await this.settingsRepo.findOne({ where: { id: 1 } })) ??
      this.settingsRepo.create({
        id: 1,
        provider: 'disabled',
        enabled: false,
        displayName: 'پرداخت آنلاین',
        merchantId: null,
        customRequestUrl: null,
        customVerifyUrl: null,
        customPaymentUrlTemplate: null,
        customApiKey: null,
        sandbox: false,
      })
    );
  }

  private async requestZarinpal(
    settings: PaymentSettingsEntity,
    tx: PaymentTransactionEntity,
    callbackUrl: string,
  ) {
    if (!settings.merchantId)
      throw new ServiceUnavailableException('زرین‌پال پیکربندی نشده است.');
    const host = settings.sandbox
      ? 'https://sandbox.zarinpal.com'
      : 'https://api.zarinpal.com';
    const response = await fetch(`${host}/pg/v4/payment/request.json`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        merchant_id: settings.merchantId,
        amount: tx.amount,
        callback_url: callbackUrl,
        description: `سفارش ${tx.orderNumber} گالری مظهری`,
        metadata: {
          mobile: tx.customer?.['phone'] || undefined,
          email: tx.customer?.['email'] || undefined,
        },
      }),
    });
    const raw = (await response.json()) as Record<string, any>;
    const authority = String(raw?.['data']?.['authority'] || '');
    if (!response.ok || !authority)
      throw new BadGatewayException(
        raw?.['errors'] || 'خطا در ایجاد پرداخت زرین‌پال.',
      );
    const payHost = settings.sandbox
      ? 'https://sandbox.zarinpal.com'
      : 'https://www.zarinpal.com';
    return {
      authority,
      redirectUrl: `${payHost}/pg/StartPay/${authority}`,
      raw,
    };
  }

  private async verifyZarinpal(
    settings: PaymentSettingsEntity,
    tx: PaymentTransactionEntity,
    authority: string,
  ) {
    const host = settings.sandbox
      ? 'https://sandbox.zarinpal.com'
      : 'https://api.zarinpal.com';
    const response = await fetch(`${host}/pg/v4/payment/verify.json`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        merchant_id: settings.merchantId,
        amount: tx.amount,
        authority,
      }),
    });
    const raw = (await response.json()) as Record<string, any>;
    const code = Number(raw?.['data']?.['code']);
    return {
      paid: response.ok && (code === 100 || code === 101),
      referenceId: raw?.['data']?.['ref_id']
        ? String(raw['data']['ref_id'])
        : null,
      raw,
    };
  }

  private async requestCustom(
    settings: PaymentSettingsEntity,
    tx: PaymentTransactionEntity,
    callbackUrl: string,
  ) {
    if (!settings.customRequestUrl || !settings.customPaymentUrlTemplate) {
      throw new ServiceUnavailableException(
        'درگاه سفارشی کامل پیکربندی نشده است.',
      );
    }
    const response = await fetch(settings.customRequestUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        ...(settings.customApiKey
          ? { authorization: `Bearer ${settings.customApiKey}` }
          : {}),
      },
      body: JSON.stringify({
        amount: tx.amount,
        currency: 'IRR',
        orderId: tx.orderNumber,
        callbackUrl,
      }),
    });
    const raw = (await response.json()) as Record<string, any>;
    const authority = String(
      raw['authority'] || raw['token'] || raw['id'] || '',
    );
    if (!response.ok || !authority)
      throw new BadGatewayException('درگاه سفارشی توکن پرداخت برنگرداند.');
    return {
      authority,
      redirectUrl: settings.customPaymentUrlTemplate.replace(
        '{authority}',
        encodeURIComponent(authority),
      ),
      raw,
    };
  }

  private async verifyCustom(
    settings: PaymentSettingsEntity,
    tx: PaymentTransactionEntity,
    query: Record<string, string | undefined>,
  ) {
    if (!settings.customVerifyUrl) {
      return {
        paid: false,
        referenceId: null,
        raw: { callback: query, message: 'custom_verify_url_missing' },
      };
    }
    const authority = query['authority'] || query['token'] || tx.authority;
    const response = await fetch(settings.customVerifyUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        ...(settings.customApiKey
          ? { authorization: `Bearer ${settings.customApiKey}` }
          : {}),
      },
      body: JSON.stringify({
        authority,
        amount: Number(tx.amount),
        currency: 'IRR',
        orderId: tx.orderNumber,
        callback: query,
      }),
    });
    const raw = (await response.json()) as Record<string, any>;
    const status = String(raw['status'] || raw['state'] || '').toLowerCase();
    const paid =
      response.ok &&
      (raw['paid'] === true ||
        raw['success'] === true ||
        ['paid', 'success', 'successful', 'verified'].includes(status));
    return {
      paid,
      referenceId:
        raw['referenceId'] || raw['refId'] || raw['trackingCode']
          ? String(raw['referenceId'] || raw['refId'] || raw['trackingCode'])
          : null,
      raw,
    };
  }

  private orderNumber(): string {
    return `GM-${Date.now().toString().slice(-9)}-${Math.floor(Math.random() * 90 + 10)}`;
  }
}
