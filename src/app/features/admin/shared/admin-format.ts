/** Shared formatting helpers for admin money/dates (fa-IR). */

export function formatToman(value: number): string {
  try {
    return new Intl.NumberFormat('fa-IR').format(Math.round(value)) + ' تومان';
  } catch {
    return `${value} تومان`;
  }
}

export function formatFaDate(iso: string, withTime = true): string {
  try {
    return new Intl.DateTimeFormat(
      'fa-IR',
      withTime
        ? { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        : { year: 'numeric', month: 'short', day: 'numeric' }
    ).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 }).format(value / 1_000_000_000)} میلیارد`;
  }
  if (value >= 1_000_000) {
    return `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 }).format(value / 1_000_000)} میلیون`;
  }
  return new Intl.NumberFormat('fa-IR').format(value);
}
