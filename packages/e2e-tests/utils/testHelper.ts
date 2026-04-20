import { Locator, Page } from '@playwright/test';

import { SidebarPage } from '../pages/SidebarPage';

export * from './dateTimeHelpers';

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
    throw new Error(
      `Failed to handle search box suggestion: ${error instanceof Error ? error.message : String(error)}`,
    );
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
 * Comparator factory for deterministic alphabetical sort checks.
 *
 * Uses raw Unicode code point ordering (JS relational comparison), which matches
 * the app's current backend/API ordering for patient names more reliably than
 * `localeCompare` across different CI runner locales.
 *
 * @param order — `'asc'` or `'desc'`.
 * @returns `(a, b) => number` suitable for `Array.prototype.sort`.
 */
export function compareAlphabetically(order: 'asc' | 'desc') {
  return (a: string, b: string) => {
    if (a === b) return 0;
    const forward = a > b ? 1 : -1;
    return order === 'asc' ? forward : -forward;
  };
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
  return (await firstOption.textContent()) || '';
};
