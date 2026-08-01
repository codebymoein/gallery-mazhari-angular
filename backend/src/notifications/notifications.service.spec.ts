import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const settings = {
    id: 1,
    enabled: true,
    mode: 'auto',
    telegramBotToken: 'token',
    telegramChatIds: ['100'],
    smsApiUrl: 'https://sms.local/send',
    smsApiKey: 'key',
    smsSender: '5000',
    smsRecipients: ['09120000000'],
    smsAuthHeader: 'Authorization',
    smsAuthScheme: 'Bearer',
    timeoutMs: 2000,
  } as any;
  const settingsRepo = {
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn((value) => Promise.resolve(value)),
  } as any;
  const deliveries = {
    create: jest.fn((value) => ({
      id: 'delivery-1',
      status: 'pending',
      channel: null,
      attempts: 0,
      lastError: null,
      ...value,
    })),
    save: jest.fn((value) => Promise.resolve(value)),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    settingsRepo.findOne.mockResolvedValue({ ...settings });
  });

  it('falls back to SMS when Telegram is unavailable', async () => {
    const calls: string[] = [];
    global.fetch = jest.fn(async (url: string | URL | Request) => {
      calls.push(String(url));
      if (String(url).includes('api.telegram.org'))
        throw new Error('network blocked');
      return { ok: true, text: async () => '' } as Response;
    }) as any;
    const service = new NotificationsService(settingsRepo, deliveries);
    await service.notify('consultation.created', 'test');
    expect(calls).toHaveLength(2);
    expect(calls[1]).toBe('https://sms.local/send');
    expect(deliveries.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'sent', channel: 'sms-fallback' }),
    );
  });

  it('records a failed delivery when all channels fail', async () => {
    global.fetch = jest.fn(async () => {
      throw new Error('offline');
    }) as any;
    const service = new NotificationsService(settingsRepo, deliveries);
    await service.notify('order.paid', 'test');
    expect(deliveries.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'failed', attempts: 1 }),
    );
  });
});
