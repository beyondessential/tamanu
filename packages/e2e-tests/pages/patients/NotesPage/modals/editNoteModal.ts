import { Page } from '@playwright/test';
import { BaseNoteModal } from './BaseModals/BaseNoteModal';

export class EditNoteModal extends BaseNoteModal {
  constructor(page: Page) {
    super(page);
  }

  // Helper method to edit a note
  async editNote(updatedContent: string): Promise<string> {
    await this.waitForModalToLoad();
    await this.noteContentTextarea.fill(updatedContent);
    const secondDateTime = await this.dateTimeInput.inputValue();
    await this.confirmButton.click();
    await this.waitForModalToClose();
    return secondDateTime;
  }
}
