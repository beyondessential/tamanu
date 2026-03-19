import { Locator, Page, expect } from '@playwright/test';
import { subYears, addYears, format, parse } from 'date-fns';

export const STYLED_TABLE_CELL_PREFIX = 'styledtablecell-2gyy-';

/**
 * Converts an ISO date to MM/dd/yyyy — matches the table display format
 * when the browser locale is en-US (Playwright default).
 */
export const convertDateFormat = (dateInput: string | Date | undefined): string => {
  if (!dateInput) return '';

  if (dateInput instanceof Date) {
    const day = String(dateInput.getDate()).padStart(2, '0');
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    return `${month}/${day}/${dateInput.getFullYear()}`;
  }

  if (dateInput.includes('-')) {
    const datePart = dateInput.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return `${month}/${day}/${year}`;
  }

  if (dateInput.includes('/')) {
    return dateInput.split(' ')[0];
  }

  return dateInput;
};

/**
 * Converts an ISO date to dd/MM/yyyy — matches the MUI DatePicker display
 * format used in Tamanu (DISPLAY_FORMATS.date in DateField.jsx).
 */
export const formatForDatePicker = (dateInput: string | Date | undefined): string => {
  if (!dateInput) return '';

  if (dateInput instanceof Date) {
    const day = String(dateInput.getDate()).padStart(2, '0');
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${dateInput.getFullYear()}`;
  }

  if (dateInput.includes('-')) {
    const datePart = dateInput.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  }

  if (dateInput.includes('/')) {
    return dateInput.split(' ')[0];
  }

  return dateInput;
};

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
 * Formats a date to 'dd/MM/yyyy h:mmam' style (lowercase am/pm, no space) to match the app's display format.
 * @param date - The Date object to format
 * @returns Formatted string (e.g., "12/02/2026 9:31am")
 */
export function formatDateTimeForDisplay(date: Date): string {
  return format(date, 'dd/MM/yyyy h:mm a').replace(' AM', 'am').replace(' PM', 'pm');
}

/**
 * Converts a dateTime string (format: "2025-12-01T06:11") to table format (format: "6:11am01/12/25")
 * @param dateTimeString - ISO format dateTime string (e.g., "2025-12-01T06:11")
 * @returns Formatted string matching table display format (e.g., "6:11am01/12/25")
 */
export function formatDateTimeForTable(dateTimeString: string): string {
  let dateFromForm: Date;
  if (dateTimeString.includes('T')) {
    dateFromForm = new Date(dateTimeString);
  } else {
    dateFromForm = parse(dateTimeString, 'dd/MM/yyyy hh:mm a', new Date());
  }
  const formattedTime = format(dateFromForm, 'h:mm a').replace(' ', '').toLowerCase();
  const formattedDate = format(dateFromForm, 'dd/MM/yy');
  return `${formattedTime}${formattedDate}`;
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
    const dateA = parseDateDisplayString(a.dateGiven).getTime();
    const dateB = parseDateDisplayString(b.dateGiven).getTime();
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  };
}

/**
 * Parses a date string in either dd/MM/yyyy (display) or yyyy-MM-dd (ISO) format into a Date.
 */
export function parseDateDisplayString(dateStr: string): Date {
  const datePart = dateStr.split(' ')[0];
  if (datePart.includes('-')) {
    return new Date(datePart);
  }
  const [day, month, year] = datePart.split('/');
  return new Date(`${year}-${month}-${day}`);
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
  const formattedDateToOffset = parseDateDisplayString(dateToOffset);
  let newDate = undefined;

  if (offset === 'increase') newDate = addYears(formattedDateToOffset, amountToOffset);
  else if (offset === 'decrease') newDate = subYears(formattedDateToOffset, amountToOffset);
  else throw new Error('Invalid offset');

  return format(newDate, 'dd/MM/yyyy');
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
