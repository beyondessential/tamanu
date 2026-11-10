import { Locator, Page } from '@playwright/test';
import { BasePage } from '../../../BasePage';

/**
 * Page Object for the Delete Procedure confirmation modal
 */
export class DeleteProcedureModal extends BasePage {
  readonly modalTitle: Locator;
  readonly modalContent: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);

    const dialog = page.getByRole('dialog');
    this.modalTitle = dialog.getByTestId('modaltitle-ojhf');
    this.modalContent = dialog.getByTestId('modalcontent-bk4w');
    this.confirmButton = dialog.getByTestId('confirmbutton-y3tb');
    this.cancelButton = dialog.getByTestId('outlinedbutton-p957');
  }

  async waitForModalToLoad(): Promise<void> {
    await this.modalTitle.waitFor({ state: 'visible' });
  }

  async waitForModalToClose(): Promise<void> {
    await this.modalTitle.waitFor({ state: 'detached' });
  }
}
