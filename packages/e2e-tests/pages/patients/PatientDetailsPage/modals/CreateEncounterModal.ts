import { Page, Locator } from '@playwright/test';
import { HospitalAdmissionModal } from './HospitalAdmissionModal';

export class CreateEncounterModal {
  readonly page: Page;
  readonly hospitalAdmissionButton: Locator;
  readonly clinicButton: Locator;
  readonly triageButton: Locator;
  private hospitalAdmissionModal?: HospitalAdmissionModal;

  constructor(page: Page) {
    this.page = page;
    
    // Override specific locators that need additional filtering
    this.hospitalAdmissionButton = page.getByTestId('encounteroptiontypebutton-haqi').filter({ hasText: 'Hospital admission' });
    this.clinicButton = page.getByTestId('encounteroptiontypebutton-haqi').filter({ hasText: 'Clinic' });
    this.triageButton = page.getByTestId('encounteroptiontypebutton-haqi').filter({ hasText: 'Triage' });
  }

  async waitForModalToLoad() {
    await this.hospitalAdmissionButton.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  getHospitalAdmissionModal(): HospitalAdmissionModal {
    if (!this.hospitalAdmissionModal) {
      this.hospitalAdmissionModal = new HospitalAdmissionModal(this.page);
    }
    return this.hospitalAdmissionModal;
  }
}

