import { Locator, Page } from '@playwright/test';
import { expect } from '../../../fixtures/baseFixture';
import { AddDocumentModal } from '../modals/AddDocumentModal';

export class DocumentsPane {
  readonly page: Page;

  readonly addDocumentButton!: Locator;
  private _addDocumentModal?: AddDocumentModal;
  readonly tableRows!: Locator;
  readonly noteDataContainer!: Locator;
  constructor(page: Page) {
    this.page = page;

    const testIds = {
        addDocumentButton: 'component-enxe',
        noteDataContainer: 'statustablecell-rwkq',

    } as const;

    for (const [key, testId] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(testId);
    }

  }

  async waitForNoteDataContainerToDisappear(): Promise<void> {
    await this.noteDataContainer.waitFor({ state: 'detached' });
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
    await this.waitForNoteDataContainerToDisappear();
    return formValues;
  }
}

