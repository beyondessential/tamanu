import { Locator, Page, expect } from '@playwright/test';
import { subYears, addYears, format, parse, isValid } from 'date-fns';

import { SidebarPage } from '../pages/SidebarPage';

/**
 * Prefix for `data-testid` on cells in the app’s styled data tables (e.g. patient lists).
 *
 * Row `i`, column semantic id `columnName` → `getByTestId(\`${STYLED_TABLE_CELL_PREFIX}${i}-${columnName}\`)`.
 * Keep this in sync with the table implementation if testids change.
 */
export const STYLED_TABLE_CELL_PREFIX = 'styledtablecell-2gyy-';

/**
 * Returns the facility name as shown in the sidebar (current facility context).
 *
 * Use when a table column or modal shows “facility” and it must match the same string as the app chrome
 * (e.g. immunisation display location for vaccines given at the current facility).
 *
 * @param page — Playwright page (must be on a layout that renders {@link SidebarPage}).
 * @returns Display name string from the sidebar; may be empty if the facility control is missing or not loaded.
 */
export async function getSidebarFacilityDisplayName(page: Page): Promise<string> {
  const sidebar = new SidebarPage(page);
  return sidebar.getFacilityName();
}

const DISPLAY_DATE_TIME_PATTERNS = [
  'dd/MM/yyyy hh:mm a',
  'dd/MM/yyyy h:mm a',
  'dd/MM/yyyy',
] as const;

/**
 * Parse a date string the way Tamanu / MUI surfaces typically expose it in the browser.
 *
 * **Recognized shapes (first match wins)**
 * 1. **ISO date prefix** — `yyyy-MM-dd` at the start of the string (time or suffix allowed after); calendar date only.
 * 2. **Display / picker strings** — `date-fns` parse with:
 *    - `dd/MM/yyyy hh:mm a` / `dd/MM/yyyy h:mm a` / `dd/MM/yyyy` (common MUI-style text).
 *
 * **Returns**
 * - A valid `Date` in local parsing semantics, or `null` if nothing matches or the result is invalid.
 *
 * **Typical use** — Building other helpers or custom assertions. Most tests should use the higher-level format
 * functions below so the intended surface (assertion vs picker vs ISO) stays explicit.
 *
 * @param raw — Untrimmed input is trimmed before parsing.
 */
export function parseTamanuDate(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;

  const isoDate = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDate) {
    const d = parse(isoDate[1], 'yyyy-MM-dd', new Date());
    return isValid(d) ? d : null;
  }

  for (const pattern of DISPLAY_DATE_TIME_PATTERNS) {
    const d = parse(s, pattern, new Date());
    if (isValid(d)) return d;
  }

  return null;
}

/**
 * Normalize a test or DOM date value to **US-style short date** `MM/dd/yyyy` for text assertions.
 *
 * **Used for** `toContainText`, table cell expectations, and anywhere the UI shows month-first short dates.
 *
 * **Behaviour**
 * - `undefined` / missing → `''`.
 * - `Date` → formatted with `date-fns` if valid, else `''`.
 * - String → try {@link parseTamanuDate}; if that fails, a naive `yyyy-MM-dd` split → `MM/DD/YYYY`.
 *
 * @param dateInput — ISO string, picker output fragment, or `Date` from test data.
 * @returns `MM/dd/yyyy` or `''` when empty/unparseable.
 */
export const convertDateFormat = (dateInput: string | Date | undefined): string => {
  if (!dateInput) return '';

  if (dateInput instanceof Date) {
    return isValid(dateInput) ? format(dateInput, 'MM/dd/yyyy') : '';
  }

  const parsed = parseTamanuDate(String(dateInput));
  if (parsed) {
    return format(parsed, 'MM/dd/yyyy');
  }

  const s = String(dateInput).trim();
  const [year, month, day] = s.split('-');
  if (year && month && day) {
    return `${month}/${day}/${year}`;
  }
  return '';
};

/**
 * Build candidate strings for **substring** matching a date in a table cell when locale may flip day/month order.
 *
 * Some cells render via `DateDisplay` (or similar) so the same calendar day can appear as `MM/dd/yyyy` or
 * `dd/MM/yyyy`. Playwright checks often use `includes`; passing both strings covers either rendering.
 *
 * **Returns**
 * - No `dateGiven` → `['Unknown']` (placeholder row convention in some specs).
 * - Parse succeeds → `[ MM/dd/yyyy, dd/MM/yyyy ]`.
 * - Parse fails → single fallback from {@link convertDateFormat}.
 *
 * @param dateGiven — Test data date string; `undefined` triggers the Unknown placeholder path.
 */
