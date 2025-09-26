import { Locator, Page } from '@playwright/test';
import { BasePatientModal } from '../../../PatientDetailsPage/modals/BasePatientModal';

export class EditVitalModal extends BasePatientModal {
  readonly modalTitle: Locator;
  readonly editField: Locator;
  readonly reasonForChangeDropdown: Locator;
  readonly deleteVitalButton: Locator;
  readonly confirmEditButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = this.page.getByTestId('modaltitle-ojhf');
    this.editField = this.page.getByRole('spinbutton');
    this.reasonForChangeDropdown = this.page.getByTestId('field-fvqv-select');
    this.deleteVitalButton = this.page.getByTestId('iconbutton-o9qe');
    this.confirmEditButton = this.page.getByTestId('formsubmitcancelrow-bdsb-confirmButton');
  }

  //TODO: account for "reason for change" dropdown
  async editVital(newValue: string) {
    await this.editField.fill(newValue);
    await this.confirmEditButton.click();
  }

}
