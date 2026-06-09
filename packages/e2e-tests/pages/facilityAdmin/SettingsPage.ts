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
  readonly categorySelect: Locator;

  constructor(page: Page) {
    super(page, '/admin/settings');
    this.scopeSelect = page.getByTestId('scopeselectinput-zxel');
    this.categorySelect = page.getByTestId('styledselectinput-kvyx');
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

  async selectCategory(label: string): Promise<void> {
    await this.chooseOption(this.categorySelect, label);
  }

  // the unique per-setting wrapper; settings path dots become dashes
  settingLine(settingPath: string): Locator {
    return this.page.getByTestId(`settingline-55rw-${settingPath.replace(/\./g, '-')}`);
  }
}
