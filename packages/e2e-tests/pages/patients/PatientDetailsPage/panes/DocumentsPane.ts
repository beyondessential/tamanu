import { Locator, Page } from '@playwright/test';
import { AddDocumentModal } from '../modals/AddDocumentModal';
import { DocumentPreviewModal } from '../modals/DocumentPreviewModal';

export class DocumentsPane {
  readonly page: Page;

  readonly addDocumentButton!: Locator;
  private _addDocumentModal?: AddDocumentModal;
  private _documentPreviewModal?: DocumentPreviewModal;
  readonly documentsTable!: Locator;
  readonly noteDataContainer!: Locator;
  readonly tableRows: Locator;
  constructor(page: Page) {
    this.page = page;

    const testIds = {
        addDocumentButton: 'component-enxe',
        noteDataContainer: 'statustablecell-rwkq',
        documentsTable: 'datafetchingtable-s6m9',

    } as const;

    for (const [key, testId] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(testId);
    }

    this.tableRows = this.documentsTable.locator('tbody tr');
  }

  getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  /**
   * @param rowIndex - The row index (0-based)
   * @param columnIndex - The column index (0-based): name, type, upload date,
   * owner, department
   */
  getTableCell(rowIndex: number, columnIndex: number): Locator {
    return this.tableRows.nth(rowIndex).locator('td').nth(columnIndex);
  }

  /** Clicking a row is what opens the preview; there is no separate control. */
  async openDocumentPreview(rowIndex = 0): Promise<DocumentPreviewModal> {
    await this.tableRows.nth(rowIndex).click();
    const previewModal = this.getDocumentPreviewModal();
    await previewModal.waitForModalToLoad();
    return previewModal;
  }

  getDocumentPreviewModal(): DocumentPreviewModal {
    if (!this._documentPreviewModal) {
      this._documentPreviewModal = new DocumentPreviewModal(this.page);
    }
    return this._documentPreviewModal;
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

