import { Locator, Page } from '@playwright/test';

import { BasePatientModal } from './BasePatientModal';

export class CarePlanModal extends BasePatientModal {
    readonly carePlanDropdown: Locator;
    readonly carePlanClinicianDropdown: Locator;
    readonly mainCarePlanFieldDetails: Locator;
    readonly submitNewCarePlanAddButton: Locator;
    readonly additionalCarePlanNoteField: Locator;
    readonly addAdditionalNoteButton: Locator;
    readonly carePlanHeader: Locator;

  constructor(page: Page) {
    super(page);

    this.carePlanDropdown = this.page.getByTestId('field-uc7w-input').getByRole('textbox', { name: 'Search...' });
    this.carePlanClinicianDropdown = this.page.getByTestId('field-kb54-input').getByRole('textbox', { name: 'Search...' });
    this.mainCarePlanFieldDetails = this.page.getByTestId('field-0yjf-input');
    this.submitNewCarePlanAddButton = this.page.getByTestId('formgrid-iwuf').getByTestId('formsubmitbutton-ygc6');
    this.additionalCarePlanNoteField = this.page.getByTestId('field-e8ln-input');
    this.addAdditionalNoteButton = this.page.getByTestId('container-0zs2').getByTestId('formsubmitbutton-ygc6');
    this.carePlanHeader = this.page.getByTestId('verticalcenteredtext-ni4s');
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