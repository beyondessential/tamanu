import { Page, Locator } from '@playwright/test';
import { DiscardNoteModal } from './discardNoteModal';
import { BaseNoteModal } from './BaseModals/BaseNoteModal';
import { format } from 'date-fns';

export class NewNoteModal extends BaseNoteModal {
  readonly discardNoteModal: DiscardNoteModal;
  
  // New note specific fields
  readonly typeSelect!: Locator;
  readonly noteTypeRequiredIndicator!: Locator;
  readonly noteContentRequiredIndicator!: Locator;

  constructor(page: Page) {
    super(page);
    this.discardNoteModal = new DiscardNoteModal(page);
    
    // TestId mapping for NewNoteModal elements
    const testIds = {
      typeSelect: 'field-a0mv-select',
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
    
    // Special cases that need additional processing
    this.noteTypeRequiredIndicator = page.getByTestId('field-a0mv-formhelptertext').getByText('*Required');
    this.noteContentRequiredIndicator = page.getByTestId('field-wxzr').locator('p').getByText('*Required');
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


  // Helper methods to get form values for validation
  async getWrittenByValue(): Promise<string> {
    return await this.writtenByInput.inputValue();
  }

  async getDateTimeValue(): Promise<string> {
    return await this.dateTimeInput.inputValue();
  }

  // Helper method to create a basic note
  async createBasicNote(noteType: string, content: string): Promise<string> {
    const dateTime = format(new Date(), 'yyyy-MM-dd\'T\'HH:mm');
    await this.waitForModalToLoad();
    await this.selectType(noteType);
    await this.noteContentTextarea.fill(content);
    await this.confirmButton.click();
    await this.waitForModalToClose();
    return dateTime;
  }
}
