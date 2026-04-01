import { Locator, Page, expect } from '@playwright/test';

/**
 * Prefix for `data-testid` on cells in the app's styled data tables (e.g. patient lists).
 *
 * Row `i`, column semantic id `columnName` → `getByTestId(\`${STYLED_TABLE_CELL_PREFIX}${i}-${columnName}\`)`.
 */
export const STYLED_TABLE_CELL_PREFIX = 'styledtablecell-2gyy-';

/** Shared `data-testid` for the two-column sex/gender field used in patient search forms. */
export const TWO_COLUMNS_FIELD_TEST_ID = 'twocolumnsfield-wg4x';

/**
 * Read text from a column across the first `tableRowCount` rows of a styled table.
 *
 * Uses {@link STYLED_TABLE_CELL_PREFIX} + row index + `columnName` as the `data-testid` suffix pattern.
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
 * Comparator factory for locale-aware string sort (e.g. vaccine names in table order assertions).
 */
export function compareAlphabetically(order: 'asc' | 'desc') {
  return (a: string, b: string) => (order === 'asc' ? a.localeCompare(b) : b.localeCompare(a));
}

export async function scrollTableToElement(tableLocator: Locator, targetLocator: Locator) {
  let isVisible = await targetLocator.isVisible();

  while (!isVisible) {
    await tableLocator.evaluate(el => (el.scrollTop = el.scrollHeight));
    isVisible = await targetLocator.isVisible();
  }
}

/**
 * Read text content of a single column across all visible rows of a styled table.
 *
 * @param tableRows - Locator for `<tr>` elements in the table body.
 * @param columnKey - The column's `data-testid` suffix (e.g. `'firstName'`, `'dateOfBirth'`).
 * @returns Array of non-empty cell text values in row order.
 */
export async function readStyledTableColumn(
  tableRows: Locator,
  columnKey: string,
): Promise<string[]> {
  const rowCount = await tableRows.count();
  const values: string[] = [];
  for (let i = 0; i < rowCount; i++) {
    const row = tableRows.nth(i);
    const testId = `${STYLED_TABLE_CELL_PREFIX}${i}-${columnKey}`;
    const cellText = await row.locator(`[data-testid="${testId}"]`).textContent();
    if (cellText) values.push(cellText);
  }
  return values;
}

/**
 * Assert that a styled table column is sorted (string comparison).
 * Retries with `.toPass()` to handle async re-renders.
 */
export async function expectColumnSorted(
  tableRows: Locator,
  columnKey: string,
  isAscending: boolean,
  timeout = 10000,
): Promise<void> {
  await expect(async () => {
    const values = await readStyledTableColumn(tableRows, columnKey);
    const sorted = [...values].sort((a, b) =>
      isAscending ? a.localeCompare(b) : b.localeCompare(a),
    );
    expect(values).toEqual(sorted);
  }).toPass({ timeout });
}

/**
 * Parse a US-format `MM/dd/yyyy` string into a comparable timestamp.
 */
function parseUsShortDate(dateStr: string): number {
  const [month, day, year] = dateStr.split('/');
  return new Date(
    `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
  ).getTime();
}

/**
 * Assert that a styled table date column (US-format `MM/dd/yyyy`) is sorted.
 * Retries with `.toPass()` to handle async re-renders.
 */
export async function expectDateColumnSorted(
  tableRows: Locator,
  columnKey: string,
  isAscending: boolean,
  timeout = 10000,
): Promise<void> {
  await expect(async () => {
    const values = await readStyledTableColumn(tableRows, columnKey);
    const sorted = [...values].sort((a, b) => {
      const diff = parseUsShortDate(a) - parseUsShortDate(b);
      return isAscending ? diff : -diff;
    });
    expect(values).toEqual(sorted);
  }).toPass({ timeout });
}
