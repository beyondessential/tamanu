import { Page, Locator } from '@playwright/test';
import { BaseChangeLogModal } from './BaseModals/BaseChangeLogModal';

export class ChangeLogModal extends BaseChangeLogModal {
  readonly dateLabel!: Locator;

  constructor(page: Page) {
    super(page);

    // Date & time in header is `DateDisplay` in `NoteInfoSection` (`datedisplay-cfwj`), not `tooltip-b4e8`.
    this.dateLabel = page.getByRole('dialog').getByTestId('datedisplay-cfwj');
  }

}

