import { Page, Locator } from '@playwright/test';
import { BaseChangeLogModal } from './BaseModals/BaseChangeLogModal';

export class ChangeLogModal extends BaseChangeLogModal {
  readonly dateLabel: Locator;

  constructor(page: Page) {
    super(page);
    
    // Additional elements specific to regular change log
    this.dateLabel = page.getByTestId('cardvalue-lcni').getByTestId('tooltip-b4e8');
  }

}

