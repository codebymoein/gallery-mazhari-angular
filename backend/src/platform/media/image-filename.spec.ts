import {
  assignImageRoles,
  isExactCodeMatch,
  parseProductImageFilename,
} from './image-filename';

describe('image-filename', () => {
  it('parses primary image', () => {
    const p = parseProductImageFilename('13700189.jpg');
    expect(p.valid).toBe(true);
    expect(p.productCode).toBe('13700189');
    expect(p.sequence).toBeNull();
  });

  it('parses gallery with dash and underscore', () => {
    expect(parseProductImageFilename('13700189-2.jpg').sequence).toBe(2);
    expect(parseProductImageFilename('13700189_3.webp').sequence).toBe(3);
  });

  it('rejects partial prefix matching responsibility (exact code only)', () => {
    expect(isExactCodeMatch('13700189', '137001890')).toBe(false);
    expect(isExactCodeMatch('13700189', '13700189')).toBe(true);
  });

  it('rejects path traversal', () => {
    expect(parseProductImageFilename('../13700189.jpg').valid).toBe(false);
  });

  it('assigns roles and flags missing primary', () => {
    const map = assignImageRoles([
      '13700189-2.jpg',
      '13700189-3.jpg',
      '13700189-1.jpg',
    ]);
    const a = map.get('13700189')!;
    expect(a.needsPrimaryConfirmation).toBe(true);
    expect(a.suggestedPrimary).toBe('13700189-1.jpg');
    expect(a.galleryOrdered[0]).toBe('13700189-1.jpg');
  });

  it('detects duplicate sequence conflict', () => {
    const map = assignImageRoles(['13700189-2.jpg', '13700189_2.png']);
    expect(map.get('13700189')!.conflicts.length).toBeGreaterThan(0);
  });

  it('groups a base image and numbered gallery images under one exact code', () => {
    const map = assignImageRoles([
      '10010029.png',
      '10010029-2.jpg',
      '10010029-3.webp',
      '10010029-4.png',
    ]);
    expect([...map.keys()]).toEqual(['10010029']);
    expect(map.get('10010029')).toMatchObject({
      primaryFileName: '10010029.png',
      galleryOrdered: ['10010029-2.jpg', '10010029-3.webp', '10010029-4.png'],
      needsPrimaryConfirmation: false,
    });
  });

  it('does not treat longer code as match for shorter file', () => {
    const p = parseProductImageFilename('13700189.jpg');
    expect(isExactCodeMatch(p.productCode, '1370018')).toBe(false);
  });
});
