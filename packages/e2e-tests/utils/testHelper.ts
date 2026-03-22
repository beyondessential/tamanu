import { Locator, Page, expect } from '@playwright/test';
import { subYears, addYears, format, parse, isValid } from 'date-fns';

import { SidebarPage } from '../pages/SidebarPage';

export const STYLED_TABLE_CELL_PREFIX = 'styledtablecell-2gyy-';

/** Facility column uses `location.facility.name`; match the name shown in the app chrome. */
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
 * Parse date strings as they appear in Tamanu (ISO / ISO-prefix from inputs, MUI-style dd/MM display, etc.).
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

// Utility method to convert stored / form dates to MM/dd/yyyy for assertions (US-style)
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
 * DateDisplay uses locale-specific ordering; the table cell match is substring-based, so try both orderings.
 */
export function dateTableMatchStrings(dateGiven: string | undefined): string[] {
  if (!dateGiven) return ['Unknown'];
  const parsed = parseTamanuDate(dateGiven.trim());
  if (!parsed) {
    return [convertDateFormat(dateGiven)];
  }
  return [format(parsed, 'MM/dd/yyyy'), format(parsed, 'dd/MM/yyyy')];
}

/** Normalize raw picker / ISO / display input to yyyy-MM-dd. */
export function normalizeToIsoDate(raw: string): string {
  const parsed = parseTamanuDate(raw);
  if (parsed && isValid(parsed)) {
    return format(parsed, 'yyyy-MM-dd');
  }
  return raw;
}

/** Format for MUI datetime pickers that expect `dd/MM/yyyy hh:mm a` (plain `yyyy-MM-dd` may not commit). */
export function formatForMuiDateTimePicker(isoDate: string): string {
  const parsed = parseTamanuDate(isoDate.trim());
  if (!parsed || !isValid(parsed)) {
    return isoDate;
  }
  return format(parsed, 'dd/MM/yyyy hh:mm a');
}

/**
 * Utility method to handle search box suggestions
 * @param searchBox The search box locator
 * @param suggestionList The suggestion list locator
 * @param searchText The text to search for
 * @param timeout Optional timeout in milliseconds (default: 5000)
 * @throws Error if the suggestion is not found in the list
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
 * Utility method to get table items
 * @param page 
 * @param tableRowCount 
 * @param columnName 
 * @returns An array of table items
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
 * Formats a date to 'MM/dd/yyyy h:mmam' style (lowercase am/pm, no space) to match the app's display format.
 * @param date - The Date object to format
 * @returns Formatted string (e.g., "02/12/2026 9:31am")
 */
export function formatDateTimeForDisplay(date: Date): string {
  return format(date, 'MM/dd/yyyy h:mm a').replace(' AM', 'am').replace(' PM', 'pm');
}

/**
 * Converts a dateTime string (format: "2025-12-01T06:11") to table format (format: "6:11am12/01/25")
 * @param dateTimeString - ISO format dateTime string (e.g., "2025-12-01T06:11")
 * @returns Formatted string matching table display format (e.g., "6:11am12/01/25")
 */
export function formatDateTimeForTable(dateTimeString: string): string {
  const dateFromForm = new Date(dateTimeString);
  const formattedTime = format(dateFromForm, 'h:mm a').replace(' ', '').toLowerCase(); // "6:11am"
  const formattedDate = format(dateFromForm, 'MM/dd/yy'); // "12/01/25"
  return `${formattedTime}${formattedDate}`; // "6:11am12/01/25"
}

/**
 * Utility function for sorting alphabetically
 * @param order - The order to sort by, e.g. "asc" or "desc"
 * @returns A function that compares two strings alphabetically
 */
export function compareAlphabetically(order: 'asc' | 'desc') {
  return (a: string, b: string) =>
    order === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
}

/**
 * Utility function for sorting by date
 * @param order - The order to sort by, e.g. "asc" or "desc"
 * @returns A function that compares two dates
 */
export function compareByDate(order: 'asc' | 'desc') {
  return (a: { dateGiven: string }, b: { dateGiven: string }) => {
    const dateA = new Date(a.dateGiven).getTime();
    const dateB = new Date(b.dateGiven).getTime();
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  };
}

/**
 * Utility method to offset a date by a given amount of years and return in YYYY-MM-DD format
 * @param dateToOffset - The date to offset
 * @param offset - The offset to apply ('increase' or 'decrease')
 * @param amountToOffset - The amount of years to offset
 * @returns The date with the offset applied in YYYY-MM-DD format
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

// Reusable function to select first option from any dropdown
export const selectFirstFromDropdown = async (page: Page, input: Locator): Promise<string> => {
  await input.click();
  const firstOption = page.locator('[role="listbox"] li').first();
  await firstOption.click();
  return await firstOption.textContent() || '';
};

/**
 * Asserts that a datetime input field contains a recent datetime value
 * @param inputLocator - The locator for the datetime input field
 * @param dateFormat - The format string for parsing the date (e.g., 'yyyy-MM-dd\'T\'HH:mm')
 * @param thresholdMinutes - Optional threshold in minutes for what is considered "recent" (default: 2)
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
