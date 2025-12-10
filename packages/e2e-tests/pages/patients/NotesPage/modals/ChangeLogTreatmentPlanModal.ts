import { Page, Locator } from '@playwright/test';
import { BaseChangeLogModal } from './BaseModals/BaseChangeLogModal';

export class ChangeLogTreatmentPlanModal extends BaseChangeLogModal {
  // Treatment plan specific elements
  readonly lastUpdatedByValue!: Locator;
  readonly lastUpdatedAtValue!: Locator;

  constructor(page: Page) {
    super(page);
    
    // TestId mapping for ChangeLogTreatmentPlanModal elements
    const testIds = {
      lastUpdatedByValue: 'cardlabel-6kys',
      lastUpdatedAtValue: 'cardlabel-6kys',
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
    
    // Special cases that need additional processing
    this.lastUpdatedByValue = page.getByTestId('cardlabel-6kys').filter({ hasText: 'Last updated by (or on behalf of)' }).locator('..').getByTestId('cardvalue-lcni');
    this.lastUpdatedAtValue = page.getByTestId('cardlabel-6kys').filter({ hasText: 'Last updated at date & time' }).locator('..').getByTestId('cardvalue-lcni');
  }


}
