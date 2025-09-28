import { Page, Locator } from '@playwright/test';
import { BaseChangeLogModal } from './BaseModals/BaseChangeLogModal';

export class ChangeLogModal extends BaseChangeLogModal {
  readonly dateLabel!: Locator;

  constructor(page: Page) {
    super(page);
    
    // TestId mapping for ChangeLogModal elements
    const testIds = {
      dateLabel: 'cardvalue-lcni',
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
    
    // Special cases that need additional processing
    this.dateLabel = page.getByTestId('cardvalue-lcni').getByTestId('tooltip-b4e8');
  }

}

