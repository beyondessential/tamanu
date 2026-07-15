import { Locator, Page } from '@playwright/test';
import { selectAutocompleteFieldOption, selectFieldOption } from '@utils/fieldHelpers';

export class DispenseMedicationModal {
  readonly page: Page;
  readonly dispenseWithoutLabelsButton: Locator;
  readonly reviewAndPrintButton: Locator;
  readonly backButton: Locator;
  readonly cancelButton: Locator;
  readonly dispenseAndPrintButton: Locator;
  readonly dispensedByInput: Locator;
  readonly selectAllCheckbox: Locator;
  readonly patientSummaryPanel: Locator;
  // Modify prescription modal (opened from a dispense row's actions menu).
  readonly modifyDoseInput: Locator;
  readonly modifyRouteField: Locator;
  readonly modifyReasonField: Locator;
  readonly modifyConfirmButton: Locator;
  readonly modifyCancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dispenseWithoutLabelsButton = page.getByTestId('dispense-without-labels-button');
    this.reviewAndPrintButton = page.getByTestId('dispense-review-button');
    this.backButton = page.getByTestId('dispense-review-back-button');
    this.cancelButton = page.getByTestId('dispense-cancel-button');
    this.dispenseAndPrintButton = page.getByTestId('dispense-and-print-button');
    this.dispensedByInput = page.getByTestId('dispense-dispensed-by-input');
    this.selectAllCheckbox = page.getByTestId('dispense-select-all-checkbox');
    this.patientSummaryPanel = page.getByTestId('dispense-modal-patient-context');
    this.modifyDoseInput = page.getByTestId('modify-prescription-dose-input');
    this.modifyRouteField = page.getByTestId('modify-prescription-route-select');
    this.modifyReasonField = page.getByTestId('modify-prescription-reason-input');
    this.modifyConfirmButton = page.getByTestId('modify-prescription-confirm');
    this.modifyCancelButton = page.getByTestId('modify-prescription-cancel');
  }

  getRowCheckbox(rowIndex: number): Locator {
    return this.page.getByTestId(`dispense-row-checkbox-${rowIndex}`);
  }

  getRowActionsButton(rowIndex: number): Locator {
    return this.page.getByTestId(`dispense-row-actions-${rowIndex}`);
  }

  async waitForModalToLoad(): Promise<void> {
    await this.dispenseWithoutLabelsButton.waitFor({ state: 'visible' });
  }

  // Opens a dispense row's actions menu and picks "Modify prescription", then waits for the
  // modify modal to appear. The actions column only renders for users with write access to
  // MedicationDispense.
  async openModifyPrescription(rowIndex = 0): Promise<void> {
    await this.getRowActionsButton(rowIndex).click();
    await this.page.getByTestId('list-i0ae').getByText('Modify prescription').click();
    await this.modifyConfirmButton.waitFor({ state: 'visible' });
  }

  // Modifies a fill's prescription details and confirms. The dose and route are changed to prove
  // the modification takes effect; the reason is mandatory (the only field the prescription does
  // not pre-fill), so it must be supplied for the confirm to succeed.
  async modifyPrescription(rowIndex = 0): Promise<void> {
    await this.openModifyPrescription(rowIndex);
    await this.modifyDoseInput.fill('2');
    await selectFieldOption(this.page, this.modifyRouteField, { optionToAvoid: 'Oral' });
    await selectAutocompleteFieldOption(this.page, this.modifyReasonField, { selectFirst: true });
    await this.modifyConfirmButton.click();
    await this.modifyConfirmButton.waitFor({ state: 'hidden' });
  }
}
