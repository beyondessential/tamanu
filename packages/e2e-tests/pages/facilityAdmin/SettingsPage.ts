import { Locator, Page } from '@playwright/test';

import { BasePage } from '../BasePage';
import { constructAdminUrl } from '../../utils/navigation';

/**
 * Admin settings editor (`/admin/settings`). Covers the editor tab: scope and
 * category selection, and reaching an individual setting's input by its
 * settings path (e.g. `dhis2.idSchemes.idScheme`).
 *
 * Lives in the admin panel (central-server frontend), so it navigates against
 * the admin origin and the suite runs these specs in the 'admin' Playwright
 * project (admin storageState), not the facility one.
 *
 * The scope/category pickers and the enum setting input are all react-select,
 * driven via the shared `.react-select__*` classes (see EditEncounterModal).
 */
export class SettingsPage extends BasePage {
  readonly scopeSelect: Locator;
  readonly facilitySelect: Locator;
  readonly categorySelect: Locator;
  readonly subCategorySelect: Locator;

  constructor(page: Page) {
    super(page, '/admin/settings');
    this.scopeSelect = page.getByTestId('scopeselectinput-zxel');
    this.facilitySelect = page.getByTestId('scopedynamicselectinput-z7sz');
    this.categorySelect = page.getByTestId('styledselectinput-kvyx');
    this.subCategorySelect = page.getByTestId('styleddynamicselectfield-d62r');
  }

  // override BasePage.goto: the settings editor is on the admin frontend
  async goto(): Promise<void> {
    await this.page.goto(constructAdminUrl('/admin/settings'));
  }

  // open a react-select scoped to `control` and click the option matching text
  private async chooseOption(control: Locator, optionText: string): Promise<void> {
    await control.locator('.react-select__control').click();
    await this.page
      .locator('.react-select__option')
      .filter({ hasText: optionText })
      .first()
      .click();
  }

  async selectScope(label: string): Promise<void> {
    await this.chooseOption(this.scopeSelect, label);
  }

  // facility scope needs a facility chosen before the editor appears; the test
  // environment's facility name isn't fixed, so just take the first option
  async selectFirstFacility(): Promise<void> {
    await this.facilitySelect.locator('.react-select__control').click();
    await this.page.locator('.react-select__option').first().click();
  }

  async selectCategory(label: string): Promise<void> {
    await this.chooseOption(this.categorySelect, label);
  }

  async selectSubCategory(label: string): Promise<void> {
    await this.chooseOption(this.subCategorySelect, label);
  }

  // the unique per-setting wrapper; settings path dots become dashes
  settingLine(settingPath: string): Locator {
    return this.page.getByTestId(`settingline-55rw-${settingPath.replace(/\./g, '-')}`);
  }

  // list-editor helpers, scoped to a setting line
  listRows(setting: Locator): Locator {
    return setting.getByTestId(/^listsettinginput-row-/);
  }

  listItemInput(setting: Locator, index: number): Locator {
    return setting.getByTestId(`listsettinginput-input-${index}`).locator('input');
  }

  async resetToDefault(setting: Locator): Promise<void> {
    await setting.getByTestId('defaultsettingbutton-4vbq').click();
  }
}
