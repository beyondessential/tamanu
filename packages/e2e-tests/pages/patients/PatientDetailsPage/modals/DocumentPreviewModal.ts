import { Locator, Page } from '@playwright/test';

export class DocumentPreviewModal {
  readonly page: Page;

  readonly downloadButton!: Locator;
  readonly pdfDocument!: Locator;
  readonly photo!: Locator;
  readonly pdfPages: Locator;

  constructor(page: Page) {
    this.page = page;

    // The modal container carries no id of its own to wait on: `Modal` hardcodes
    // its own `data-testid` after spreading props, so the one this modal passes
    // is discarded. These are the preview's own elements instead.
    const testIds = {
      downloadButton: 'button-54bc',
      pdfDocument: 'pdfdocument-qcy9',
      photo: 'image-znla',
    } as const;

    for (const [key, testId] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(testId);
    }

    // Every rendered page carries this id, so the locator matches all of them.
    this.pdfPages = this.pdfDocument.getByTestId('page-jwi7');
  }

  async waitForModalToLoad(): Promise<void> {
    await this.downloadButton.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  /**
   * A rendered page proves the bytes arrived and decoded, which a visible modal
   * alone does not: an attachment awaiting its content renders the modal with a
   * message in place of the pages.
   */
  async waitForFirstPageToRender(): Promise<void> {
    await this.pdfPages.first().waitFor({ state: 'visible', timeout: 15000 });
  }
}
