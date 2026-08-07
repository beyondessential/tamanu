import { Locator, Page } from '@playwright/test';

import { selectAutocompleteFieldOption, selectFieldOption } from '@utils/fieldHelpers';

/**
 * The new prescription modal, reached from New prescription on the encounter medication pane.
 *
 * Field components suffix the test id they are given — `-input` for text and autocomplete fields,
 * `-select` for selects, `-controlcheck` for checkboxes — so none of these locators use the bare
 * id from the form.
 */
export class NewPrescriptionModal {
  readonly page: Page;
  readonly medicationField: Locator;
  readonly doseAmountInput: Locator;
  readonly frequencyField: Locator;
  readonly routeField: Locator;
  readonly prescriberField: Locator;
  readonly dispensingQuantityInput: Locator;

  readonly sendToPharmacyCheckbox: Locator;
  readonly prescriptionTypeLabel: Locator;
  readonly finaliseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.medicationField = page.getByTestId('medication-field-medicationId-8k3m-input');
    this.doseAmountInput = page.getByTestId('medication-field-doseAmount-3t6w-input');
    this.frequencyField = page.getByTestId('medication-field-frequency-4c7z-input');
    this.routeField = page.getByTestId('medication-field-route-6d1b-select');
    this.prescriberField = page.getByTestId('medication-field-prescriberId-3x5h-input');
    this.dispensingQuantityInput = page.getByTestId('medication-field-quantity-6j9m-input');

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

  /**
   * Frequency options render as "<frequency> (<synonym>)" — "Immediately (STAT)" — so they are
   * matched on a prefix rather than the exact value the API takes.
   */
  async selectFrequency(frequency: string): Promise<void> {
    await this.frequencyField.click();
    await this.page
      .getByTestId('medication-field-frequency-4c7z-suggestionslist')
      .getByTestId('medication-field-frequency-4c7z-option')
      .filter({ hasText: frequency })
      .first()
      .click();
  }

  async fillClinicalDetails({
    doseAmount = '1',
    frequency = 'Immediately',
    route = 'Oral',
  }: { doseAmount?: string; frequency?: string; route?: string } = {}): Promise<void> {
    await this.doseAmountInput.fill(doseAmount);
    await this.selectFrequency(frequency);
    await selectFieldOption(this.page, this.routeField, { optionToSelect: route });
  }

  async setDispensingQuantity(quantity: string): Promise<void> {
    await this.dispensingQuantityInput.fill(quantity);
  }

  async tickSendToPharmacy(): Promise<void> {
    await this.sendToPharmacyCheckbox.click();
  }

  async finalise(): Promise<void> {
    await this.finaliseButton.click();
  }
}
