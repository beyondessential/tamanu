import { Page, Locator, expect } from '@playwright/test';

import { selectAutocompleteFieldOption } from '@utils/fieldHelpers';
import { fillMuiDateTimeField, formatForMuiDateTimePicker } from '@utils/dateTimeHelpers';
import { MedicationDiscontinueModal } from '../../MedicationsPage/modals/MedicationDiscontinueModal';

export class PrepareDischargeModal {
  readonly page: Page;
  readonly form: Locator;

  // Form fields
  readonly dischargeNoteTextarea: Locator;

  readonly dischargeDateInput: Locator;
  readonly dischargingClinicianField: Locator;
  readonly dischargingClinicianInput: Locator;
  readonly dispositionField: Locator;
  readonly dispositionInput: Locator;

  readonly orderingPrescriberField: Locator;
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
    // The autocomplete helper drives the field container (it reads its test id to find the
    // suggestions list), while assertions read the input the selection lands in.
    this.dischargeDateInput = page.locator('input[name="endDate"]');
    this.dischargingClinicianField = page.getByTestId('field-6we6-input');
    this.dischargingClinicianInput = page.locator('input[name="discharge.dischargerId"]');
    this.dispositionField = page.getByTestId('localisedfield-d7fu-input');
    this.dispositionInput = page.locator('input[name="discharge.dispositionId"]');

    // The field's test id lands on the input's container rather than the input. The suggestion
    // helpers want that container...
    this.orderingPrescriberField = page.getByTestId('field-orderingprescriber-input');
    // ...while the disabled state and the selected value are only readable from the input itself.
    this.orderingPrescriberInput = page.locator(
      'input[name="pharmacyOrder.orderingClinicianId"]',
    );
    
    this.confirmButton = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Finalise discharge', exact: true });
    // Only closes the modal outright on an untouched form. A form with edits steps forward to
    // the unsaved-changes screen instead, so use cancelAndDiscardChanges() for that.
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


  /**
   * Waits on the dialog rather than a field inside it. The form's later screens (summary,
   * unsaved changes) unmount the note textarea, so waiting on that would resolve the moment the
   * form stepped forward and report a close that had not happened.
   */
  async waitForModalToClose() {
    await this.page.getByRole('dialog').waitFor({ state: 'detached' });
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

  /**
   * Sets the discharge date, given as `yyyy-MM-dd'T'HH:mm`. The field is a masked text input the
   * picker only reads on blur, and one that silently keeps its previous value when what it is
   * given does not parse, so the write is confirmed before the caller moves on.
   */
  async setDischargeDate(dateTime: string) {
    await this.dischargeDateInput.waitFor({ state: 'visible' });
    await fillMuiDateTimeField(this.dischargeDateInput, dateTime);
    await this.expectDischargeDate(dateTime);
  }

  /**
   * Asserts the discharge date the field shows, given as `yyyy-MM-dd'T'HH:mm`. Compares against
   * what the field displays rather than what is stored: the two differ whenever the facility
   * timezone does, and the display is what the clinician reads back.
   */
  async expectDischargeDate(dateTime: string) {
    await expect(this.dischargeDateInput).toHaveValue(formatForMuiDateTimePicker(dateTime));
  }

  /**
   * Picks the first suggestion in an autocomplete and returns the label the field then shows.
   * Fails loudly when the deployment has no options to pick, rather than handing back an
   * undefined that a later assertion would compare against and pass.
   */
  private async selectFirstOption(field: Locator, fieldName: string): Promise<string> {
    const label = await selectAutocompleteFieldOption(this.page, field, {
      selectFirst: true,
      returnOptionText: true,
    });
    if (!label) {
      throw new Error(`No ${fieldName} options were available to select`);
    }
    return label;
  }

  /** Picks a discharging clinician, returning the label the field then shows. */
  async selectDischargingClinician(): Promise<string> {
    return this.selectFirstOption(this.dischargingClinicianField, 'discharging clinician');
  }

  /** Picks a discharge disposition, returning the label the field then shows. */
  async selectDisposition(): Promise<string> {
    return this.selectFirstOption(this.dispositionField, 'discharge disposition');
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

  /** Steps back to the form from the unsaved-changes screen, keeping what was entered. */
  async cancelAndReturnToForm() {
    await this.cancelButton.click();
    await this.discardChangesButton.waitFor({ state: 'visible' });
    // The unsaved-changes screen's own cancel is what returns to the form.
    await this.cancelButton.click();
    await this.discardChangesButton.waitFor({ state: 'hidden' });
  }

  /** Finalises the discharge, including the confirmation step the form shows before submitting. */
  async finaliseDischarge() {
    await this.attemptFinaliseDischarge();
    const confirmDischargeButton = this.page
      .getByRole('dialog')
      .getByRole('button', { name: 'Confirm', exact: true });
    await confirmDischargeButton.waitFor({ state: 'visible' });
    await confirmDischargeButton.click();
    await this.waitForModalToClose();
  }
}
