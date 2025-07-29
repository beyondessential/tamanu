import { Locator } from '@playwright/test';

// Utility method to convert YYYY-MM-DD to MM/DD/YYYY format
export const convertDateFormat = (dateInput: string | Date | undefined): string => {
  if (!dateInput) return '';
  
  let dateString: string;
  
  if (dateInput instanceof Date) {
    dateString = dateInput.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
  } else {
    dateString = dateInput;
  }
  
  if (!dateString) return '';
  
  const [year, month, day] = dateString.split('-');
  return `${month}/${day}/${year}`;
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
    throw new Error(`Failed to handle search box suggestion: ${error.message}`);
  }
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
 * Utility method to offset a date by one year
 * @param dateToOffset - The date to offset
 * @param offset - The offset to apply ('increaseByOneYear' or 'decreaseByOneYear')
 * @returns The date with the offset applied
 */
export function offsetYear(
  dateToOffset: string,
  offset: 'increaseByOneYear' | 'decreaseByOneYear',
): string {
  const [yearStr, month, day] = dateToOffset.split('-');
  let year = Number(yearStr);
  if (offset === 'increaseByOneYear') year++;
  else if (offset === 'decreaseByOneYear') year--;
  else throw new Error('Invalid offset');

  // Handle Feb 29 for non-leap years
  if (month === '02' && day === '29') {
    const isLeap = (y: number) => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
    if (!isLeap(year)) return `${year}-02-28`;
  }
  return `${year}-${month}-${day}`;
}
