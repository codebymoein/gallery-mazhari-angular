import { describe, expect, it } from 'vitest';
import {
  gregorianToJalali,
  isoToJalali,
  jalaliMonthLength,
  jalaliToGregorian,
  jalaliToIso,
} from './jalali';

describe('Jalali date utilities', () => {
  it('converts Nowruz in both directions', () => {
    expect(gregorianToJalali(2024, 3, 20)).toEqual({
      jy: 1403,
      jm: 1,
      jd: 1,
    });
    expect(jalaliToGregorian(1403, 1, 1)).toEqual({
      gy: 2024,
      gm: 3,
      gd: 20,
    });
  });

  it('round-trips representative dates', () => {
    for (const iso of ['2024-03-20', '2025-01-01', '2026-07-31']) {
      const jalali = isoToJalali(iso);
      expect(jalali).not.toBeNull();
      expect(jalaliToIso(jalali!.jy, jalali!.jm, jalali!.jd)).toBe(iso);
    }
  });

  it('rejects malformed ISO input and reports month lengths', () => {
    expect(isoToJalali('2026/07/31')).toBeNull();
    expect(jalaliMonthLength(1403, 1)).toBe(31);
    expect(jalaliMonthLength(1403, 7)).toBe(30);
    expect(jalaliMonthLength(1402, 12)).toBe(29);
  });
});
