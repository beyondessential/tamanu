import { Locator, Page } from '@playwright/test';
import { ChangeDietModal } from './modals/ChangeDietModal';

export class ChangeEncounterDetailsMenu {
  readonly page: Page;

  readonly paper!: Locator;
  readonly menuList!: Locator;
  readonly changeDepartmentMenuItem!: Locator;
  readonly changeClinicianMenuItem!: Locator;
  readonly changeLocationMenuItem!: Locator;
  readonly changeReasonMenuItem!: Locator;
  readonly changeDietMenuItem!: Locator;
  readonly encounterProgressRecordMenuItem!: Locator;

  private _changeDietModal?: ChangeDietModal;

  constructor(page: Page) {
    this.page = page;

    const testIds = {
      paper: 'paper-0i9j',
      menuList: 'menulist-sze7',
      changeDepartmentMenuItem: 'menuitem-0qdd-0',
      changeClinicianMenuItem: 'menuitem-0qdd-1',
      changeLocationMenuItem: 'menuitem-0qdd-2',
      changeReasonMenuItem: 'menuitem-0qdd-3',
      changeDietMenuItem: 'menuitem-0qdd-4',
      encounterProgressRecordMenuItem: 'menuitem-0qdd-5',
    } as const;

    for (const [key, testId] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(testId);
    }
  }

  getChangeDietModal(): ChangeDietModal {
    if (!this._changeDietModal) {
      this._changeDietModal = new ChangeDietModal(this.page);
    }
    return this._changeDietModal;
  }
}

