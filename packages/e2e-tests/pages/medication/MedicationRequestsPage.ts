import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { constructFacilityUrl } from '@utils/navigation';
import { DispenseMedicationModal } from './DispenseMedicationModal';

export class MedicationRequestsPage extends BasePage {
  private dispenseMedicationModal?: DispenseMedicationModal;

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(constructFacilityUrl('/medication/active'));
  }

  async clickRowForPatient(patientDisplayId: string): Promise<DispenseMedicationModal> {
    const row = this.page.getByRole('row').filter({ hasText: patientDisplayId });
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
}
