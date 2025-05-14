import { Locator, Page } from '@playwright/test';

import { BasePatientModal } from './BasePatientModal';

export class CarePlanModal extends BasePatientModal {
  readonly carePlanDropdown: Locator;
  readonly carePlanDate: Locator;
  readonly carePlanClinicianDropdown: Locator;
  readonly mainCarePlanFieldDetails: Locator;
  readonly submitNewCarePlanAddButton: Locator;
  readonly additionalCarePlanNoteField: Locator;
  readonly addAdditionalNoteButton: Locator;
  readonly carePlanHeader: Locator;
  readonly completedMainCarePlan: Locator;
  readonly completedCarePlan: Locator;
  readonly completedSystemAdditionalCarePlan: Locator;
  readonly additionalNoteClinicianDropdown: Locator;
  readonly completedMainCarePlanKebabMenu: Locator;
  readonly completedCarePlanEditButton: Locator;
  readonly editableNoteContent: Locator;
  readonly saveEditedNoteButton: Locator;
  readonly additionalNoteEditButton: Locator;
  readonly additionalNoteSavedDate: Locator;
  readonly additionalNoteDeleteButton: Locator;

  constructor(page: Page) {
    super(page);

    this.carePlanDropdown = this.page
      .getByTestId('field-uc7w-input')
      .getByRole('textbox', { name: 'Search...' });
    this.carePlanDate = this.page.getByTestId('field-764k-input').getByRole('textbox');
    this.carePlanClinicianDropdown = this.page
      .getByTestId('field-kb54-input')
      .getByRole('textbox', { name: 'Search...' });
    this.mainCarePlanFieldDetails = this.page.getByTestId('field-0yjf-input');
    this.submitNewCarePlanAddButton = this.page
      .getByTestId('formgrid-iwuf')
      .getByTestId('formsubmitbutton-ygc6');
    this.additionalCarePlanNoteField = this.page.getByTestId('field-e8ln-input');
    this.addAdditionalNoteButton = this.page
      .getByTestId('container-0zs2')
      .getByTestId('formsubmitbutton-ygc6');
    this.carePlanHeader = this.page.getByTestId('verticalcenteredtext-ni4s');
    this.completedCarePlan = this.page.getByTestId('notecontainer-6fi4');
    this.completedMainCarePlan = this.completedCarePlan.filter({ hasText: 'Main care plan' });
    this.completedSystemAdditionalCarePlan = this.completedCarePlan.filter({
      hasText: 'On behalf of System',
    });
    this.additionalNoteClinicianDropdown = this.page.getByTestId('field-hh8q-input');
    this.completedMainCarePlanKebabMenu = this.completedMainCarePlan.getByTestId('openbutton-d1ec');
    this.completedCarePlanEditButton = this.completedCarePlan.getByTestId('item-8ybn-0');
    this.editableNoteContent = this.page
      .getByTestId('editablenoteformcontainer-mx3i')
      .getByTestId('field-e8ln-input');
    this.saveEditedNoteButton = this.page
      .getByTestId('editablenoteformcontainer-mx3i')
      .getByTestId('formsubmitbutton-ygc6');
    this.additionalNoteEditButton = this.page.getByTestId('item-8ybn-0');
    this.additionalNoteSavedDate = this.page
      .getByTestId('editablenoteformcontainer-mx3i')
      .getByTestId('field-qouz-input')
      .getByRole('textbox');
    this.additionalNoteDeleteButton = this.page.getByTestId('item-8ybn-1');
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

  async addAdditionalCarePlanNote(carePlanNote: string, clinicianName: string) {
    await this.additionalNoteClinicianDropdown.click();
    await this.page.getByRole('menuitem', { name: clinicianName, exact: true }).click();
    await this.additionalCarePlanNoteField.fill(carePlanNote);
    await this.addAdditionalNoteButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  getAdditionalNoteKebabMenu(clinicianName: string) {
    return this.completedCarePlan.filter({ hasText: clinicianName }).getByTestId('openbutton-d1ec');
  }

  async getTrimmedDateFromDateField() {
    const date = this.carePlanDate;
    const formattedDate = await date.toISOString().split('T')[0];
  }
}
