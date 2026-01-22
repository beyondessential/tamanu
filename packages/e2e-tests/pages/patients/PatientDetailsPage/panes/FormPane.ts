import { Locator, Page } from '@playwright/test';
import { BasePatientPane } from './BasePatientPane';
import { DeleteProgramResponseModal } from '../modals/DeleteProgramResponseModal';

export class FormPane extends BasePatientPane {
  readonly newFormButton!: Locator;
  readonly formsList!: Locator;
  readonly tableRows!: Locator;
  readonly deleteButton!: Locator;
  private _deleteProgramResponseModal?: DeleteProgramResponseModal;

  constructor(page: Page) {
    super(page);
    this.newFormButton = this.page.getByTestId('button-i54d');
    // Forms list table body
    this.formsList = this.page.getByTestId('styledtablebody-a0jz');
    this.tableRows = this.formsList.locator('tr');
    // Delete button in the menu (after menu is opened) - find by text content
    this.deleteButton = this.page.getByTestId('item-8ybn-1');
  }

  getActionMenuButton(rowIndex: number = 0): Locator {
    return this.tableRows.nth(rowIndex).getByTestId('openbutton-d1ec');
  }

  async waitForPageToLoad(): Promise<void> {
    await this.newFormButton.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle'); 
  }

  getDeleteProgramResponseModal(): DeleteProgramResponseModal {
    if (!this._deleteProgramResponseModal) {
      this._deleteProgramResponseModal = new DeleteProgramResponseModal(this.page);
    }
    return this._deleteProgramResponseModal;
  }
}
