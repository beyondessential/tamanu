import { Locator, Page } from '@playwright/test';
import { ids } from '@ids';
import { DataTable } from '@components/DataTable';

export class MedicationsPane {
  readonly table: DataTable;
  readonly tabPane: Locator;
  readonly newMedicationButton: Locator;
  readonly allMedicationsButton: Locator;
  readonly recordButton: Locator;

  constructor(readonly page: Page) {
    this.table = new DataTable(page);
    const m = ids.medicationsPane;
    this.tabPane = page.getByTestId(m.tabPane);
    this.newMedicationButton = page.getByTestId(m.newMedicationButton);
    this.allMedicationsButton = page.getByTestId(m.allMedicationsButton);
    this.recordButton = page.getByTestId(m.recordButton);
  }

  async waitForPaneToLoad(): Promise<void> {
    await this.tabPane.waitFor({ state: 'visible' });
  }
}
