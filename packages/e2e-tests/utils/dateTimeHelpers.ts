import { Locator, expect } from '@playwright/test';
import { addYears, format, isValid, parse, subYears } from 'date-fns';

const DISPLAY_DATE_TIME_PATTERNS = [
  'dd/MM/yyyy hh:mm a',
  'dd/MM/yyyy h:mm a',
  'dd/MM/yyyy',
] as const;

/**
 * Parse values from the app or tests: ISO (`yyyy-MM-dd` or `yyyy-MM-ddTHH:mm…`), then MUI-style `dd/MM/…` text.
 * ISO datetimes use `new Date` so the time is preserved; bare `yyyy-MM-dd` uses calendar-day parsing (no TZ shift).
 * If the string starts with `yyyy-MM-dd` but has trailing characters (e.g. space + time without `T`), uses
 * `new Date(trimmed)` so the time is not dropped. Does **not** fall back to a bare `new Date` for arbitrary
 * strings — that would be locale-dependent (e.g. `01/02/2025`) and hide parse failures in tests.
 */
export function parseTamanuDate(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    const fromIso = new Date(trimmed);
    if (isValid(fromIso)) return fromIso;
  }

  const isoDate = trimmed.match(/^(\d{4}-\d{2}-\d{2})([\s\S]*)$/);
  if (isoDate) {
    const datePart = isoDate[1];
    const rest = isoDate[2].trim();
    if (!rest) {
      const d = parse(datePart, 'yyyy-MM-dd', new Date());
      return isValid(d) ? d : null;
    }
    const fromNative = new Date(trimmed);
    if (isValid(fromNative)) return fromNative;
  }

  for (const pattern of DISPLAY_DATE_TIME_PATTERNS) {
    const d = parse(trimmed, pattern, new Date());
    if (isValid(d)) return d;
  }

  return null;
}

/** Format test/ISO data for **MUI date-time text fields** (`dd/MM/yyyy hh:mm a`). On failure returns the input. */
export function formatForMuiDateTimePicker(isoDate: string): string {
  const parsed = parseTamanuDate(isoDate);
  if (!parsed) return isoDate;
  return format(parsed, 'dd/MM/yyyy hh:mm a');
}

/** Format test/ISO data for **MUI date-only** fields (`dd/MM/yyyy`). */
export function formatForMuiDatePicker(isoDate: string): string {
  const parsed = parseTamanuDate(isoDate.trim());
  if (!parsed) return isoDate;
  return format(parsed, 'dd/MM/yyyy');
}

/**
 * Format a 24h wall time (`HH:mm`) for MUI TimePicker text fields (`DISPLAY_FORMATS.time` in ui-components: `hh:mm a`).
 */
export function formatForMuiTimePicker(hhmm24: string): string {
  const trimmed = hhmm24.trim();
  const parsed = parse(trimmed, 'HH:mm', new Date());
  if (!isValid(parsed)) {
    return trimmed;
  }
  return format(parsed, 'hh:mm a');
}

/**
 * Shared app date fields use the same MUI-style text format (`dd/MM/yyyy` or `dd/MM/yyyy hh:mm a`).
 * Fill with {@link fillMuiDateField}, {@link fillMuiDateTimeField}, or {@link fillMuiTimeField}
 * using ISO-like test fixtures (`yyyy-MM-dd`, `yyyy-MM-dd'T'HH:mm`, `HH:mm` for time-only).
 * Assert with {@link normalizeToIsoDate} / {@link normalizeToIsoDateTimeMinute} on `inputValue()` when needed.
 */

/**
 * Fill an MUI **date-only** field and blur so Formik receives the value.
 */
export async function fillMuiDateField(field: Locator, date: string): Promise<void> {
  await field.fill(formatForMuiDatePicker(date));
  await field.blur();
}

/**
 * Fill an MUI **date-time** field and blur so Formik receives the value.
 */
export async function fillMuiDateTimeField(field: Locator, dateTime: string): Promise<void> {
  await field.fill(formatForMuiDateTimePicker(dateTime));
  await field.blur();
}

/**
 * Fill an MUI **time** field (`HH:mm` test data → `hh:mm a` display) and blur so Formik receives the value.
 */
export async function fillMuiTimeField(field: Locator, time: string): Promise<void> {
  await field.fill(formatForMuiTimePicker(time));
  await field.blur();
}

