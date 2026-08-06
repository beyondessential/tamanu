import { Locator, Page } from '@playwright/test';

import { selectAutocompleteFieldOption } from '@utils/fieldHelpers';

/**
 * The new prescription modal, reached from New prescription on the encounter medication pane.
 *
 * Where the deployment has medication sets configured, that button first opens a chooser; the
 * modal's own openers handle both paths.
 */
export class NewPrescriptionModal {
  readonly page: Page;
  readonly medicationField: Locator;
  readonly doseAmountField: Locator;
  readonly frequencyField: Locator;
  readonly routeField: Locator;
  readonly prescriberField: Locator;
  readonly dispensingQuantityField: Locator;

  readonly sendToPharmacyCheckbox: Locator;
  readonly prescriptionTypeLabel: Locator;
  readonly finaliseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.medicationField = page.getByTestId('medication-field-medicationId-8k3m');
    this.doseAmountField = page.getByTestId('medication-field-doseAmount-3t6w');
    this.frequencyField = page.getByTestId('medication-field-frequency-4c7z');
    this.routeField = page.getByTestId('medication-field-route-6d1b');
    this.prescriberField = page.getByTestId('medication-field-prescriberId-3x5h');
    this.dispensingQuantityField = page.getByTestId('medication-field-quantity-6j9m');

    this.sendToPharmacyCheckbox = page.getByTestId(
      'medication-field-sendToPharmacy-6r4d-controlcheck',
    );
    this.prescriptionTypeLabel = page.getByText('Prescription type', { exact: false });
    this.finaliseButton = page.getByTestId('medication-button-finalise-7x3d');
  }

  async waitForModalToLoad(): Promise<void> {
    await this.medicationField.waitFor({ state: 'visible' });
  }

  /**
   * TranslatedRadioField overrides the caller's data-testid, so the options are matched by their
   * accessible name rather than a test id.
   */
  prescriptionTypeOption(name: 'Outpatient/Discharge' | 'Inpatient'): Locator {
    return this.page.getByRole('radio', { name });
  }

  async selectMedication(): Promise<string> {
    return (await selectAutocompleteFieldOption(this.page, this.medicationField, {
      selectFirst: true,
      returnOptionText: true,
    })) as string;
  }

  async fillClinicalDetails({
    doseAmount = '1',
    frequency = 'Immediately',
    route = 'Oral',
  }: { doseAmount?: string; frequency?: string; route?: string } = {}): Promise<void> {
    await this.doseAmountField.locator('input').fill(doseAmount);
    await selectAutocompleteFieldOption(this.page, this.frequencyField, {
      optionToSelect: frequency,
    });
    await this.routeField.locator('input').fill(route);
    await this.page.getByRole('option', { name: route, exact: true }).click();
  }

  async setDispensingQuantity(quantity: string): Promise<void> {
    await this.dispensingQuantityField.locator('input').fill(quantity);
  }

  async tickSendToPharmacy(): Promise<void> {
    await this.sendToPharmacyCheckbox.click();
  }

  async finalise(): Promise<void> {
    await this.finaliseButton.click();
  }
}