export function dateTableMatchStrings(dateGiven: string | undefined): string[] {
  if (!dateGiven) return ['Unknown'];
  const parsed = parseTamanuDate(dateGiven.trim());
  if (!parsed) {
    return [convertDateFormat(dateGiven)];
  }
  return [format(parsed, 'MM/dd/yyyy'), format(parsed, 'dd/MM/yyyy')];
}

/**
 * Normalize picker output, ISO fragments, or display text to **`yyyy-MM-dd`** for value comparisons.
 *
 * **Typical use** — Comparing two strings that should represent the same calendar day (e.g. input value vs test
 * data) when one side came from an MUI field (`dd/MM/…`) and the other from ISO.
 *
 * **Behaviour** — If {@link parseTamanuDate} yields a valid date, returns `yyyy-MM-dd`; otherwise returns
 * `raw` unchanged so callers still see the original string when parsing fails.
 *
 * @param raw — Typically `input.value` or a test fixture string.
 */
export function normalizeToIsoDate(raw: string): string {
  const parsed = parseTamanuDate(raw);
  if (parsed && isValid(parsed)) {
    return format(parsed, 'yyyy-MM-dd');
  }
  return raw;
}

/**
 * Format a date string for **typing into MUI date-time text fields** (keyboard / `.fill()`).
 *
 * Some MUI date-time pickers do not commit or behave correctly when filled with only `yyyy-MM-dd`; the app
 * expects display-shaped text such as `dd/MM/yyyy hh:mm a`.
 *
 * **Behaviour** — Parses via {@link parseTamanuDate}; on failure returns the original string so callers can
 * still attempt a fill for edge cases.
 *
 * @param isoDate — Usually ISO or ISO-like test data; trimmed before parse.
 */
export function formatForMuiDateTimePicker(isoDate: string): string {
  const parsed = parseTamanuDate(isoDate.trim());
  if (!parsed || !isValid(parsed)) {
    return isoDate;
  }
  return format(parsed, 'dd/MM/yyyy hh:mm a');
}

/**
 * Fill a search field and click a suggestion whose visible text equals `searchText`.
 *
 * **Flow** — `fill` → wait for search box visible → `getByText(searchText)` on the suggestion list → click.
 * **Note** — `getByText` matches by substring; `searchText` should be unique within the suggestion list for the scenario.
 *
 * @param searchBox — Input or combobox locator.
 * @param suggestionList — Popover/list locator containing clickable suggestions.
 * @param searchText — Label to click (must appear in the list).
 * @param timeout — Per-step wait budget in ms (default 10000).
 * @throws Error wrapping the underlying failure if the suggestion never becomes visible or click fails.
 */
export async function SelectingFromSearchBox(
  searchBox: Locator,
  suggestionList: Locator,
  searchText: string,
  timeout: number = 10000,
): Promise<void> {
  try {
    await searchBox.fill(searchText);
    await searchBox.waitFor({ state: 'visible', timeout });
    const suggestionOption = suggestionList.getByText(searchText);
    await suggestionOption.waitFor({ state: 'visible', timeout });
    await suggestionOption.click();
  } catch (error) {
    throw new Error(`Failed to handle search box suggestion: ${error instanceof Error ? error.message : String(error)}`);
  }
}
/**
 * Read text from a column across the first `tableRowCount` rows of a styled table.
 *
 * Uses {@link STYLED_TABLE_CELL_PREFIX} + row index + `columnName` as the `data-testid` suffix pattern.
 * Skips empty `textContent` (row may not render a cell or may be loading).
 *
 * @param page — Current page.
 * @param tableRowCount — Number of rows to read (0-based indices `0 .. tableRowCount-1`).
 * @param columnName — Test id suffix for the column (e.g. `dateOfBirth`).
 * @returns Array of strings in row order; length may be less than `tableRowCount` if some cells are empty.
 */
export async function getTableItems(page: Page, tableRowCount: number, columnName: string) {
  const items: string[] = [];
  for (let i = 0; i < tableRowCount; i++) {
    const itemLocator = page.getByTestId(`${STYLED_TABLE_CELL_PREFIX}${i}-${columnName}`);
    const itemText = await itemLocator.first().textContent();
    if (itemText) {
      items.push(itemText);
    }
  }
  return items;
}

