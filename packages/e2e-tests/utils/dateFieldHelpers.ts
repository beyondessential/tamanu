import { Locator, Page, expect } from '@playwright/test';
import { format, parse, isValid } from 'date-fns';

// Must match DISPLAY_FORMATS in packages/ui-components/src/components/Field/DateField.jsx
const DATE_DISPLAY_FORMAT = 'dd/MM/yyyy';
const DATETIME_DISPLAY_FORMAT = 'dd/MM/yyyy hh:mm a';
const TIME_DISPLAY_FORMAT = 'hh:mm a';

/**
 * Resolve the MUI textbox input inside a date field container.
 * Works for DatePicker, DateTimePicker, and TimePicker fields.
 */
export function muiDateTextbox(fieldRoot: Locator): Locator {
  return fieldRoot.getByRole('textbox');
}

// ---------------------------------------------------------------------------
// Format conversion — ISO ↔ MUI display strings
// ---------------------------------------------------------------------------

/**
 * Convert an ISO date string (yyyy-MM-dd) to the display format the MUI
 * DatePicker shows in its text field (dd/MM/yyyy).
 */
export function formatDateForInput(isoDate: string): string {
  const date = parseIsoish(isoDate);
  return format(date, DATE_DISPLAY_FORMAT);
}

/**
 * Convert an ISO-ish datetime string to the display format the MUI
 * DateTimePicker shows (dd/MM/yyyy hh:mm a).
 *
 * Accepted inputs: yyyy-MM-dd'T'HH:mm, yyyy-MM-dd HH:mm:ss, Date objects.
 */
export function formatDateTimeForInput(isoDateTime: string | Date): string {
  const date = isoDateTime instanceof Date ? isoDateTime : parseIsoish(isoDateTime);
  return format(date, DATETIME_DISPLAY_FORMAT);
}

/**
 * Convert an ISO-ish time or datetime string to the display format the MUI
 * TimePicker shows (hh:mm a).
 */
export function formatTimeForInput(isoTime: string | Date): string {
  const date = isoTime instanceof Date ? isoTime : parseIsoish(isoTime);
  return format(date, TIME_DISPLAY_FORMAT);
}

/**
 * Parse a MUI display-format date string back to ISO yyyy-MM-dd.
 * Returns null if the string is not a valid date.
 */
export function parseDateDisplayToIso(display: string): string | null {
  const date = parse(display.trim(), DATE_DISPLAY_FORMAT, new Date());
  return isValid(date) ? format(date, 'yyyy-MM-dd') : null;
}

// ---------------------------------------------------------------------------
// Interaction helpers — fill MUI date/datetime/time fields from ISO values
// ---------------------------------------------------------------------------

/**
 * Fill a MUI DatePicker textbox with an ISO date string (yyyy-MM-dd).
 * Converts to display format, types it in, and blurs to commit the value.
 */
export async function fillDateField(textbox: Locator, isoDate: string): Promise<void> {
  const display = formatDateForInput(isoDate);
  await clearAndType(textbox, display);
}

/**
 * Fill a MUI DateTimePicker textbox with an ISO-ish datetime string.
 * Converts to display format, types it in, and blurs to commit the value.
 */
export async function fillDateTimeField(
  textbox: Locator,
  isoDateTime: string | Date,
): Promise<void> {
  const display = formatDateTimeForInput(isoDateTime);
  await clearAndType(textbox, display);
}

/**
 * Fill a MUI TimePicker textbox with an ISO-ish time string.
 * Converts to display format, types it in, and blurs to commit the value.
 */
export async function fillTimeField(textbox: Locator, isoTime: string | Date): Promise<void> {
  const display = formatTimeForInput(isoTime);
  await clearAndType(textbox, display);
}

/**
 * Read the raw input value from a MUI date/datetime/time textbox.
 */
export async function readDateFieldValue(textbox: Locator): Promise<string> {
  return textbox.inputValue();
}

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

/**
 * Assert that a MUI date textbox currently holds a value matching the given
 * ISO date string (compared via display format).
 */
export async function expectDateFieldValue(textbox: Locator, expectedIso: string): Promise<void> {
  const expectedDisplay = formatDateForInput(expectedIso);
  await expect(textbox).toHaveValue(expectedDisplay);
}

/**
 * Assert that a MUI datetime textbox currently holds a value matching the
 * given ISO datetime string (compared via display format).
 */
export async function expectDateTimeFieldValue(
  textbox: Locator,
  expectedIso: string | Date,
): Promise<void> {
  const expectedDisplay = formatDateTimeForInput(expectedIso);
  await expect(textbox).toHaveValue(expectedDisplay);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function clearAndType(textbox: Locator, displayValue: string): Promise<void> {
  await textbox.click();
  await textbox.press('ControlOrMeta+a');
  await textbox.fill(displayValue);
  await textbox.press('Tab');
}

function parseIsoish(value: string): Date {
  // Try date-only format first (yyyy-MM-dd) to avoid UTC midnight parsing issues
  let date = parse(value, 'yyyy-MM-dd', new Date());
  if (isValid(date)) return date;

  // Fallback: yyyy-MM-dd HH:mm:ss (ISO 9075 / SQL style)
  date = parse(value, 'yyyy-MM-dd HH:mm:ss', new Date());
  if (isValid(date)) return date;

  // Fallback: native Date (handles ISO 8601 and yyyy-MM-dd'T'HH:mm)
  date = new Date(value);
  if (isValid(date)) return date;

  throw new Error(`Cannot parse date value: "${value}"`);
}
