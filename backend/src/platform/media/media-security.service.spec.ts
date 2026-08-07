import { MediaSecurityService } from './media-security.service';

describe('MediaSecurityService', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('treats disabled scanner as clean outside production', async () => {
    process.env.MEDIA_MALWARE_SCAN_MODE = 'disabled';
    const service = new MediaSecurityService();

    await expect(service.scan(Buffer.from('image'))).resolves.toEqual({
      status: 'clean',
    });
  });

  it('returns unavailable for an invalid scanner mode', async () => {
    process.env.MEDIA_MALWARE_SCAN_MODE = 'bogus';
    const service = new MediaSecurityService();

    await expect(service.scan(Buffer.from('image'))).resolves.toEqual({
      status: 'unavailable',
      reason: 'invalid_scan_mode',
    });
  });

  it('returns infected with the scanner signature', async () => {
    process.env.MEDIA_MALWARE_SCAN_MODE = 'http';
    process.env.MEDIA_MALWARE_SCAN_URL = 'http://scanner.test/scan';
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          clean: false,
          signature: 'EICAR-Test-Signature',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const service = new MediaSecurityService();

    await expect(service.scan(Buffer.from('image'))).resolves.toEqual({
      status: 'infected',
      signature: 'EICAR-Test-Signature',
    });
  });

  it('fails closed when the scanner endpoint is unavailable', async () => {
    process.env.MEDIA_MALWARE_SCAN_MODE = 'http';
    process.env.MEDIA_MALWARE_SCAN_URL = 'http://scanner.test/scan';
    jest.spyOn(global, 'fetch').mockRejectedValue(
      Object.assign(new Error('offline'), { name: 'TypeError' }),
    );
    const service = new MediaSecurityService();

    await expect(service.scan(Buffer.from('image'))).resolves.toEqual({
      status: 'unavailable',
      reason: 'TypeError',
    });
  });

  it('rejects malformed scanner responses as unavailable', async () => {
    process.env.MEDIA_MALWARE_SCAN_MODE = 'http';
    process.env.MEDIA_MALWARE_SCAN_URL = 'http://scanner.test/scan';
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'maybe' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const service = new MediaSecurityService();

    await expect(service.scan(Buffer.from('image'))).resolves.toEqual({
      status: 'unavailable',
      reason: 'scan_response_invalid',
    });
  });
});
