import { Page, Locator } from '@playwright/test';
import { BaseNoteModal } from './BaseModals/BaseNoteModal';
import { format } from 'date-fns';
import * as fieldHelpers from '@utils/fieldHelpers';
import { assignTestIdLocators } from '@utils/locatorFactory';
import { fillMuiDateTimeField } from '@utils/testHelper';

export class UpdateTreatmentPlanModal extends BaseNoteModal {
  // Additional fields specific to update treatment plan
  readonly updatedByInput!: Locator;
  readonly updatedByDropdownList!: Locator;

  constructor(page: Page) {
    super(page);

    assignTestIdLocators(this, page, {
      updatedByInput: 'field-ar9q-input',
      updatedByDropdownList: 'field-ar9q-suggestionslist',
    });
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
    const updatedDateTime = format(new Date(), 'yyyy-MM-dd\'T\'HH:mm');
    await fillMuiDateTimeField(this.dateTimeInput, updatedDateTime);
    await this.noteContentTextarea.fill(updatedContent);
    await this.confirmButton.click();
    await this.waitForModalToClose();
    return updatedDateTime;
  }
}

