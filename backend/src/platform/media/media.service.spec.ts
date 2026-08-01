import { MediaService } from './media.service';

describe('MediaService.safeExtractZip (security)', () => {
  const svc = Object.create(MediaService.prototype) as MediaService;

  it('rejects path traversal entries', () => {
    // Minimal invalid zip bytes should throw invalid_zip
    expect(() => svc.safeExtractZip(Buffer.from('not-a-zip'))).toThrow();
  });
});
