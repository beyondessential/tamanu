import { Page, Locator } from '@playwright/test';
import { BaseNoteUpdateModal } from './BaseModals/BaseNoteUpdateModal';
import { format } from 'date-fns';

export class UpdateTreatmentPlanModal extends BaseNoteUpdateModal {
  // Additional fields specific to update treatment plan
  readonly updatedByInput: Locator;
  readonly updatedByClearButton: Locator;
  readonly updatedByDropdownList: Locator;

  constructor(page: Page) {
    super(page);
    
    // Additional fields specific to update treatment plan
    this.updatedByInput = page.getByTestId('field-ar9q-input');
    this.updatedByClearButton = page.getByTestId('field-ar9q-input-clearbutton');
    this.updatedByDropdownList = page.getByTestId('field-ar9q-suggestionslist');
  }

  // Form field interaction methods specific to update treatment plan
  async setUpdatedBy(updatedBy: string) {
    await this.updatedByInput.click();
    await this.updatedByDropdownList.getByText(updatedBy).click();
  }

  /**
   * Updates the treatment plan note
   * @param updatedBy - The updated by value
   * @param updatedContent - The updated content
   * @returns The updated date time
   */
  async updateTreatmentPlan(updatedBy: string, updatedContent: string): Promise<string> {
    await this.waitForModalToLoad();
    await this.setUpdatedBy(updatedBy);
    const updatedDateTime = format(new Date(), 'yyyy-MM-dd\'T\'HH:mm');
    await this.dateTimeInput.fill(updatedDateTime);
    await this.noteContentTextarea.fill(updatedContent);
    await this.confirmButton.click();
    await this.waitForModalToClose();
    return updatedDateTime;
  }
}

