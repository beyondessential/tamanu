import { Locator, Page } from '@playwright/test';
import { ids, TABLE_CELL_PREFIX } from '@ids';
import { DataTable } from '@components/DataTable';

// ---------------------------------------------------------------------------
// Vaccine Pane
// ---------------------------------------------------------------------------

export class VaccinePane {
  readonly page: Page;
  readonly table: DataTable;
  readonly recordButton: Locator;
  readonly pageRecordCount: Locator;
  readonly vaccineTable: Locator;
  readonly tableWrapper: Locator;
  readonly notGivenCheckbox: Locator;
  readonly sortByVaccine: Locator;
  readonly sortByDate: Locator;
  readonly expandButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = new DataTable(page);
    const v = ids.vaccinePane;
    this.recordButton = page.getByTestId(v.recordButton);
    this.pageRecordCount = page.getByTestId(v.pageRecordCount);
    this.vaccineTable = page.getByTestId(v.table);
    this.tableWrapper = page.getByTestId(v.tableWrapper);
    this.notGivenCheckbox = page.getByTestId(v.notGivenCheckbox);
    this.sortByVaccine = page.getByTestId(v.sortByVaccine);
    this.sortByDate = page.getByTestId(v.sortByDate);
    this.expandButton = page.getByTestId(v.expandButton);
  }

  async clickRecordVaccineButton(): Promise<void> {
    await this.recordButton.click();
  }

  vaccineRow(row: number, column: string): Locator {
    return this.page.getByTestId(`${TABLE_CELL_PREFIX}${row}-${column}`);
  }

  dateCell(row: number): Locator {
    return this.vaccineRow(row, 'date');
  }

  vaccineNameCell(row: number): Locator {
    return this.vaccineRow(row, 'vaccineDisplayName');
  }

  /** Record a scheduled vaccine by opening its row action, then confirming Record. */
  async recordScheduledVaccine(vaccineName: string, schedule: string): Promise<void> {
    const vaccineRow = this.tableWrapper
      .locator('tr')
      .filter({ hasText: vaccineName })
      .filter({ hasText: schedule });
    const actionCell = vaccineRow.locator(`[data-testid*="-action"]`);
    await actionCell.click();
    await this.page.getByRole('button', { name: 'Record' }).click();
  }

  async scrollToVaccine(vaccineName: string): Promise<void> {
    const target = this.tableWrapper.locator('tr').filter({ hasText: vaccineName });
    let visible = await target.isVisible();
    while (!visible) {
      await this.tableWrapper.evaluate((el) => (el.scrollTop = el.scrollHeight));
      visible = await target.isVisible();
    }
  }
}

// ---------------------------------------------------------------------------
// Delete Vaccine Modal
// ---------------------------------------------------------------------------

export class DeleteVaccineModal {
  readonly page: Page;
  readonly title: Locator;
  readonly content: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByTestId(ids.deleteVaccine.title);
    this.content = page.getByTestId(ids.deleteVaccine.content);
    this.confirmButton = page.getByTestId(ids.deleteVaccine.confirmButton);
  }
}

export { RecordVaccineModal } from './PatientDetailsPage/modals/RecordVaccineModal';
export { EditVaccineModal } from './PatientDetailsPage/modals/EditVaccineModal';
