import {
  normalizeDigits,
  normalizePersianArabic,
  normalizeProductCode,
  normalizeText,
  sanitizeSpreadsheetCell,
} from './text-normalize';

describe('text-normalize', () => {
  it('normalizes Persian digits', () => {
    expect(normalizeDigits('۱۳۷۰۰۱۸۹')).toBe('13700189');
  });

  it('normalizes Arabic digits', () => {
    expect(normalizeDigits('١٢٣')).toBe('123');
  });

  it('normalizes Arabic ye/kaf to Persian', () => {
    expect(normalizePersianArabic('كفش عروس ي')).toContain('ک');
    expect(normalizePersianArabic('كفش عروس ي')).toContain('ی');
  });

  it('normalizes product codes with spaces and Persian digits', () => {
    expect(normalizeProductCode('  ۱۳۷۰۰۱۸۹  ')).toBe('13700189');
  });

  it('collapses hidden spaces', () => {
    expect(normalizeText('a\u00A0b')).toBe('a b');
    expect(normalizeText('  foo   bar  ')).toBe('foo bar');
  });

  it('sanitizes formula injection', () => {
    expect(sanitizeSpreadsheetCell('=cmd()')).toBe("'=cmd()");
    expect(sanitizeSpreadsheetCell('safe')).toBe('safe');
  });

  it('preserves leading zeros in codes via string path', () => {
    expect(normalizeProductCode('00189')).toBe('00189');
  });
});
