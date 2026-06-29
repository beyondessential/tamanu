import { Locator, Page } from '@playwright/test';
import { BasePatientPane } from '../../PatientDetailsPage/panes/BasePatientPane';

export class PatientMedicationPane extends BasePatientPane {
  readonly ongoingMedicationsTable: Locator;
  readonly ongoingMedicationsTableBody: Locator;

  constructor(page: Page) {
    super(page);
    this.ongoingMedicationsTable = page.getByTestId('ongoing-medications-table');
    this.ongoingMedicationsTableBody = this.ongoingMedicationsTable.getByTestId(
      'styledtablebody-a0jz',
    );
  }

  async waitForPaneToLoad(): Promise<void> {
    await this.ongoingMedicationsTable.waitFor({ state: 'visible' });
  }

  async clickFirstOngoingMedicationRow(): Promise<void> {
    await this.ongoingMedicationsTableBody.getByTestId('statusrow-fsiy').waitFor({ state: 'hidden' });
    await this.ongoingMedicationsTableBody.getByRole('row').first().click();
  }
}
