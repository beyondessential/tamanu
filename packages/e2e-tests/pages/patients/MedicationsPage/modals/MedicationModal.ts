import { Locator, Page, expect } from '@playwright/test';
import { selectAutocompleteFieldOption, selectFieldOption } from '@utils/fieldHelpers';
import { PrintPrescriptionModal } from './PrintPrescriptionModal';

export interface MedicationFormData {
  medicationName: string;
  doseAmount?: string;
  units: string;
  frequency: string;
  route: string;
  date: string;
  startDate: string;
  durationValue?: string;
  durationUnit?: string;
  prescriberName: string;
  indication?: string;
  notes?: string;
  isOngoing?: boolean;
  isPrn?: boolean;
  isVariableDose?: boolean;
  quantity?: string;
  patientWeight?: string;
}

export class MedicationModal {
  readonly page: Page;
  readonly modalTitleText!: Locator;
  readonly medicationInput!: Locator;
  readonly doseAmountInput!: Locator;
  readonly unitsSelect!: Locator;
  readonly frequencyInput!: Locator;
  readonly routeSelect!: Locator;
  readonly dateInput!: Locator;
  readonly startDateInput!: Locator;
  readonly durationValueInput!: Locator;
  readonly durationUnitSelect!: Locator;
  readonly prescriberInput!: Locator;
  readonly prescriberClearButton!: Locator;
  readonly indicationInput!: Locator;
  readonly notesTextarea!: Locator;
  readonly isOngoingCheckbox!: Locator;
  readonly isPrnCheckbox!: Locator;
  readonly isVariableDoseCheckbox!: Locator;
  readonly quantityInput!: Locator;
  readonly patientWeightInput!: Locator;
  readonly finaliseButton!: Locator;
  readonly finaliseAndPrintButton!: Locator;
  readonly cancelButton!: Locator;
  readonly continueButton!: Locator;

  constructor(page: Page) {
    this.page = page;

    const testIds = {
      medicationInput: 'medication-field-medicationId-8k3m-input',
      unitsSelect: 'medication-field-units-2r9v-select',
      frequencyInput: 'medication-field-frequency-4c7z-input',
      routeSelect: 'medication-field-route-6d1b-select',
      durationUnitSelect: 'medication-field-durationUnit-4q8f-select',
      prescriberInput: 'medication-field-prescriberId-3x5h-input',
      prescriberClearButton: 'medication-field-prescriberId-3x5h-input-clearbutton',
      isOngoingCheckbox: 'medication-field-isOngoing-7j2p-controlcheck',
      isPrnCheckbox: 'medication-field-isPrn-9n4q-controlcheck',
      isVariableDoseCheckbox: 'medication-field-isVariableDose-5h8x-controlcheck',
      patientWeightInput: 'medication-field-patientWeight-1k7c',
      finaliseButton: 'medication-button-finalise-7x3d',
      finaliseAndPrintButton: 'medication-button-finaliseAndPrint-8v2q',
      continueButton: 'confirmbutton-tok1',
    } as const;

    for (const [key, testId] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(testId);
    }

    this.doseAmountInput = page.getByTestId('medication-field-doseAmount-3t6w').locator('input[name="doseAmount"]');
    this.durationValueInput = page.getByTestId('medication-field-durationValue-7p2n').locator('input[name="durationValue"]');
    this.quantityInput = page.getByTestId('medication-field-quantity-6j9m').locator('input[name="quantity"]');
    this.dateInput = page.getByTestId('medication-field-date-8m5k-input').locator('input[type="date"]');
    this.startDateInput = page.getByTestId('medication-field-startDate-1a9s-input').locator('input[type="datetime-local"]');
    this.indicationInput = page.getByTestId('medication-field-indication-9w6y-input');
    this.notesTextarea = page.getByTestId('medication-field-notes-5b3t-input');

    this.modalTitleText = page.getByTestId('modaltitle-ojhf');
    this.cancelButton= page.getByTestId('modalcontent-bk4w').getByTestId('outlinedbutton-8rnr'); 
  }

  async waitForModalToLoad(): Promise<void> {
    await this.modalTitleText.waitFor({ state: 'visible' });
  }

