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
  timeout: number = 10000
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