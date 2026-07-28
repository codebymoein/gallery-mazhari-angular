/**
 * Lightweight Jalali (Persian) date helpers — no external dependency.
 */

export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
] as const;

export const JALALI_WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const;

function div(a: number, b: number): number {
  return Math.trunc(a / b);
}

export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    div(gy2 + 3, 4) -
    div(gy2 + 99, 100) +
    div(gy2 + 399, 400) +
    gd +
    gdm[gm - 1];
  let jy = -1595 + 33 * div(days, 12053);
  days %= 12053;
  jy += 4 * div(days, 1461);
  days %= 1461;
  if (days > 365) {
    jy += div(days - 1, 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  let jy2 = jy + 1595;
  let days =
    -355668 +
    365 * jy2 +
    div(jy2, 33) * 8 +
    div((jy2 % 33) + 3, 4) +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * div(days, 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * div(--days, 36524);
    days %= 36524;
    if (days >= 365) {
      days++;
    }
  }
  gy += 4 * div(days, 1461);
  days %= 1461;
  if (days > 365) {
    gy += div(days - 1, 365);
    days = (days - 1) % 365;
  }
  const gd = days + 1;
  const salA = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  let dayAcc = gd;
  for (gm = 1; gm <= 12 && dayAcc > salA[gm]; gm++) {
    dayAcc -= salA[gm];
  }
  return { gy, gm, gd: dayAcc };
}

export function isJalaliLeap(jy: number): boolean {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
  ];
  const bl = breaks.length;
  let jp = breaks[0];
  let jump = 0;
  for (let i = 1; i < bl; i++) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) {
      break;
    }
    jp = jm;
  }
  let n = jy - jp;
  if (jump - n < 6) {
    n = n - jump + div(jump + 4, 33) * 33;
  }
  let leap = (((n + 1) % 33) - 1) % 4;
  if (leap === -1) {
    leap = 4;
  }
  return leap === 0;
}

export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) {
    return 31;
  }
  if (jm <= 11) {
    return 30;
  }
  return isJalaliLeap(jy) ? 30 : 29;
}

/** Saturday-based weekday index 0..6 for a Jalali date. */
export function jalaliWeekdayIndex(jy: number, jm: number, jd: number): number {
  const g = jalaliToGregorian(jy, jm, jd);
  const date = new Date(g.gy, g.gm - 1, g.gd);
  // JS: 0=Sun .. 6=Sat → Persian week starts Saturday
  return (date.getDay() + 1) % 7;
}

export function isoToJalali(iso: string): JalaliDate | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return null;
  }
  const [y, m, d] = iso.split('-').map(Number);
  return gregorianToJalali(y, m, d);
}

export function jalaliToIso(jy: number, jm: number, jd: number): string {
  const g = jalaliToGregorian(jy, jm, jd);
  const mm = String(g.gm).padStart(2, '0');
  const dd = String(g.gd).padStart(2, '0');
  return `${g.gy}-${mm}-${dd}`;
}

export function formatJalaliDisplay(jy: number, jm: number, jd: number): string {
  const fa = (n: number) => n.toLocaleString('fa-IR', { useGrouping: false });
  return `${fa(jy)}/${fa(jm)}/${fa(jd)}`;
}

export function todayJalali(): JalaliDate {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
