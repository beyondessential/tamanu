import { Locator, Page, expect } from '@playwright/test';
import { MedicationDiscontinueModal } from './MedicationDiscontinueModal';
import { MedicationPauseModal } from './MedicationPauseModal';

export class MedicationDetailsModal {
  readonly page: Page;
  readonly modalTitleText!: Locator;
  readonly modalContainer!: Locator;
  readonly modalContent!: Locator;
  readonly form!: Locator;
  readonly closeButton!: Locator;
  readonly pauseButton!: Locator;
  readonly discontinueButton!: Locator;
  readonly cancelButton!: Locator;
  readonly confirmButton!: Locator;
  readonly resumeButton!: Locator;
  readonly pauseDialog!: Locator;
  readonly discontinueDialog!: Locator;

  constructor(page: Page) {
    this.page = page;

    this.modalTitleText = page.getByTestId('modaltitle-ojhf');
    this.modalContainer = page.getByTestId('modalcontainer-uc2n');
    this.modalContent = page.getByTestId('modalcontent-bk4w');
    this.form = page.getByTestId('styledform-5o5i');
    this.closeButton = page.getByTestId('iconbutton-eull');
    
    // Buttons within the form - scoped to form for better reliability
    this.pauseButton = this.form.getByRole('button', { name: 'Pause', exact: true });
    this.discontinueButton = this.form.getByRole('button', { name: 'Discontinue', exact: true });
    this.cancelButton = this.form.getByRole('button', { name: 'Cancel', exact: true });
    this.confirmButton = this.form.getByRole('button', { name: 'Confirm', exact: true }).filter({ hasText: 'Confirm' });
    this.resumeButton = this.form.getByRole('button', { name: 'Resume', exact: true });
    
    // Dialog locators for nested modals
    this.pauseDialog = page.getByRole('dialog').filter({ hasText: /Pause medication/i }).last();
    this.discontinueDialog = page.getByRole('dialog').filter({ hasText: /Discontinue medication/i }).last();
  }

  async waitForModalToLoad(): Promise<void> {
    await this.modalTitleText.waitFor({ state: 'visible'});
  }

  async waitForModalToClose(): Promise<void> {
    await this.modalTitleText.waitFor({ state: 'detached' });
  }

  async clickPause(): Promise<MedicationPauseModal> {
    await expect(this.pauseButton).toBeEnabled( );
    await this.pauseButton.click();
    await this.page.waitForLoadState('networkidle');
    
    // Wait for the pause modal dialog to appear
    await this.pauseDialog.waitFor({ state: 'visible' });
    
    const pauseModal = new MedicationPauseModal(this.page);
    await pauseModal.waitForModalToLoad();
    return pauseModal;
  }

  async pauseMedication(pauseDuration: number = 1, pauseTimeUnit: 'hour (s)' | 'day (s)' = 'day (s)', notes?: string): Promise<void> {
    const pauseModal = await this.clickPause();
    await pauseModal.pause(pauseDuration ,pauseTimeUnit, notes);
    await this.waitForModalToClose();
  }

  async clickDiscontinue(): Promise<MedicationDiscontinueModal> {
    await expect(this.discontinueButton).toBeEnabled();
    await this.discontinueButton.click();
    await this.page.waitForLoadState('networkidle');
    
    // Wait for the discontinue modal dialog to appear
    await this.discontinueDialog.waitFor({ state: 'visible' });
    
    const discontinueModal = new MedicationDiscontinueModal(this.page);
    await discontinueModal.waitForModalToLoad();
    return discontinueModal;
  }

  async discontinueMedication(discontinuingClinician?: string, discontinuingReason: string = 'Test reason'): Promise<void> {
    const discontinueModal = await this.clickDiscontinue();
    await discontinueModal.discontinue(discontinuingClinician, discontinuingReason);
    await this.waitForModalToClose();
  }

  async clickCloseButton(): Promise<void> {
    await this.closeButton.waitFor({ state: 'visible' });
    await this.closeButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async close(): Promise<void> {
    await this.clickCloseButton();
    await this.waitForModalToClose();
  }
}
