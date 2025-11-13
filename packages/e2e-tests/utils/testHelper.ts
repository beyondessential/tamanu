import { Locator, Page } from '@playwright/test';
import { subYears, addYears, format } from 'date-fns';

export const STYLED_TABLE_CELL_PREFIX = 'styledtablecell-2gyy-';

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
 * 
 * @param page 
 * @param tableRowCount 
 * @param columnName 
 * @returns 
 */
export async function getTableItems(page: Page, tableRowCount: number, columnName: string) {
  const items: string[] = [];
  for (let i = 0; i < tableRowCount; i++) {
    const itemLocator = page.getByTestId(`${STYLED_TABLE_CELL_PREFIX}${i}-${columnName}`);
    const itemText = await itemLocator.textContent();
    if (itemText) {
      items.push(itemText);
    }
  }
  return items;
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
