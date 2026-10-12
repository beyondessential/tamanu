import { Locator, Page } from '@playwright/test';

export class DocumentPreviewModal {
  readonly page: Page;

  readonly downloadButton!: Locator;
  readonly pdfDocument!: Locator;
  readonly photo!: Locator;
  readonly pdfPages: Locator;

  constructor(page: Page) {
    this.page = page;

    // `Modal` hardcodes its own `data-testid` after spreading props, so the preview's own elements
    // are the wait targets.
    const testIds = {
      downloadButton: 'button-54bc',
      pdfDocument: 'pdfdocument-qcy9',
      photo: 'image-znla',
    } as const;

    for (const [key, testId] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(testId);
    }

    this.pdfPages = this.pdfDocument.getByTestId('page-jwi7');
  }

  async waitForModalToLoad(): Promise<void> {
    await this.downloadButton.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  /**
   * A visible modal alone doesn't prove the bytes arrived: an awaiting attachment renders it with a
   * message.
   */
  async waitForFirstPageToRender(): Promise<void> {
    await this.pdfPages.first().waitFor({ state: 'visible', timeout: 15000 });
  }
}
