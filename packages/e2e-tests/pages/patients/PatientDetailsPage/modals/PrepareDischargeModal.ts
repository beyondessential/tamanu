import { Page, Locator } from '@playwright/test';

export class PrepareDischargeModal {
  readonly page: Page;
  readonly form: Locator;
  
  // Form fields
  readonly dischargeNoteTextarea: Locator;
  
  readonly orderingPrescriberInput: Locator;

  // Action buttons
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;
  readonly saveAndExitButton: Locator;
  readonly discardChangesButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main form container
    this.form = page.getByTestId('field-0uma-input').locator('..');
    
    // Form fields
    this.dischargeNoteTextarea = page.getByTestId('field-0uma-input');
    // The field's test id lands on the input's container rather than the input, so the disabled
    // state is only readable from the input itself.
    this.orderingPrescriberInput = page.locator(
      'input[name="pharmacyOrder.orderingClinicianId"]',
    );
    
    // Action buttons (these would need to be updated with actual test IDs from the modal)
    this.confirmButton = page.getByTestId('box-p5wr');
    this.cancelButton = page.getByRole('dialog').getByTestId('outlinedbutton-8rnr');
    // Saving the form as a draft, and discarding it from the unsaved-changes screen. Both are
    // the button row's back-row button, which every such row shares a test id for, so they are
    // addressed by their own copy within the dialog.
    this.saveAndExitButton = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Save & exit', exact: true });
    this.discardChangesButton = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Discard changes', exact: true });
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

  /** The inline validation message beneath a row's dispensing quantity. */
  dispensingQuantityError(prescriptionId: string): Locator {
    // The message is rendered outside the input's own container, so it is addressed via the row.
    return this.page
      .locator('tr', { has: this.dispensingQuantityInput(prescriptionId) })
      .locator('.MuiFormHelperText-root');
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

  /** Saves the form as a draft and closes it, leaving the encounter open. */
  async saveAndExit() {
    await this.saveAndExitButton.click();
    await this.waitForModalToClose();
  }

  /**
   * Closes a form with unsaved changes by discarding them. A form with edits routes to the
   * unsaved-changes screen rather than closing outright, so the discard has to be confirmed there.
   */
  async cancelAndDiscardChanges() {
    await this.cancelButton.click();
    await this.discardChangesButton.waitFor({ state: 'visible' });
    await this.discardChangesButton.click();
    await this.waitForModalToClose();
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
