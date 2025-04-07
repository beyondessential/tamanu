import { Locator, Page } from '@playwright/test';
import { BasePatientPane } from './BasePatientPane';
import { RecordVaccineModal } from '../modals/RecordVaccineModal';

export class PatientVaccinePane extends BasePatientPane {
  readonly recordVaccineButton: Locator;
  readonly recordedVaccinesTable: Locator;
  readonly recordedVaccinesTableLoadingIndicator: Locator;
  readonly recordedVaccinesTablePaginator: Locator;
  recordVaccineModal: RecordVaccineModal;

  constructor(page: Page) {
    super(page);

    this.recordVaccineButton = this.page.getByTestId('buttonwithpermissioncheck-zmgl');
    this.recordedVaccinesTable = this.page
      .getByRole('table')
      .filter({ hasText: 'VaccineScheduleDateGiven' });
    this.recordedVaccinesTableLoadingIndicator = this.recordedVaccinesTable.getByRole('cell', {
      name: 'Loading...',
    });
    this.recordedVaccinesTablePaginator = this.page.getByTestId('pagerecordcount-m8ne');
  }

  async clickRecordVaccineButton(): Promise<RecordVaccineModal> {
    await this.recordVaccineButton.click();
    if (!this.recordVaccineModal) {
      this.recordVaccineModal = new RecordVaccineModal(this.page);
    }

    return this.recordVaccineModal;
  }

  async getRecordedVaccineCount(): Promise<number> {
    await this.recordedVaccinesTable.waitFor();

    const paginationText = await this.recordedVaccinesTablePaginator.innerText();
    const match = paginationText.match(/of (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async waitForRecordedVaccinesTableToLoad() {
    await this.recordedVaccinesTable.waitFor();
    await this.recordedVaccinesTableLoadingIndicator.waitFor({ state: 'detached' });
  }
}