  async fillMedicationForm(data: MedicationFormData): Promise<void> {
    await this.waitForModalToLoad();
    await this.continueButton.click();
    if (data.medicationName) {
      await selectAutocompleteFieldOption(this.page, this.medicationInput, {
        optionToSelect: data.medicationName,
        returnOptionText: true,
      });
    }else{
      await selectAutocompleteFieldOption(this.page, this.medicationInput, {
        selectFirst: true,
        returnOptionText: true,
      });
    }

    if (data.doseAmount) {
      await this.doseAmountInput.fill(data.doseAmount);
    }

    if (data.units) {
     await selectFieldOption(this.page, this.unitsSelect, {
      optionToSelect: data.units,
      returnOptionText: true,
    });
    }else{
      await selectFieldOption(this.page, this.unitsSelect, {
        selectFirst: true,
        returnOptionText: true,
      });
    }

    if (data.frequency) {
      await selectAutocompleteFieldOption(this.page, this.frequencyInput, {
        optionToSelect: data.frequency,
        returnOptionText: true,
      });
    } else {
      await selectAutocompleteFieldOption(this.page, this.frequencyInput, {
        selectFirst: true,
        returnOptionText: true,
      });
    }

    if (data.route) {
      await selectFieldOption(this.page, this.routeSelect, {
        optionToSelect: data.route,
        returnOptionText: true,
      });
    } else {
      await selectFieldOption(this.page, this.routeSelect, {
        selectFirst: true,
        returnOptionText: true,
      });
    }

    if (data.date) {
      await this.dateInput.fill(data.date);
    }

    if (data.startDate) {
      await this.startDateInput.fill(data.startDate);
    }

    if (data.durationValue) {
      await this.durationValueInput.fill(data.durationValue);
    }
    if (data.durationUnit) {
      await selectFieldOption(this.page, this.durationUnitSelect, {
        optionToSelect: data.durationUnit,
        returnOptionText: true,
      });
    }

    if (data.prescriberName) {
      const currentPrescriberValue = await this.prescriberInput.locator('input').inputValue().catch(() => '');
      
      if (currentPrescriberValue && currentPrescriberValue !== data.prescriberName) {
        const clearButtonVisible = await this.prescriberClearButton.isVisible().catch(() => false);
        if (clearButtonVisible) {
          await this.prescriberClearButton.click();
          await this.page.waitForTimeout(300);
        }
      }
      
      await selectAutocompleteFieldOption(this.page, this.prescriberInput, {
        optionToSelect: data.prescriberName,
        returnOptionText: true,
      });
    }

    if (data.indication) {
      await this.indicationInput.fill(data.indication);
    }

    if (data.notes) {
      await this.notesTextarea.fill(data.notes);
    }

    if (data.isOngoing) {
      await this.isOngoingCheckbox.check();
    }

    if (data.isPrn) {
      await this.isPrnCheckbox.check();
    }

    if (data.isVariableDose) {
      await this.isVariableDoseCheckbox.check();
    }

    if (data.quantity) {
      await this.quantityInput.fill(data.quantity);
    }

    if (data.patientWeight) {
      await this.patientWeightInput.fill(data.patientWeight);
    }
  }

  async submitForm(print: boolean = false): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    
    const submitButton = print ? this.finaliseAndPrintButton : this.finaliseButton;
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: 15000 });
    
    if (print) {
      const printModal = new PrintPrescriptionModal(this.page);
      await printModal.waitForModalToLoad();
      await printModal.close();
    }
  }

  async cancel(): Promise<void> {
    const modalContent = this.page.getByTestId('modalcontent-bk4w');
    await modalContent.getByTestId('outlinedbutton-8rnr').click();
    await this.modalTitleText.waitFor({ state: 'hidden' });
  }

  async validateFormField(fieldName: string, expectedValue: string): Promise<void> {
    const fieldMap: Record<string, Locator> = {
      medication: this.medicationInput,
      doseAmount: this.doseAmountInput,
      frequency: this.frequencyInput,
      route: this.routeSelect,
      date: this.dateInput,
      startDate: this.startDateInput,
      indication: this.indicationInput,
      notes: this.notesTextarea,
    };

    const field = fieldMap[fieldName];
    if (field) {
      await expect(field).toHaveValue(expectedValue);
    }
  }
}
