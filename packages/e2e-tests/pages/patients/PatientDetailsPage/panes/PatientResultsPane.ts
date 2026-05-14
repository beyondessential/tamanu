import { Locator, Page, expect } from '@playwright/test';
import { selectAutocompleteFieldOption } from '@utils/fieldHelpers';

export class PatientResultsPane {
  readonly page: Page;

  readonly categorySelect: Locator;
  readonly panelSelect: Locator;
  readonly resultsTable: Locator;
  readonly tableBody: Locator;
  readonly tableRows: Locator;
  readonly editedEntryLegend: Locator;

  constructor(page: Page) {
    this.page = page;
    this.categorySelect = page.getByTestId('styledautocompleteinput-ar0l');
    this.panelSelect = page.getByTestId('styledautocompleteinput-mu8z');
    this.resultsTable = page.getByTestId('styledtable-u2v9');
    this.tableBody = this.resultsTable.locator('tbody');
    this.tableRows = this.tableBody.locator('tr');
    this.editedEntryLegend = page.getByTestId('box-q7pq');
  }

  async filterByCategory(category: string): Promise<void> {
    await selectAutocompleteFieldOption(this.page, this.categorySelect, {
      optionToSelect: category,
    });
    await this.resultsTable.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async expectEditedEntryLegendVisible(): Promise<void> {
    await expect(this.editedEntryLegend).toBeVisible();
    await expect(this.editedEntryLegend).toHaveText('*Edited entry');
  }

  /**
   * Asserts that a result cell in the table renders the given value with the
   * edited indicator (`*` suffix). Matches any cell text equal to `value*`.
   */
  async expectEditedResultCellVisible(value: string): Promise<void> {
    const editedCell = this.tableBody.getByText(`${value}*`, { exact: true });
    await expect(editedCell.first()).toBeVisible();
  }
}
