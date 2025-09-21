import { Page, Locator, expect } from '@playwright/test';
import { format } from 'date-fns';
import { BaseChangeLogModal } from './BaseModals/BaseChangeLogModal';

export class ChangeLogModal extends BaseChangeLogModal {
  readonly WrittenByLabel: Locator;
  readonly dateLabel: Locator;

  constructor(page: Page) {
    super(page);
    
    // Additional elements specific to regular change log
    this.WrittenByLabel = page.getByTestId('translatedtext-89o7');
    this.dateLabel = page.getByTestId('cardvalue-lcni').getByTestId('tooltip-b4e8');
  }

  /**
   * Validates the change log modal content
   * @param noteType - The expected note type
   * @param updatedContent - The updated content
   * @param originalContent - The original content
   * @param firstDateTime - The first date time
   * @param secondDateTime - The second date time
   * @param userDisplayName - The user display name
   */
  async validateChangeLog(
    noteType: string,
    updatedContent: string,
    originalContent: string,
    firstDateTime: string,
    secondDateTime: string,
    userDisplayName: string
  ): Promise<void> {
    await this.waitForModalToLoad();
    
    // Validate note type
    await expect(this.noteTypeLabel).toHaveText(noteType);
    
    // Validate content entries
    await expect(this.changelogTextContents.first()).toContainText(updatedContent);
    await expect(this.changelogTextContents.nth(1)).toContainText(originalContent);
    
    // Format dates for validation
    const firstNoteFormattedDateTime = format(new Date(firstDateTime), 'MM/dd/yyyy h:mm a');
    const secondNoteFormattedDateTime = format(new Date(secondDateTime), 'MM/dd/yyyy h:mm a');
    
    // Validate date and user information
    await expect(this.dateLabel).toHaveText(firstNoteFormattedDateTime);
    await expect(this.changeLogInfoWrappers.first()).toContainText(userDisplayName);
    await expect(this.changelogInfoDates.first()).toHaveText(firstNoteFormattedDateTime);
    await expect(this.changelogInfoDates.nth(1)).toHaveText(secondNoteFormattedDateTime);
    
    // Close the modal
    await this.closeButton.click();
  }
}

