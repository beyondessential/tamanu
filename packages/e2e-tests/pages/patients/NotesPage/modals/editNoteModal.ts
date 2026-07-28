import { Locator, Page, expect } from '@playwright/test';
import { BaseNoteModal } from './BaseModals/BaseNoteModal';
import { normalizeToIsoDateTimeMinute } from '@utils/testHelper';

export class EditNoteModal extends BaseNoteModal {
  readonly typeField: Locator;

  constructor(page: Page) {
    super(page);
    this.typeField = page.getByTestId('field-a0mv').locator('input').first();
  }

  async waitForModalToLoad() {
    await super.waitForModalToLoad();
    // The dialog mounts before the note it is editing has loaded, and before the note
    // type options are fetched. Type is required and read-only in edit mode, so editing
    // inside that window submits an empty type: the form fails validation silently, the
    // dialog never closes, and it surfaces 30s later as a timeout waiting for the close
    // rather than anywhere near the cause.
    await expect(this.typeField).not.toBeEmpty();
  }

  // Helper method to edit a note
  async editNote(updatedContent: string): Promise<string> {
    await this.waitForModalToLoad();
    await this.noteContentTextarea.fill(updatedContent);
    const secondDateTime = normalizeToIsoDateTimeMinute(await this.dateTimeInput.inputValue());
    await this.confirmButton.click();
    await this.waitForModalToClose();
    return secondDateTime;
  }
}
