import { Page, Locator, expect } from '@playwright/test';
import { DiscardNoteModal } from './discardNoteModal';
import { format } from 'date-fns';

export class NewNoteModal {
  readonly page: Page;
  readonly discardNoteModal: DiscardNoteModal;
  // Form fields
  readonly typeSelect: Locator;
  readonly templateInput: Locator;
  readonly writtenByInput: Locator;
  readonly writtenByClearButton: Locator;
  readonly dateTimeInput: Locator;
  readonly noteContentTextarea: Locator;
  
  // Action buttons
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;
  readonly writtenByDropdownList: Locator;
  readonly noteTypeRequiredIndicator: Locator;
  readonly noteContentRequiredIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.discardNoteModal = new DiscardNoteModal(page);
    
    // Main form container
    this.typeSelect = page.getByTestId('field-a0mv-select');
    this.templateInput = page.getByTestId('field-ej08-input');
    this.writtenByInput = page.getByTestId('field-ar9q-input').locator('input');
    this.writtenByClearButton = page.getByTestId('field-ar9q-input-clearbutton');
    this.dateTimeInput = page.getByTestId('field-nwwl-input').locator('input');
    this.noteContentTextarea = page.getByTestId('field-wxzr').locator('textarea[name="content"]');
    
    // Action buttons
    this.confirmButton = page.getByTestId('formsubmitcancelrow-confirmButton');
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.writtenByDropdownList = page.getByTestId('field-ar9q-suggestionslist');
    this.noteTypeRequiredIndicator = page.getByTestId('field-a0mv-formhelptertext').getByText('*Required')
    this.noteContentRequiredIndicator = page.getByTestId('field-wxzr').locator('p').getByText('*Required')
  }

  async waitForModalToLoad() {
    await this.typeSelect.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  // Form field interaction methods
  async selectType(noteType: string) {
    await this.typeSelect.click();
    await this.typeSelect.getByText(noteType, {exact: true}).click();
  }


  async setWrittenBy(writtenBy: string) {
    await this.writtenByInput.fill(writtenBy);
    await this.writtenByDropdownList.getByText(writtenBy).click();
  }

  // Utility methods
  async fillNewNote(noteData: {
    type: string;
    template?: string;
    writtenBy: string;
    dateTime: string;
    content: string;
  }) {
    await this.selectType(noteData.type);
    
    if (noteData.template) {
      await this.templateInput.fill(noteData.template);
    }
    
    await this.setWrittenBy(noteData.writtenBy);
    await this.noteContentTextarea.fill(noteData.content);
    await this.dateTimeInput.fill(noteData.dateTime);
  }

  async waitForModalToClose() {
    await this.typeSelect.waitFor({ state: 'detached' });
  }

  // Helper method to create a basic note
  async createBasicNote(noteType: string, content: string, userDisplayName: string): Promise<string> {
    const dateTime = format(new Date(), 'yyyy-MM-dd\'T\'HH:mm');
    await this.waitForModalToLoad();
    await this.selectType(noteType);
    await this.noteContentTextarea.fill(content);
    await expect(this.writtenByInput).toHaveValue(userDisplayName);
    await expect(this.dateTimeInput).toHaveValue(dateTime);
    await this.confirmButton.click();
    await this.waitForModalToClose();
    return dateTime;
  }
}
