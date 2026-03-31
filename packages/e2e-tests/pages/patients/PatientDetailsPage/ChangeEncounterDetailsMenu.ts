import { Locator, Page } from '@playwright/test';
import { assignTestIdLocators } from '@utils/locatorFactory';
import { ChangeDietModal } from './modals/ChangeDietModal';
import { ChangeLocationModal } from './modals/ChangeLocationModal';

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
  private _changeLocationModal?: ChangeLocationModal;

  constructor(page: Page) {
    this.page = page;

    assignTestIdLocators(this, page, {
      paper: 'paper-0i9j',
      menuList: 'menulist-sze7',
      changeDepartmentMenuItem: 'menuitem-0qdd-0',
      changeClinicianMenuItem: 'menuitem-0qdd-1',
      changeLocationMenuItem: 'menuitem-0qdd-2',
      changeReasonMenuItem: 'menuitem-0qdd-3',
      changeDietMenuItem: 'menuitem-0qdd-4',
      encounterProgressRecordMenuItem: 'menuitem-0qdd-5',
    });
  }

  getChangeDietModal(): ChangeDietModal {
    if (!this._changeDietModal) {
      this._changeDietModal = new ChangeDietModal(this.page);
    }
    return this._changeDietModal;
  }

  getChangeLocationModal(): ChangeLocationModal {
    if (!this._changeLocationModal) {
      this._changeLocationModal = new ChangeLocationModal(this.page);
    }
    return this._changeLocationModal;
  }
}

