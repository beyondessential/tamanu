import { Locator, Page, Response } from '@playwright/test';

import { ImportExportAdminPage } from './ImportExportAdminPage';

export class PatientDataAdminPage extends ImportExportAdminPage {
  readonly exportButton: Locator;

  constructor(page: Page) {
    super(page, '/admin/patientData');
    this.exportButton = page.getByRole('button', { name: 'Export patient data' });
  }

  /**
   * Chromium offers the File System Access save picker, which is a native dialog Playwright cannot
   * drive. Replace it with an in-memory file handle so the export completes without a dialog.
   * Must be called before the page loads.
   */
  async stubSaveFilePicker() {
    await this.page.addInitScript(() => {
      const writable = { write: async () => {}, close: async () => {}, abort: async () => {} };
      Object.assign(window, {
        showSaveFilePicker: async () => ({ createWritable: async () => writable }),
      });
    });
  }

  /** Exports the selected data types and returns the server's response to the export request */
  async exportSelectedDataTypes(): Promise<Response> {
    const exportResponse = this.page.waitForResponse(response =>
      response.url().includes('admin/export/referenceData'),
    );
    await this.exportButton.click();
    return exportResponse;
  }
}
