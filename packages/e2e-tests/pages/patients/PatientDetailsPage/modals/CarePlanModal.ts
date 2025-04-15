import { Locator, Page } from '@playwright/test';

import { BasePatientModal } from './BasePatientModal';

export class CarePlanModal extends BasePatientModal {
    readonly carePlanDropdown: Locator;
    readonly carePlanClinicianDropdown: Locator;
    readonly mainCarePlanFieldDetails: Locator;
    readonly submitNewCarePlanAddButton: Locator;
    readonly additionalCarePlanNoteField: Locator;
    readonly addAdditionalNoteButton: Locator;
  constructor(page: Page) {
    super(page);

    this.carePlanDropdown = this.page.locator('input[name="carePlanId"]');
    this.carePlanClinicianDropdown = this.page.getByRole('dialog').locator('input[name="examinerId"]');
    this.mainCarePlanFieldDetails = this.page.locator('textarea[name="content"]');
    this.submitNewCarePlanAddButton = this.page.getByRole('button', { name: 'Add' });
    this.additionalCarePlanNoteField = this.page.getByRole('textbox', { name: 'Write a note...' });
    this.addAdditionalNoteButton = this.page.getByRole('button', { name: 'Add Note' });
  }

  async fillOutCarePlan(carePlanName: string, carePlanDetails: string) {
    await this.carePlanDropdown.fill(carePlanName);
    await this.page.getByRole('menuitem', { name: carePlanName }).click();
    await this.carePlanClinicianDropdown.fill('Initial Admin');
    await this.page.getByRole('menuitem', { name: 'Initial Admin' }).click();
    await this.mainCarePlanFieldDetails.fill(carePlanDetails);
    await this.submitNewCarePlanAddButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async mainCarePlan(carePlanDetails: string) {
    return this.page.getByText(carePlanDetails);
  }

  async mainCarePlanClinician(clinicianName: string) {
    return this.page.getByText(`On behalf of ${clinicianName}Main care plan`);
  }

  async addAdditionalCarePlanNote(carePlanNote: string) {
    await this.additionalCarePlanNoteField.fill(carePlanNote);
    await this.addAdditionalNoteButton.click();
    await this.page.waitForLoadState('networkidle');
  }
}