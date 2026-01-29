import { Locator, Page } from '@playwright/test';
import { selectAutocompleteFieldOption } from '@utils/fieldHelpers';

export class MedicationDiscontinueModal {
  readonly page: Page;
  readonly modalTitleText!: Locator;
  readonly modalContainer!: Locator;
  readonly modalContent!: Locator;
  readonly form!: Locator;
  readonly closeButton!: Locator;
  readonly discontinuingClinician!: Locator;
  readonly discontinuingReasonInput!: Locator;
  readonly cancelButton!: Locator;
  readonly discontinueButton!: Locator;
  readonly discontinueDialog!: Locator;

  constructor(page: Page) {
    this.page = page;

    // Scope to the dialog containing "Discontinue medication" - find by unique title text
    this.discontinueDialog = page.getByRole('dialog').filter({ 
      has: page.getByText(/Discontinue medication/i, { exact: false })
    }).last();
    
    this.modalTitleText = this.discontinueDialog.getByTestId('modaltitle-ojhf').first();
    this.modalContainer = this.discontinueDialog.getByTestId('modalcontainer-uc2n');
    this.modalContent = this.discontinueDialog.getByTestId('modalcontent-bk4w');
    this.form = this.discontinueDialog.getByTestId('styledform-5o5i');
    this.closeButton = this.discontinueDialog.getByTestId('iconbutton-eull');
    
    // Form fields
    this.discontinuingClinician = this.discontinueDialog.getByTestId('autocompleteinput-input');
    this.discontinuingReasonInput = this.discontinueDialog.getByTestId('undefined-input');
    
    // Form buttons
    this.cancelButton = this.discontinueDialog.getByTestId('outlinedbutton-8rnr');
    this.discontinueButton = this.form.getByRole('button', { name: 'Discontinue', exact: true });
  }

  async waitForModalToLoad(): Promise<void> {
    // Wait for the dialog to be visible first, then the title
    await this.discontinueDialog.waitFor({ state: 'visible' });
    await this.modalTitleText.waitFor({ state: 'visible' });
  }

  async waitForModalToClose(): Promise<void> {
    await this.modalTitleText.waitFor({ state: 'detached' });
    await this.page.waitForLoadState('networkidle');
  }

  async fillDiscontinueForm(discontinuingClinician?: string, discontinuingReason: string = 'Test reason'): Promise<void> {
    if (discontinuingClinician) {
      await selectAutocompleteFieldOption(this.page, this.discontinuingClinician, {
        optionToSelect: discontinuingClinician,
        returnOptionText: true,
      });
    } else {
      await selectAutocompleteFieldOption(this.page, this.discontinuingClinician, {
        selectFirst: true,
        returnOptionText: true,
      });
    }

    await this.discontinuingReasonInput.fill(discontinuingReason);
  }

  async discontinue(discontinuingClinician?: string, discontinuingReason: string = 'Test reason'): Promise<void> {
    await this.fillDiscontinueForm(discontinuingClinician, discontinuingReason);
    await this.discontinueButton.click();
    await this.page.waitForLoadState('networkidle');
    await this.waitForModalToClose();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await this.page.waitForLoadState('networkidle');
    await this.waitForModalToClose();
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await this.waitForModalToClose(); 
  }
}
