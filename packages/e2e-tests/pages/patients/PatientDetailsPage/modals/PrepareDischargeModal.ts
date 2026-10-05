import { Page, Locator } from '@playwright/test';
import { selectAutocompleteFieldOption } from '@utils/fieldHelpers';
import { MedicationDiscontinueModal } from '../../MedicationsPage/modals/MedicationDiscontinueModal';

export class PrepareDischargeModal {
  readonly page: Page;
  readonly form: Locator;

  // Form fields
  readonly dischargeNoteTextarea: Locator;

  readonly orderingPrescriberField: Locator;
  readonly orderingPrescriberInput: Locator;

  // Action buttons
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main form container
    this.form = page.getByTestId('field-0uma-input').locator('..');
    
    // Form fields
    this.dischargeNoteTextarea = page.getByTestId('field-0uma-input');
    // The field's test id lands on the input's container rather than the input. The suggestion
    // helpers want that container...
    this.orderingPrescriberField = page.getByTestId('field-orderingprescriber-input');
    // ...while the disabled state and the selected value are only readable from the input itself.
    this.orderingPrescriberInput = page.locator(
      'input[name="pharmacyOrder.orderingClinicianId"]',
    );
    
    // Action buttons (these would need to be updated with actual test IDs from the modal)
    this.confirmButton = page.getByTestId('box-p5wr');
    this.cancelButton = page.getByRole('dialog').getByTestId('outlinedbutton-8rnr');
  }

  async waitForModalToLoad() {
    await this.dischargeNoteTextarea.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }


  async waitForModalToClose() {
    await this.dischargeNoteTextarea.waitFor({ state: 'detached' });
  }

  // Every medication row reuses the same test IDs for its inputs, so a row is addressed by its
  // Formik field name, which is keyed by prescription id.
  dispensingQuantityInput(prescriptionId: string): Locator {
    return this.page.locator(`input[name="medications.${prescriptionId}.quantity"]`);
  }

  sendToPharmacyCheckbox(prescriptionId: string): Locator {
    return this.page.locator(`input[name="medications.${prescriptionId}.sendToPharmacy"]`);
  }

  /** A medication's row in either discharge table, addressed by its own quantity input. */
  medicationRow(prescriptionId: string): Locator {
    return this.page.locator('tr', { has: this.dispensingQuantityInput(prescriptionId) });
  }

  /** The inline validation message beneath a row's dispensing quantity. */
  dispensingQuantityError(prescriptionId: string): Locator {
    // The message is rendered outside the input's own container, so it is addressed via the row.
    return this.medicationRow(prescriptionId).locator('.MuiFormHelperText-root');
  }

  /** The row's Discontinue control, which carries no test id of its own. */
  discontinueLink(prescriptionId: string): Locator {
    return this.medicationRow(prescriptionId).getByText('Discontinue', { exact: true });
  }

  /** Opens the discontinue modal for a listed medication, without submitting it. */
  async clickDiscontinue(prescriptionId: string): Promise<MedicationDiscontinueModal> {
    await this.discontinueLink(prescriptionId).click();
    const discontinueModal = new MedicationDiscontinueModal(this.page);
    await discontinueModal.waitForModalToLoad();
    return discontinueModal;
  }

  /**
   * Picks an ordering prescriber other than the given user, returning the name chosen so a caller
   * can assert the field still holds it later.
   */
  async changeOrderingPrescriber(currentUserDisplayName: string): Promise<string> {
    return (await selectAutocompleteFieldOption(this.page, this.orderingPrescriberField, {
      optionToAvoid: currentUserDisplayName,
      returnOptionText: true,
    })) as string;
  }

  async setDispensingQuantity(prescriptionId: string, quantity: number) {
    const input = this.dispensingQuantityInput(prescriptionId);
    await input.waitFor({ state: 'visible' });
    await input.fill(String(quantity));
  }

  /** Submits the form without expecting it to pass validation. */
  async attemptFinaliseDischarge() {
    await this.confirmButton.click();
  }

  /** Finalises the discharge, including the confirmation step the form shows before submitting. */
  async finaliseDischarge() {
    await this.attemptFinaliseDischarge();
    const confirmDischargeButton = this.page.getByRole('button', { name: 'Confirm' });
    await confirmDischargeButton.waitFor({ state: 'visible' });
    await confirmDischargeButton.click();
    await this.waitForModalToClose();
  }
}
