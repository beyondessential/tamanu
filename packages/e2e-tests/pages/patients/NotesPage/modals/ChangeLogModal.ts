import { Page, Locator } from '@playwright/test';
import { BaseChangeLogModal } from './BaseModals/BaseChangeLogModal';

export class ChangeLogModal extends BaseChangeLogModal {
  readonly dateLabel!: Locator;

  constructor(page: Page) {
    super(page);

    // infocarditem-0my5 is overridden by cardcell-8efu in InfoCardItem — use datedisplay-cfwj inside the NoteInfoSection
    this.dateLabel = page.getByTestId('styledinfocard-t83a').getByTestId('datedisplay-cfwj');
  }

}

