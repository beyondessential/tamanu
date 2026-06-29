import { Locator, Page } from '@playwright/test';
import { selectAutocompleteFieldOption } from '@utils/fieldHelpers';

export class MedicationDiscontinueModal {
  readonly page: Page;
  readonly discontinuedByField: Locator;
  readonly discontinuedByInput: Locator;
  readonly discontinueReasonInput: Locator;
  readonly discontinueButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.discontinuedByField = page.getByTestId('field-discontinuingclinicianid-input-input');
    this.discontinuedByInput = this.discontinuedByField.locator('input');
    this.discontinueReasonInput = page
      .getByTestId('field-discontinuingreason-input')
      .locator('input');
    this.discontinueButton = page.getByTestId('formsubmitbutton-discontinue-def456');
    this.cancelButton = page.getByTestId('formcancelbutton-cancel-xyz789');
  }

  async waitForModalToLoad(): Promise<void> {
    await this.discontinuedByField.waitFor({ state: 'visible' });
  }

  async getDiscontinuedByValue(): Promise<string> {
    return (await this.discontinuedByInput.inputValue()).trim();
  }

  async changeDiscontinuedBy(currentUserDisplayName: string): Promise<void> {
    await selectAutocompleteFieldOption(this.page, this.discontinuedByField, {
      optionToAvoid: currentUserDisplayName,
    });
  }

  async fillReason(reason: string): Promise<void> {
    await this.discontinueReasonInput.fill(reason);
  }

  async submit(): Promise<void> {
    await this.discontinueButton.click();
    await this.discontinuedByField.waitFor({ state: 'hidden' });
  }
}
