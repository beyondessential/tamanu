import { Page, Locator } from '@playwright/test';
import { assignTestIdLocators } from '@utils/locatorFactory';
import { BaseChangeLogModal } from './BaseModals/BaseChangeLogModal';

export class ChangeLogTreatmentPlanModal extends BaseChangeLogModal {
  // Treatment plan specific elements
  readonly lastUpdatedByValue!: Locator;
  readonly lastUpdatedAtValue!: Locator;

  constructor(page: Page) {
    super(page);
    
    assignTestIdLocators(this, page, {
      lastUpdatedByValue: 'cardlabel-6kys',
      lastUpdatedAtValue: 'cardlabel-6kys',
    });

    this.lastUpdatedByValue = page.getByTestId('cardlabel-6kys').filter({ hasText: 'Last updated by (or on behalf of)' }).locator('..').getByTestId('cardvalue-lcni');
    this.lastUpdatedAtValue = page.getByTestId('cardlabel-6kys').filter({ hasText: 'Last updated at date & time' }).locator('..').getByTestId('cardvalue-lcni');
  }


}
