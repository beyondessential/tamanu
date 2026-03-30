import { Locator, Page, expect } from '@playwright/test';
import { addYears, format, isValid, parse, subYears } from 'date-fns';

const DISPLAY_PATTERNS = [
  'dd/MM/yyyy hh:mm a',
  'dd/MM/yyyy h:mm a',
  'dd/MM/yyyy',
] as const;

/**
 * Parse any date format used in Tamanu tests or UI.
 * Accepts ISO date/datetime, dd/MM/yyyy display formats.
 * Throws on unparseable input — never silently returns garbage.
 */
export function parseDate(raw: string): Date {
  const s = raw.trim();
  if (!s) throw new Error('Empty date string');

  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (isValid(d)) return d;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = parse(s, 'yyyy-MM-dd', new Date());
    if (isValid(d)) return d;
  }

  for (const pattern of DISPLAY_PATTERNS) {
    const d = parse(s, pattern, new Date());
    if (isValid(d)) return d;
  }

  throw new Error(`Cannot parse date: "${raw}"`);
}

// ---------------------------------------------------------------------------
// Input helpers — fill MUI date/time fields from ISO test data
// ---------------------------------------------------------------------------

/** Fill an MUI date-only field. Pass ISO: `'2025-03-15'` */
export async function fillDate(field: Locator, isoDate: string): Promise<void> {
  await field.fill(format(parseDate(isoDate), 'dd/MM/yyyy'));
  await field.blur();
}

/** Fill an MUI date-time field. Pass ISO: `'2025-03-15T14:30'` */
export async function fillDateTime(field: Locator, isoDateTime: string): Promise<void> {
  await field.fill(format(parseDate(isoDateTime), 'dd/MM/yyyy hh:mm a'));
  await field.blur();
}

/** Fill an MUI time-only field. Pass 24h: `'14:30'` */
export async function fillTime(field: Locator, time24h: string): Promise<void> {
  const d = parse(time24h.trim(), 'HH:mm', new Date());
  if (!isValid(d)) throw new Error(`Cannot parse time: "${time24h}"`);
  await field.fill(format(d, 'hh:mm a'));
  await field.blur();
}

// ---------------------------------------------------------------------------
// Format converters — turn ISO/Date into display strings for assertions
// ---------------------------------------------------------------------------

/** `'2025-03-15'` → `'15/03/2025'` (dd/MM/yyyy) — MUI field display */
export function toDisplayDate(v: string | Date): string {
  const d = v instanceof Date ? v : parseDate(v);
  return format(d, 'dd/MM/yyyy');
}

/** `'2025-03-15T14:30'` → `'15/03/2025 02:30 PM'` (dd/MM/yyyy hh:mm a) */
export function toDisplayDateTime(v: string | Date): string {
  const d = v instanceof Date ? v : parseDate(v);
  return format(d, 'dd/MM/yyyy hh:mm a');
}

/** `'2025-03-15'` → `'03/15/2025'` (MM/dd/yyyy) — US-style table display */
export function toTableDate(v: string | Date): string {
  const d = v instanceof Date ? v : parseDate(v);
  return format(d, 'MM/dd/yyyy');
}

/** `'2025-03-15T06:11'` → `'6:11am03/15/25'` — compact table datetime */
export function toTableDateTime(v: string | Date): string {
  const d = v instanceof Date ? v : parseDate(v);
  const time = format(d, 'h:mm a').replace(' ', '').toLowerCase();
  return `${time}${format(d, 'MM/dd/yy')}`;
}

/** `'2025-03-15T09:31'` → `'03/15/2025 9:31am'` — long display datetime */
export function toLongDisplayDateTime(v: string | Date): string {
  const d = v instanceof Date ? v : parseDate(v);
  return format(d, 'MM/dd/yyyy h:mm a').replace(' AM', 'am').replace(' PM', 'pm');
}

// ---------------------------------------------------------------------------
// Normalizers — turn any format back to ISO for comparison
// ---------------------------------------------------------------------------

/** Normalize to `'yyyy-MM-dd'` */
export function toIsoDate(raw: string): string {
  return format(parseDate(raw), 'yyyy-MM-dd');
}

/** Normalize to `'yyyy-MM-ddTHH:mm'` */
export function toIsoDateTime(raw: string): string {
  return format(parseDate(raw), "yyyy-MM-dd'T'HH:mm");
}

// ---------------------------------------------------------------------------
// Browser-time helpers
// ---------------------------------------------------------------------------

/** Get current datetime as `'yyyy-MM-ddTHH:mm'` from the browser (matching app TZ). */
export async function getBrowserDateTime(page: Page): Promise<string> {
  return page.evaluate(() => {
    const n = new Date();
    const p = (v: number) => v.toString().padStart(2, '0');
    return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}T${p(n.getHours())}:${p(n.getMinutes())}`;
  });
}

/** Get current date as `'yyyy-MM-dd'` from the browser. */
export async function getBrowserDate(page: Page): Promise<string> {
  return page.evaluate(() => {
    const n = new Date();
    const p = (v: number) => v.toString().padStart(2, '0');
    return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
  });
}

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

/** Assert a datetime input is within `thresholdMinutes` of now (browser clock). */
export async function expectRecentDateTime(
  inputLocator: Locator,
  thresholdMinutes = 2,
): Promise<void> {
  const raw = await inputLocator.inputValue();
  if (!raw?.trim()) throw new Error('Datetime input value is empty');

  const diff = await inputLocator.page().evaluate((val: string) => {
    const dtm = val.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s+(AM|PM)$/i);
    const dm = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    let d: Date;
    if (dtm) {
      const [, dd, mm, yyyy, hh, min, ap] = dtm;
      let h = parseInt(hh);
      if (ap.toUpperCase() === 'PM' && h !== 12) h += 12;
      if (ap.toUpperCase() === 'AM' && h === 12) h = 0;
      d = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), h, parseInt(min));
    } else if (dm) {
      const [, dd, mm, yyyy] = dm;
      d = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
    } else {
      d = new Date(val);
    }
    if (isNaN(d.getTime())) throw new Error(`Cannot parse: ${val}`);
    return Math.abs((Date.now() - d.getTime()) / 60000);
  }, raw);

  expect(diff).toBeLessThan(thresholdMinutes);
}

/**
 * Build candidate strings for date matching when locale may flip day/month.
 * Returns both `['MM/dd/yyyy', 'dd/MM/yyyy']` to cover either rendering.
 */
export function dateMatchStrings(isoDate: string | undefined): string[] {
  if (!isoDate) return ['Unknown'];
  const d = parseDate(isoDate);
  return [format(d, 'MM/dd/yyyy'), format(d, 'dd/MM/yyyy')];
}

// ---------------------------------------------------------------------------
// Date arithmetic
// ---------------------------------------------------------------------------

/** Shift a date by `years` (positive = forward, negative = backward). Returns `'yyyy-MM-dd'`. */
export function shiftYears(isoDate: string, years: number): string {
  const d = parseDate(isoDate);
  const shifted = years >= 0 ? addYears(d, years) : subYears(d, Math.abs(years));
  return format(shifted, 'yyyy-MM-dd');
}

/** Sort comparator for objects with a `dateGiven` string field. */
export function compareDates(order: 'asc' | 'desc') {
  return (a: { dateGiven: string }, b: { dateGiven: string }) => {
    const da = new Date(a.dateGiven).getTime();
    const db = new Date(b.dateGiven).getTime();
    return order === 'asc' ? da - db : db - da;
  };
}
