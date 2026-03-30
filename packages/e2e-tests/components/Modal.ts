import { Locator, Page } from '@playwright/test';

/**
 * Base component for Tamanu modals/dialogs.
 * Page objects compose this for modal-specific locators.
 */
export class Modal {
  readonly dialog: Locator;

  constructor(readonly page: Page) {
    this.dialog = page.getByRole('dialog');
  }

  /** Wait for the modal to open. */
  async waitForOpen(): Promise<void> {
    await this.dialog.waitFor({ state: 'visible' });
  }

  /** Wait for the modal to close. */
  async waitForClose(): Promise<void> {
    await this.dialog.waitFor({ state: 'detached' });
  }

  /** Get the modal title locator (common testid across most Tamanu modals). */
  get title(): Locator {
    return this.dialog.getByTestId('modaltitle-ojhf');
  }

  /** Get the modal content container. */
  get content(): Locator {
    return this.dialog.getByTestId('modalcontent-bk4w');
  }
}
