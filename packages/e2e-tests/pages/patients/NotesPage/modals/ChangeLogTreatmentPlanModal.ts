import { Page, Locator, expect } from '@playwright/test';
import { format } from 'date-fns';
import { BaseChangeLogModal } from './BaseModals/BaseChangeLogModal';

export class ChangeLogTreatmentPlanModal extends BaseChangeLogModal {
  // Treatment plan specific elements
  readonly lastUpdatedByValue: Locator;
  readonly lastUpdatedAtValue: Locator;

  constructor(page: Page) {
    super(page);
    
    // Treatment plan specific elements
    this.lastUpdatedByValue = page.getByTestId('cardlabel-6kys').filter({ hasText: 'Last updated by (or on behalf of)' }).locator('..').getByTestId('cardvalue-lcni');
    this.lastUpdatedAtValue = page.getByTestId('cardlabel-6kys').filter({ hasText: 'Last updated at date & time' }).locator('..').getByTestId('cardvalue-lcni');
  }


  /**
   * Validates the treatment plan change log modal content
   * @param noteType - The expected note type
   * @param lastUpdatedBy - The "on behalf of" string
   * @param lastUpdatedAt - The last updated date time
   * @param updatedContent - The updated content
   * @param originalContent - The original content
   * @param firstDateTime - The first date time
   * @param secondDateTime - The second date time
   */
  async validateTreatmentPlanChangeLog(
    noteType: string,
    lastUpdatedBy: string,
    lastUpdatedAt: string,
    updatedContent: string,
    originalContent: string,
    firstDateTime: string,
    secondDateTime: string,
    userDisplayName: string
  ): Promise<void> {
    await this.waitForModalToLoad();
    
    // Validate note type
    await expect(this.noteTypeLabel).toHaveText(noteType);
    
    // Validate last updated by information
    await expect(this.lastUpdatedByValue).toHaveText(lastUpdatedBy);
    
    // Validate last updated at information
    const formattedLastUpdatedAt = format(new Date(lastUpdatedAt), 'MM/dd/yyyy h:mm a');
    await expect(this.lastUpdatedAtValue).toHaveText(formattedLastUpdatedAt);
   
    // Validate content entries
    await expect(this.changelogTextContents.first()).toContainText(updatedContent);
    await expect(this.changelogTextContents.nth(1)).toContainText(originalContent);
    
    // Format dates for validation
    const firstNoteFormattedDateTime = format(new Date(firstDateTime), 'MM/dd/yyyy h:mm a');
    const secondNoteFormattedDateTime = format(new Date(secondDateTime), 'MM/dd/yyyy h:mm a');
    
    // Validate change log user and date information
    await expect(this.changeLogInfoWrappers.first()).toContainText(lastUpdatedBy);
    await expect(this.changeLogInfoWrappers.nth(1)).toContainText(userDisplayName);
    await expect(this.changelogInfoDates.first()).toHaveText(secondNoteFormattedDateTime);
    await expect(this.changelogInfoDates.nth(1)).toHaveText(firstNoteFormattedDateTime);
    
    // Close the modal
    await this.closeButton.click();
  }
}
