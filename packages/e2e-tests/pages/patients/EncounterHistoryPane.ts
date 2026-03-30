import { Locator, Page, expect } from '@playwright/test';
import { ids, TABLE_CELL_PREFIX } from '@ids';
import { DataTable } from '@components/DataTable';

export class EncounterHistoryPane {
  readonly table: DataTable;
  readonly contentPane: Locator;
  readonly summaryTable: Locator;
  readonly heading: Locator;

  // First row cells
  readonly firstRowDate: Locator;
  readonly firstRowType: Locator;
  readonly firstRowFacility: Locator;
  readonly firstRowLocation: Locator;
  readonly firstRowReason: Locator;

  readonly openButton: Locator;
  readonly pageRecordCount: Locator;

  constructor(readonly page: Page) {
    this.table = new DataTable(page);
    const e = ids.encounterHistory;
    this.contentPane = page.getByTestId(e.contentPane);
    this.summaryTable = page.getByTestId(e.summaryTable);
    this.heading = page.getByTestId(e.heading);

    this.firstRowDate = page.getByTestId(e.firstRowDate);
    this.firstRowType = page.getByTestId(e.firstRowType);
    this.firstRowFacility = page.getByTestId(e.firstRowFacility);
    this.firstRowLocation = page.getByTestId(e.firstRowLocation);
    this.firstRowReason = page.getByTestId(e.firstRowReason);

    this.openButton = page.getByTestId(e.openButton);
    this.pageRecordCount = page.getByTestId(ids.table.pageRecordCount);
  }

  async waitForPaneToLoad(): Promise<void> {
    await this.contentPane.waitFor({ state: 'visible' });
  }
}
