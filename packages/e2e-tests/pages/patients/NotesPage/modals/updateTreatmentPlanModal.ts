import { Page, Locator } from '@playwright/test';
import { BaseNoteModal } from './BaseModals/BaseNoteModal';
import { format } from 'date-fns';
import * as fieldHelpers from '@utils/fieldHelpers';

export class UpdateTreatmentPlanModal extends BaseNoteModal {
  // Additional fields specific to update treatment plan
  readonly updatedByInput!: Locator;
  readonly updatedByDropdownList!: Locator;

  constructor(page: Page) {
    super(page);
    
    // TestId mapping for UpdateTreatmentPlanModal elements
    const testIds = {
      updatedByInput: 'field-ar9q-input',
      updatedByDropdownList: 'field-ar9q-suggestionslist',
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
  }


  /**
   * Updates the treatment plan note
   * @param updatedBy - The updated by value
   * @param updatedContent - The updated content
   * @returns The updated date time
   */
  async updateTreatmentPlan(updatedBy: string, updatedContent: string): Promise<string> {
    await this.waitForModalToLoad();
    await fieldHelpers.selectAutocompleteFieldOption(this.page, this.updatedByInput, {
      optionToSelect: updatedBy,
    });
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 1);
    const updatedDateTime = format(futureDate, 'yyyy-MM-dd\'T\'HH:mm');
    await this.dateTimeInput.fill(format(futureDate, 'dd/MM/yyyy hh:mm aa'));
    await this.dateTimeInput.press('Tab');
    await this.noteContentTextarea.fill(updatedContent);
    await this.confirmButton.click();
    await this.waitForModalToClose();
    return updatedDateTime;
  }
}

