import { Locator, Page } from '@playwright/test';
import { AddDocumentModal } from '../modals/AddDocumentModal';

export class DocumentsPane {
  readonly page: Page;

  readonly addDocumentButton!: Locator;
  private _addDocumentModal?: AddDocumentModal;

  constructor(page: Page) {
    this.page = page;

    const testIds = {
        addDocumentButton: 'component-enxe',

    } as const;

    for (const [key, testId] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(testId);
    }

  }

  async waitForPageToLoad(): Promise<void> {
    await this.addDocumentButton.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  getAddDocumentModal(): AddDocumentModal {
    if (!this._addDocumentModal) {
      this._addDocumentModal = new AddDocumentModal(this.page);
    }
    return this._addDocumentModal;
  }

  async addDocument(values: { fileName: string; documentOwner?: string; note?: string; filePath: string }): Promise<{ department: string }> {
    await this.addDocumentButton.click();
    const addDocumentModal = this.getAddDocumentModal();
    await addDocumentModal.waitForModalToLoad();
    const formValues = await addDocumentModal.fillForm(values);
    await addDocumentModal.confirmButton.click();
    await this.waitForPageToLoad();
    return formValues;
  }
}

