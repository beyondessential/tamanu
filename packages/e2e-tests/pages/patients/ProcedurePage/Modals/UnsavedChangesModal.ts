import { Locator, Page } from '@playwright/test';
import { BasePage } from '../../../BasePage';

/**
 * Page Object for Unsaved Changes Modal
 * Contains all modal elements and interactions using getByTestId
 */
export class UnsavedChangesModal extends BasePage {

  readonly modalTitle!: Locator;
  readonly modalContent!: Locator;
  readonly closeButton!: Locator;
  readonly continueEditingButton!: Locator;
  readonly discardChangesButton!: Locator;

  constructor(page: Page) {
    super(page);
    
    const testIds = {
      modalTitle: 'modaltitle-ojhf',
      closeButton: 'iconbutton-eull',
      continueEditingButton: 'outlinedbutton-p957',
      discardChangesButton: 'confirmbutton-y3tb',
    
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
    this.modalContent = page.getByRole('dialog').getByTestId('modalcontent-bk4w');
  }

  /**
   * Wait for the modal to be visible
   */
  async waitForModalToLoad(): Promise<void> {
    await this.modalContent.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  /**
   * Wait for the modal to close
   */
  async waitForModalToClose(): Promise<void> {
    await this.modalContent.waitFor({ state: 'detached' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  /**
   * Click the continue editing button
   */
  async clickContinueEditing(): Promise<void> {
    await this.continueEditingButton.click();
    await this.waitForModalToClose();
  }

  /**
   * Click the discard changes button
   */
  async clickDiscardChanges(): Promise<void> {
    await this.discardChangesButton.click();
    await this.waitForModalToClose();
  }

  /**
   * Click the close button (X)
   */
  async clickClose(): Promise<void> {
    await this.closeButton.click();
    await this.waitForModalToClose();
  }
}
