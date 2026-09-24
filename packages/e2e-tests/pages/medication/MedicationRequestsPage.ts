import { Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { constructFacilityUrl } from '@utils/navigation';
import { DispenseMedicationModal } from './DispenseMedicationModal';
import { NotDispensedMedicationModal } from './NotDispensedMedicationModal';

export class MedicationRequestsPage extends BasePage {
  private dispenseMedicationModal?: DispenseMedicationModal;
  private notDispensedMedicationModal?: NotDispensedMedicationModal;

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(constructFacilityUrl('/medication/active'));
  }

  rowForPatient(patientDisplayId: string): Locator {
    return this.page.getByRole('row').filter({ hasText: patientDisplayId });
  }

  async clickRowForPatient(patientDisplayId: string): Promise<DispenseMedicationModal> {
    const row = this.rowForPatient(patientDisplayId);
    await row.waitFor({ state: 'visible' });
    await row.click();
    if (!this.dispenseMedicationModal) {
      this.dispenseMedicationModal = new DispenseMedicationModal(this.page);
    }
    return this.dispenseMedicationModal;
  }

  getDispenseMedicationModal(): DispenseMedicationModal {
    if (!this.dispenseMedicationModal) {
      this.dispenseMedicationModal = new DispenseMedicationModal(this.page);
    }
    return this.dispenseMedicationModal;
  }

  // Opens the row's actions kebab and picks "Not dispensed". The kebab shares a testid across
  // every row, so it is located scoped to that row rather than page-wide.
  async openNotDispensed(patientDisplayId: string): Promise<NotDispensedMedicationModal> {
    const row = this.rowForPatient(patientDisplayId);
    await row.waitFor({ state: 'visible' });
    await row.getByTestId('openbutton-d1ec').click();
    await this.page.getByTestId('list-i0ae').getByText('Not dispensed').click();
    if (!this.notDispensedMedicationModal) {
      this.notDispensedMedicationModal = new NotDispensedMedicationModal(this.page);
    }
    await this.notDispensedMedicationModal.waitForModalToLoad();
    return this.notDispensedMedicationModal;
  }
}