/**
 * Normalize a test or DOM date value to the canonical short date the app renders: `dd/MM/yyyy`.
 *
 * Playwright forces `locale: 'en-AU'` (see `playwright.config.ts`), so every `Intl`-driven short
 * date in the UI comes out day-first. Tests assert against that single format.
 *
 * **Behaviour**
 * - `undefined` / missing → `''`.
 * - `Date` → formatted with `date-fns` if valid, else `''`.
 * - String → try {@link parseTamanuDate}; if that fails, a naive `yyyy-MM-dd` split → `dd/MM/yyyy`.
 *
 * @param dateInput — ISO string, picker output fragment, or `Date` from test data.
 * @returns `dd/MM/yyyy` or `''` when empty/Unparsable.
 */
export const convertDateFormat = (dateInput: string | Date | undefined): string => {
  if (!dateInput) return '';

  if (dateInput instanceof Date) {
    return isValid(dateInput) ? format(dateInput, 'dd/MM/yyyy') : '';
  }

  const parsed = parseTamanuDate(String(dateInput));
  if (parsed) {
    return format(parsed, 'dd/MM/yyyy');
  }

  const s = String(dateInput).trim();
  const [year, month, day] = s.split('-');
  if (year && month && day) {
    return `${day}/${month}/${year}`;
  }
  return '';
};

/**
 * Resolve the substring used to find a date row in a table cell.
 *
 * Returns the placeholder `'Unknown'` when no date is supplied (matches the empty-cell render in some
 * specs); otherwise delegates to {@link convertDateFormat}. Kept as a thin wrapper so callers can stay
 * intent-revealing even though the locale is now fixed.
 */
export function dateTableMatchString(dateGiven: string | undefined): string {
  if (!dateGiven) return 'Unknown';
  return convertDateFormat(dateGiven);
}

/**
 * Normalize any supported string to `yyyy-MM-dd` for comparisons.
 *
 * @throws Error when the value cannot be parsed — avoids assertions passing with unnormalized strings.
 */
export function normalizeToIsoDate(raw: string): string {
  const parsed = parseTamanuDate(raw);
  if (!parsed) {
    throw new Error(`Could not parse date for normalization: ${raw}`);
  }
  return format(parsed, 'yyyy-MM-dd');
}

/**
 * Normalize a datetime input value to `yyyy-MM-dd'T'HH:mm` (24h, no seconds).
 *
 * @throws Error when the value cannot be parsed — avoids assertions passing with unnormalized strings.
 */
