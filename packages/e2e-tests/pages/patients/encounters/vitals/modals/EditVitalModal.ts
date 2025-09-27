import { Locator, Page } from '@playwright/test';
import { BasePatientModal } from '../../../PatientDetailsPage/modals/BasePatientModal';

export class EditVitalModal extends BasePatientModal {
  readonly modalTitle: Locator;
  readonly editField: Locator;
  readonly reasonForChangeDropdown: Locator;
  readonly deleteVitalButton: Locator;
  readonly confirmEditButton: Locator;
  readonly mostRecentHistory: Locator;
  readonly mostRecentHistoryDetails: Locator;
  readonly oldestRecentHistory: Locator;
  readonly oldestRecentHistoryDetails: Locator;
  readonly closeModal: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = this.page.getByTestId('modaltitle-ojhf');
    this.editField = this.page.getByRole('spinbutton');
    this.reasonForChangeDropdown = this.page.getByTestId('field-fvqv-select');
    this.deleteVitalButton = this.page.getByTestId('iconbutton-o9qe');
    this.confirmEditButton = this.page.getByTestId('formsubmitcancelrow-bdsb-confirmButton');
    this.mostRecentHistory = this.page.locator('[data-testid="logtext-bgs3"]').first();
    this.mostRecentHistoryDetails = this.page.locator('[data-testid="logtextsmall-2hok"]').first();
    this.oldestRecentHistory = this.page.locator('[data-testid="logtext-bgs3"]').last();
    this.oldestRecentHistoryDetails = this.page.locator('[data-testid="logtextsmall-2hok"]').last();
    this.closeModal = this.page.getByTestId('iconbutton-eull');
  }

  //TODO: account for "reason for change" dropdown
  async editVital(newValue: string) {
    await this.editField.fill(newValue);
    await this.confirmEditButton.click();
  }

}
