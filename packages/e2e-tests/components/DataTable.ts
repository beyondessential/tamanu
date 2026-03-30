import { Locator, Page, expect } from '@playwright/test';
import { ids, TABLE_CELL_PREFIX, tableSortLabel } from '@ids';

/**
 * Reusable component for Tamanu styled data tables.
 * Encapsulates row/cell access, sorting, pagination, and common assertions.
 */
export class DataTable {
  readonly body: Locator;
  readonly head: Locator;
  readonly rows: Locator;
  readonly pagination: Locator;
  readonly pageRecordCount: Locator;
  readonly downloadButton: Locator;

  constructor(
    readonly page: Page,
    private bodyTestId = ids.table.body,
  ) {
    this.body = page.getByTestId(bodyTestId);
    this.head = page.getByTestId(ids.table.head);
    this.rows = this.body.locator('tr');
    this.pagination = page.getByTestId(ids.table.pagination);
    this.pageRecordCount = page.getByTestId(ids.table.pageRecordCount);
    this.downloadButton = page.getByTestId(ids.table.downloadButton);
  }

  /** Get a specific cell locator by row index and column name. */
  cell(row: number, column: string): Locator {
    return this.body.getByTestId(`${TABLE_CELL_PREFIX}${row}-${column}`);
  }

  /** Wait for at least one data row to be visible. */
  async waitForData(column = 'displayId'): Promise<void> {
    await expect(this.cell(0, column)).toBeVisible();
  }

  /** Wait for the table body to be visible. */
  async waitForTable(): Promise<void> {
    await this.body.waitFor({ state: 'visible' });
  }

  /** Get current row count. */
  async getRowCount(): Promise<number> {
    return this.rows.count();
  }

  /** Read all cell texts for a given column across visible rows. */
  async getCellTexts(column: string): Promise<string[]> {
    const count = await this.getRowCount();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await this.cell(i, column).textContent();
      if (text) texts.push(text);
    }
    return texts;
  }

  /** Click a sort header for the given column. */
  async sortBy(column: string): Promise<void> {
    await this.page.getByTestId(tableSortLabel(column)).click();
  }

  /** Assert all rows' column text contains the expected value (case-insensitive). */
  async expectAllRowsContain(column: string, expected: string): Promise<void> {
    const lower = expected.toLowerCase();
    const count = await this.getRowCount();
    for (let i = 0; i < count; i++) {
      const text = await this.cell(i, column).textContent();
      expect((text || '').toLowerCase()).toContain(lower);
    }
  }

  /** Assert column is sorted in the given direction (string comparison). */
  async expectSorted(column: string, direction: 'asc' | 'desc'): Promise<void> {
    await expect(async () => {
      const values = await this.getCellTexts(column);
      const sorted = [...values].sort((a, b) =>
        direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a),
      );
      expect(values).toEqual(sorted);
    }).toPass({ timeout: 10000 });
  }

  /** Assert date column is sorted (assumes MM/dd/yyyy display format). */
  async expectDateSorted(column: string, direction: 'asc' | 'desc'): Promise<void> {
    await expect(async () => {
      const values = await this.getCellTexts(column);
      const sorted = [...values].sort((a, b) => {
        const [mA, dA, yA] = a.split('/');
        const [mB, dB, yB] = b.split('/');
        const dateA = new Date(`${yA}-${mA.padStart(2, '0')}-${dA.padStart(2, '0')}`).getTime();
        const dateB = new Date(`${yB}-${mB.padStart(2, '0')}-${dB.padStart(2, '0')}`).getTime();
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      });
      expect(values).toEqual(sorted);
    }).toPass({ timeout: 10000 });
  }

  /** Assert a specific row count. */
  async expectRowCount(count: number): Promise<void> {
    await expect(this.rows).toHaveCount(count);
  }

  /** Assert exactly one data row is visible. */
  async expectOneResult(column = 'displayId'): Promise<void> {
    await expect(this.cell(0, column)).toBeVisible();
    await expect(this.rows).toHaveCount(1);
  }

  /** Assert the first row's NHN matches. */
  async expectFirstRowNHN(nhn: string): Promise<void> {
    await expect(this.cell(0, 'displayId')).toHaveText(nhn);
  }

  // -- Pagination --

  async goToPage(pageNumber: number): Promise<void> {
    await this.page
      .getByTestId(ids.table.pageButtons)
      .filter({ hasText: pageNumber.toString() })
      .click();
  }

  async nextPage(): Promise<void> {
    await this.page.getByTestId(ids.table.nextPage).click();
  }

  async previousPage(): Promise<void> {
    await this.page.getByTestId(ids.table.prevPage).click();
  }

  async setPageSize(size: number): Promise<void> {
    await this.page.getByTestId(ids.table.recordCountDropdown).click();
    await this.page.getByText(size.toString()).click();
  }
}
