import { Page } from '@playwright/test';
import { format, parse } from 'date-fns';
import { BaseNoteModal } from './BaseModals/BaseNoteModal';

export class EditNoteModal extends BaseNoteModal {
  constructor(page: Page) {
    super(page);
  }

  // Helper method to edit a note
  async editNote(updatedContent: string): Promise<string> {
    await this.waitForModalToLoad();
    await this.noteContentTextarea.fill(updatedContent);
    const rawDateTime = await this.dateTimeInput.inputValue();
    const parsedDate = parse(rawDateTime, 'dd/MM/yyyy hh:mm aa', new Date());
    const secondDateTime = format(parsedDate, "yyyy-MM-dd'T'HH:mm");
    await this.confirmButton.click();
    await this.waitForModalToClose();
    return secondDateTime;
  }
}