/**
 * Format a `Date` to match **on-screen datetime copy** in parts of the app: `MM/dd/yyyy` + 12h time with
 * **lowercase** `am`/`pm` and no space before meridiem (e.g. `02/12/2026 9:31am`).
 *
 * @param date — Instant to format (local time per `date-fns` `format`).
 */
export function formatDateTimeForDisplay(date: Date): string {
  return format(date, 'MM/dd/yyyy h:mm a').replace(' AM', 'am').replace(' PM', 'pm');
}

/**
 * Convert an ISO-like datetime string (e.g. `2025-12-01T06:11`) into the **concatenated** table display form
 * used in some grids: **time** (`h:mm` + lowercase `am`/`pm`, no space) immediately followed by **date** `MM/dd/yy`
 * (e.g. `6:11am12/01/25`).
 *
 * **Parsing** — Uses `new Date(dateTimeString)`; invalid strings produce `Invalid Date` output from `date-fns`
 * (callers should pass values known to parse in the test environment).
 *
 * @param dateTimeString — Typically from a form field or API fixture.
 */
export function formatDateTimeForTable(dateTimeString: string): string {
  const dateFromForm = parse(dateTimeString, "dd/MM/yyyy hh:mm a", new Date());
  const formattedTime = format(dateFromForm, 'h:mm a').replace(' ', '').toLowerCase(); // "6:11am"
  const formattedDate = format(dateFromForm, 'MM/dd/yy'); // "12/01/25"
  return `${formattedTime}${formattedDate}`; // "6:11am12/01/25"
}

/**
 * Comparator factory for **locale-aware string sort** (e.g. vaccine names in table order assertions).
 *
 * @param order — `'asc'` or `'desc'`.
 * @returns `(a, b) => number` suitable for `Array.prototype.sort`.
 */
export function compareAlphabetically(order: 'asc' | 'desc') {
  return (a: string, b: string) =>
    order === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
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
  amountToOffset: number
): string {
  //Convert to date format so utility functions can be used
  const formattedDateToOffset = new Date(dateToOffset);
  let newDate = undefined;

  if (offset === 'increase') newDate = addYears(formattedDateToOffset, amountToOffset);
  else if (offset === 'decrease') newDate = subYears(formattedDateToOffset, amountToOffset);
  else throw new Error('Invalid offset');

  return format(newDate, 'yyyy-MM-dd');
}

/**
 * Open a generic **MUI listbox** dropdown and select the first `li` option.
 *
 * **Assumptions** — `[role="listbox"] li` exists after `input.click()`; not tied to app-specific testids.
 * Prefer {@link ./fieldHelpers.ts} `selectFieldOption` / `selectAutocompleteFieldOption` for Tamanu fields.
 *
 * @param page — Used to scope the listbox query.
 * @param input — Locator that opens the list on click.
 * @returns `textContent` of the first option, or `''` if missing.
 */
export const selectFirstFromDropdown = async (page: Page, input: Locator): Promise<string> => {
  await input.click();
  const firstOption = page.locator('[role="listbox"] li').first();
  await firstOption.click();
  return await firstOption.textContent() || '';
};

/**
 * Assert the value of a datetime **input** is within `thresholdMinutes` of “now” (wall clock).
 *
 * **Use case** — Fields defaulting to current date/time on open (e.g. new encounter).
 *
 * **Parsing** — Uses `date-fns` `parse` with your `dateFormat`; must match the input’s `value` shape exactly.
 *
 * @param inputLocator — `input` or element exposing `.inputValue()`.
 * @param dateFormat — `date-fns` format string matching the input `value` (e.g. ISO-local datetime with a `T` separator).
 * @param thresholdMinutes — Max absolute difference in minutes (default 2).
 */
export async function assertRecentDateTime(
  inputLocator: Locator,
  dateFormat: string,
  thresholdMinutes: number = 2,
): Promise<void> {
  const inputDateTimeValue = await inputLocator.inputValue();
  const parsedInputDate = parse(inputDateTimeValue, dateFormat, new Date());
  const now = new Date();
  const timeDifferenceMinutes = Math.abs((now.getTime() - parsedInputDate.getTime()) / (1000 * 60));
  expect(timeDifferenceMinutes).toBeLessThan(thresholdMinutes);
}
