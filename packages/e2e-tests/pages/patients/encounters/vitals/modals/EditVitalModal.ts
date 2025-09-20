import { Locator, Page } from '@playwright/test';
import { BasePatientModal } from '../../../PatientDetailsPage/modals/BasePatientModal';

export class EditVitalModal extends BasePatientModal {
  readonly editField: Locator;
  readonly reasonForChangeDropdown: Locator;
  readonly deleteVitalButton: Locator;
  readonly confirmEditButton: Locator;

  constructor(page: Page) {
    super(page);
    this.editField = this.page.getByRole('spinbutton');
    this.reasonForChangeDropdown = this.page.getByTestId('field-fvqv-select');
    this.deleteVitalButton = this.page.getByTestId('iconbutton-o9qe');
    this.confirmEditButton = this.page.getByTestId('formsubmitcancelrow-bdsb-confirmButton');
  }

  async editVital(newValue: string) {
    await this.editField.fill(newValue);
    await this.confirmEditButton.click();
  }

}
