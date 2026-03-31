import { Locator, expect } from '@playwright/test';
import { STYLED_TABLE_CELL_PREFIX } from './testHelper';

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
