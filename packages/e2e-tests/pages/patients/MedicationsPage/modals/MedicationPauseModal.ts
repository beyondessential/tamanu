import { Locator, Page } from '@playwright/test';

export class MedicationPauseModal {
  readonly page: Page;
  readonly modalTitleText!: Locator;
  readonly modalContainer!: Locator;
  readonly modalContent!: Locator;
  readonly form!: Locator;
  readonly closeButton!: Locator;
  readonly pauseDurationInput!: Locator;
  readonly pauseTimeUnitSelect!: Locator;
  readonly notesInput!: Locator;
  readonly cancelButton!: Locator;
  readonly pauseButton!: Locator;
  readonly pauseDialog!: Locator;

  constructor(page: Page) {
    this.page = page;

    // Scope to the pause modal dialog to avoid conflicts with other modals - find by unique title text
    this.pauseDialog = page.getByRole('dialog').filter({ 
      has: page.getByText(/Pause medication/i, { exact: false })
    }).last();
    
    this.modalTitleText = this.pauseDialog.getByTestId('modaltitle-ojhf').first();
    this.modalContainer = this.pauseDialog.getByTestId('modalcontainer-uc2n');
    this.modalContent = this.pauseDialog.getByTestId('modalcontent-bk4w');
    this.form = this.pauseDialog.getByTestId('styledform-5o5i');
    this.closeButton = this.pauseDialog.getByTestId('iconbutton-eull');
    
    // Form fields
    this.pauseDurationInput = this.pauseDialog.locator('input[name="pauseDuration"]');
    // Pause time unit select - find by name attribute since testid may be undefined
    this.pauseTimeUnitSelect = this.pauseDialog.locator('input[name="pauseTimeUnit"]').or(
      this.pauseDialog.locator('[name="pauseTimeUnit"]')
    ).first();
    this.notesInput = this.pauseDialog.locator('input[name="notes"]');
    
    // Form buttons
    this.cancelButton = this.pauseDialog.getByTestId('outlinedbutton-8rnr');
    this.pauseButton = this.form.getByRole('button', { name: 'Pause', exact: true });
  }

  async waitForModalToLoad(): Promise<void> {
    // Wait for the dialog to be visible first, then the title
    await this.pauseDialog.waitFor({ state: 'visible' });
    await this.modalTitleText.waitFor({ state: 'visible' });
  }

  async waitForModalToClose(): Promise<void> {
    await this.modalTitleText.waitFor({ state: 'detached' });
    await this.page.waitForLoadState('networkidle');
  }

  async fillPauseForm(pauseDuration: number = 1, pauseTimeUnit: 'hour (s)' | 'day (s)' = 'day (s)', notes?: string): Promise<void> {
    await this.pauseDurationInput.waitFor({ state: 'visible' });
    await this.pauseDurationInput.fill(pauseDuration.toString());
    
    await this.pauseTimeUnitSelect.waitFor({ state: 'visible' });
    await this.pauseTimeUnitSelect.click();
    await this.page.waitForTimeout(500); // Wait for menu to open
    
    // Scope option locator to the menu/popper that appears after clicking select
    const menu = this.page.locator('[role="listbox"]').or(this.page.locator('[role="menu"]')).or(this.page.getByTestId('autocompleteinput-suggestionslist'));
    const pauseTimeUnitOption = menu.getByRole('option').filter({ hasText: new RegExp(`^${pauseTimeUnit}$`, 'i') });
    await pauseTimeUnitOption.waitFor({ state: 'visible' });
    await pauseTimeUnitOption.click();
    
    if (notes) {
      await this.notesInput.fill(notes);
    }
  }

  async pause(pauseDuration: number = 1, pauseTimeUnit: 'hour (s)' | 'day (s)' = 'day (s)', notes?: string): Promise<void> {
    await this.fillPauseForm(pauseDuration,pauseTimeUnit, notes);
    await this.pauseButton.click();
    await this.page.waitForLoadState('networkidle');
    await this.waitForModalToClose();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await this.page.waitForLoadState('networkidle');
  }
}
