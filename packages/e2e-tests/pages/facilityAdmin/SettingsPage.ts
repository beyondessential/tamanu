import { Locator, Page } from '@playwright/test';

import { BasePage } from '../BasePage';
import { constructAdminUrl } from '../../utils/navigation';

// SelectField (the scope/category/sub-category/enum controls) wraps react-select
// and exposes its own testids: `<id>-select` on the container and `<id>-option`
// on each option. There is no react-select__* class prefix, so we drive these
// selects purely through those testids.
const SCOPE = 'scopeselectinput-zxel';
const FACILITY = 'scopedynamicselectinput-z7sz';
const CATEGORY = 'styledselectinput-kvyx';
const SUBCATEGORY = 'styleddynamicselectfield-d62r';

/**
 * Admin settings editor (`/admin/settings`). Covers the editor tab: scope and
 * category selection, and reaching an individual setting's input by its
 * settings path (e.g. `dhis2.idSchemes.idScheme`).
 *
 * Lives in the admin panel (central-server frontend), so it navigates against
 * the admin origin. The shared auth setup logs into both frontends, so the
 * session is already authenticated there — no dedicated project needed.
 */
export class SettingsPage extends BasePage {
  readonly scopeSelect: Locator;

  constructor(page: Page) {
    super(page, '/admin/settings');
    this.scopeSelect = page.getByTestId(`${SCOPE}-select`);
  }

  // override BasePage.goto: the settings editor is on the admin frontend
  async goto(): Promise<void> {
    await this.page.goto(constructAdminUrl('/admin/settings'));
  }

  // open a SelectField (by its base testid) and click the option matching text
  private async chooseOption(baseTestId: string, optionText: string): Promise<void> {
    await this.page.getByTestId(`${baseTestId}-select`).click();
    await this.page
      .getByTestId(`${baseTestId}-option`)
      .filter({ hasText: optionText })
      .first()
      .click();
  }

  async selectScope(label: string): Promise<void> {
    await this.chooseOption(SCOPE, label);
  }

  // facility scope needs a facility chosen before the editor appears. The
  // facility picker is a DynamicSelectField; with more than a handful of
  // facilities (as in the e2e DB) it renders as an autocomplete, so focus its
  // input and take the first suggestion.
  async selectFirstFacility(): Promise<void> {
    await this.page.getByTestId(`${FACILITY}-input`).click();
    await this.page.getByTestId(`${FACILITY}-option`).first().click();
  }

  async selectCategory(label: string): Promise<void> {
    await this.chooseOption(CATEGORY, label);
  }

  async selectSubCategory(label: string): Promise<void> {
    await this.chooseOption(SUBCATEGORY, label);
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
