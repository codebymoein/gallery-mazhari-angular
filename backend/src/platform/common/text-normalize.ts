/**
 * Persian/Arabic/English text & digit normalization for import matching.
 * Shared by Excel parser, attribute taxonomy, and image filename matching.
 */

const ARABIC_YE = /\u064A/g; // ي
const ARABIC_KAF = /\u0643/g; // ك
const PERSIAN_YE = '\u06CC'; // ی
const PERSIAN_KAF = '\u06A9'; // ک

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Invisible / problematic whitespace → normal space */
const HIDDEN_SPACE =
  /[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF\u200C\u200D]/g;

export function normalizeDigits(value: string): string {
  let out = '';
  for (const ch of value) {
    const p = PERSIAN_DIGITS.indexOf(ch);
    if (p >= 0) {
      out += String(p);
      continue;
    }
    const a = ARABIC_DIGITS.indexOf(ch);
    if (a >= 0) {
      out += String(a);
      continue;
    }
    out += ch;
  }
  return out;
}

export function normalizePersianArabic(value: string): string {
  return value.replace(ARABIC_YE, PERSIAN_YE).replace(ARABIC_KAF, PERSIAN_KAF);
}

export function normalizeSpaces(value: string): string {
  return value.replace(HIDDEN_SPACE, ' ').replace(/\s+/g, ' ').trim();
}

/** Full normalization for keys / comparisons */
export function normalizeText(value: string | null | undefined): string {
  if (value == null) return '';
  return normalizeSpaces(
    normalizeDigits(normalizePersianArabic(String(value))),
  ).toLowerCase();
}

/** Preserve case for display codes but normalize digits & arabic letters */
export function normalizeProductCode(value: string | null | undefined): string {
  if (value == null) return '';
  return normalizeSpaces(
    normalizeDigits(normalizePersianArabic(String(value))),
  ).toUpperCase();
}

/**
 * Strip Excel formula-injection prefixes when exporting.
 * Never trust spreadsheet cell contents.
 */
export function sanitizeSpreadsheetCell(value: string): string {
  const v = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(v)) {
    return `'${v}`;
  }
  return v;
}

/** Extract leading product-code-like token (alphanumeric) */
export function extractCodeToken(value: string): string {
  const n = normalizeProductCode(value);
  const m = n.match(/[A-Z0-9][A-Z0-9._-]*/);
  return m ? m[0] : n;
}