export function normalizeToIsoDateTimeMinute(raw: string): string {
  const parsed = parseTamanuDate(raw);
  if (!parsed) {
    throw new Error(`Could not parse date-time for normalization: ${raw}`);
  }
  return format(parsed, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Format a `Date` to match **on-screen datetime copy** in parts of the app: `dd/MM/yyyy` + 12h time with
 * **lowercase** `am`/`pm` and no space before meridiem (e.g. `12/02/2026 9:31am`).
 *
 * @param date — Instant to format (local time per `date-fns` `format`).
 */
export function formatDateTimeForDisplay(date: Date): string {
  return format(date, 'dd/MM/yyyy h:mm a').replace(' AM', 'am').replace(' PM', 'pm');
}

/**
 * Convert a datetime string into the **concatenated** table display form used in some grids:
 * **time** (`h:mm` + lowercase `am`/`pm`, no space) immediately followed by **date** `dd/MM/yy`
 * (e.g. `6:11am01/12/25`).
 *
 * Accepts ISO-like (`2025-12-01T06:11`) and MUI display (`dd/MM/yyyy hh:mm a`) formats.
 *
 * @param dateTimeString — Typically from a form field or API fixture.
 */
export function formatDateTimeForTable(dateTimeString: string): string {
  const dateFromForm = parseTamanuDate(dateTimeString);
  if (!dateFromForm) {
    throw new Error(`Could not parse date for table formatting: ${dateTimeString}`);
  }
  const formattedTime = format(dateFromForm, 'h:mm a').replace(' ', '').toLowerCase(); // "6:11am"
  const formattedDate = format(dateFromForm, 'dd/MM/yy'); // "01/12/25"
  return `${formattedTime}${formattedDate}`; // "6:11am01/12/25"
}

/**
 * Comparator factory for sorting objects with a **`dateGiven`** ISO-like string (e.g. vaccine rows).
 *
 * Uses `new Date(...).getTime()`; invalid date strings sort as `NaN` and may behave unpredictably—keep test
 * data parseable.
 *
 * @param order — `'asc'` (oldest first) or `'desc'` (newest first).
 */
export function compareByDate(order: 'asc' | 'desc') {
  return (a: { dateGiven: string }, b: { dateGiven: string }) => {
    const dateA = new Date(a.dateGiven).getTime();
    const dateB = new Date(b.dateGiven).getTime();
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  };
}

/**
 * Comparator factory for sorting arrays of **display** short-date strings (`dd/MM/yyyy`, as rendered
 * by the UI in tables like the patient list). Delegates to {@link parseTamanuDate} so tests never
 * need to know the cell format — if the UI's short-date format changes, update `parseTamanuDate` and
 * every sort comparator follows.
 *
 * Unparsable entries sort to the end.
 *
 * @param order — `'asc'` (oldest first) or `'desc'` (newest first).
 */
export function compareDisplayDates(order: 'asc' | 'desc') {
  const direction = order === 'asc' ? 1 : -1;
  return (a: string, b: string) => {
    const ta = parseTamanuDate(a)?.getTime() ?? NaN;
    const tb = parseTamanuDate(b)?.getTime() ?? NaN;
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return direction * (ta - tb);
  };
}

/**
 * Shift a calendar date by a whole number of years; returns **`yyyy-MM-dd`** for fixtures and inputs.
 *
 * **Use case** — Age boundaries, eligibility windows, “same day next year” vaccine tests.
 *
 * @param dateToOffset — Parseable date string (passed to `new Date`).
 * @param offset — `'increase'` or `'decrease'`.
 * @param amountToOffset — Non-negative year delta (applied via `date-fns` `addYears` / `subYears`).
 * @throws Error when `offset` is not `'increase'` or `'decrease'`.
 */
export function offsetYear(
  dateToOffset: string,
  offset: 'increase' | 'decrease',
  amountToOffset: number,
): string {
  const formattedDateToOffset = new Date(dateToOffset);
  let newDate = undefined;

  if (offset === 'increase') newDate = addYears(formattedDateToOffset, amountToOffset);
  else if (offset === 'decrease') newDate = subYears(formattedDateToOffset, amountToOffset);
  else throw new Error('Invalid offset');

  return format(newDate, 'yyyy-MM-dd');
}

/**
 * Assert the value of a datetime **input** is within `thresholdMinutes` of “now” (wall clock).
 *
 * **Use case** — Fields defaulting to current date/time on open (e.g. new imaging request).
 *
 * **Parsing** — Accepts MUI display strings and ISO-like values (see {@link parseTamanuDate}).
 *
 * @param inputLocator — `input` or element exposing `.inputValue()`.
 * @param thresholdMinutes — Max absolute difference in minutes (default 2).
 */
export async function assertRecentDateTime(
  inputLocator: Locator,
  thresholdMinutes: number = 2,
): Promise<void> {
  const raw = await inputLocator.inputValue();
  if (!raw?.trim()) {
    throw new Error('Datetime input value is empty');
  }
  // Parse and compare inside the browser so the timezone matches the app
  const timeDifferenceMinutes = await inputLocator.page().evaluate((rawValue: string) => {
    const dateTimeMatch = rawValue.match(
      /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s+(AM|PM)$/i,
    );
    const dateOnlyMatch = rawValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    let parsed: Date;
    if (dateTimeMatch) {
      const [, dd, mm, yyyy, hh, min, ampm] = dateTimeMatch;
      let hours = parseInt(hh, 10);
      if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      parsed = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), hours, parseInt(min));
    } else if (dateOnlyMatch) {
      const [, dd, mm, yyyy] = dateOnlyMatch;
      parsed = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
    } else {
      parsed = new Date(rawValue);
    }

    if (isNaN(parsed.getTime())) {
      throw new Error(`Could not parse datetime input value: ${rawValue}`);
    }

    return Math.abs((Date.now() - parsed.getTime()) / (1000 * 60));
  }, raw);

  expect(timeDifferenceMinutes).toBeLessThan(thresholdMinutes);
}
