import { Locator, Page } from '@playwright/test';
import { selectAutocompleteFieldOption, selectFieldOption } from '../../../../utils/fieldHelpers';

export class NewPrescriptionModal {
  readonly page: Page;

  // Medication field
  readonly medicationInput!: Locator;

  // Checkboxes
  readonly isOngoingCheckbox!: Locator;
  readonly isPrnCheckbox!: Locator;
  readonly isVariableDoseCheckbox!: Locator;
  readonly isPhoneOrderCheckbox!: Locator;

  // Dosage fields
  readonly doseAmountInput!: Locator;
  readonly unitsSelect!: Locator;

  // Frequency and route
  readonly frequencyInput!: Locator;
  readonly routeSelect!: Locator;

  // Date fields
  readonly prescriptionDateInput!: Locator;
  readonly startDateTimeInput!: Locator;

  // Duration fields
  readonly durationValueInput!: Locator;
  readonly durationUnitSelect!: Locator;

  // Prescriber and additional info
  readonly prescriberInput!: Locator;
  readonly indicationInput!: Locator;
  readonly notesInput!: Locator;

  // Discharge fields
  readonly dischargeQuantityInput!: Locator;

  // Action buttons
  readonly finaliseAndPrintButton!: Locator;
  readonly finaliseButton!: Locator;
  readonly cancelButton!: Locator;

  constructor(page: Page) {
    this.page = page;

    const testIds = {
      medicationInput: 'medication-field-medicationId-8k3m-input',
      isOngoingCheckbox: 'medication-field-isOngoing-7j2p-controlcheck',
      isPrnCheckbox: 'medication-field-isPrn-9n4q-controlcheck',
      isVariableDoseCheckbox: 'medication-field-isVariableDose-5h8x-controlcheck',
      isPhoneOrderCheckbox: 'medication-field-isPhoneOrder-2e4r-controlcheck',
      doseAmountInput: 'medication-field-doseAmount-3t6w',
      unitsSelect: 'medication-field-units-2r9v-select',
      frequencyInput: 'medication-field-frequency-4c7z-input',
      routeSelect: 'medication-field-route-6d1b-select',
      prescriptionDateInput: 'medication-field-date-8m5k',
      startDateTimeInput: 'medication-field-startDate-1a9s',
      durationValueInput: 'medication-field-durationValue-7p2n',
      durationUnitSelect: 'medication-field-durationUnit-4q8f-select',
      prescriberInput: 'medication-field-prescriberId-3x5h-input',
      indicationInput: 'medication-field-indication-9w6y',
      notesInput: 'medication-field-notes-5b3t',
      dischargeQuantityInput: 'medication-field-quantity-6j9m',
      finaliseAndPrintButton: 'medication-button-finaliseAndPrint-8v2q',
      finaliseButton: 'medication-button-finalise-7x3d',
    } as const;

    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }

    // FormCancelButton overrides data-testid, so use role-based locator
    this.cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });
  }

  async waitForModalToLoad(): Promise<void> {
    await this.finaliseButton.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async waitForModalToClose(): Promise<void> {
    await this.finaliseButton.waitFor({ state: 'detached' });
  }

  async selectMedication(options: { selectFirst?: boolean; optionToSelect?: string | null } = {}): Promise<string | undefined> {
    return await selectAutocompleteFieldOption(this.page, this.medicationInput, {
      selectFirst: options.selectFirst ?? true,
      optionToSelect: options.optionToSelect ?? null,
      returnOptionText: true,
    });
  }

  async selectFrequency(options: { selectFirst?: boolean; optionToSelect?: string | null } = {}): Promise<string | undefined> {
    return await selectAutocompleteFieldOption(this.page, this.frequencyInput, {
      selectFirst: options.selectFirst ?? true,
      optionToSelect: options.optionToSelect ?? null,
      returnOptionText: true,
    });
  }

  async selectUnits(optionToSelect?: string): Promise<string | undefined> {
    return await selectFieldOption(this.page, this.unitsSelect, {
      selectFirst: !optionToSelect,
      optionToSelect: optionToSelect ?? null,
      returnOptionText: true,
    });
  }

  async selectRoute(optionToSelect?: string): Promise<string | undefined> {
    return await selectFieldOption(this.page, this.routeSelect, {
      selectFirst: !optionToSelect,
      optionToSelect: optionToSelect ?? null,
      returnOptionText: true,
    });
  }

  async fillDoseAmount(amount: string): Promise<void> {
    await this.doseAmountInput.locator('input').fill(amount);
  }

  async fillIndication(text: string): Promise<void> {
    await this.indicationInput.locator('input').fill(text);
  }

  async fillNotes(text: string): Promise<void> {
    await this.notesInput.locator('input').fill(text);
  }

  async fillDuration(value: string, unit?: string): Promise<void> {
    await this.durationValueInput.locator('input').fill(value);
    if (unit) {
      await selectFieldOption(this.page, this.durationUnitSelect, {
        optionToSelect: unit,
      });
    }
  }

  async fillDischargeQuantity(quantity: string): Promise<void> {
    await this.dischargeQuantityInput.locator('input').fill(quantity);
  }

  /**
   * Fill only the required fields for a basic prescription.
   * Returns the selected values for later assertion.
   */
  async fillRequiredFields(): Promise<{
    medication: string | undefined;
    doseAmount: string;
    units: string | undefined;
    frequency: string | undefined;
    route: string | undefined;
  }> {
    const medication = await this.selectMedication({ selectFirst: true });
    const doseAmount = '500';
    await this.fillDoseAmount(doseAmount);
    const units = await this.selectUnits();
    const frequency = await this.selectFrequency({ selectFirst: true });
    const route = await this.selectRoute();

    return { medication, doseAmount, units, frequency, route };
  }

  /**
   * Fill required fields and click Finalise.
   * Returns the selected values.
   */
  async fillAndFinalise(): Promise<{
    medication: string | undefined;
    doseAmount: string;
    units: string | undefined;
    frequency: string | undefined;
    route: string | undefined;
  }> {
    const values = await this.fillRequiredFields();
    await this.finaliseButton.click();
    await this.waitForModalToClose();
    return values;
  }
}
