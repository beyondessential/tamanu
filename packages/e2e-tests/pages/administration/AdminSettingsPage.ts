import { expect, type Locator, type Page } from '@playwright/test';

import { BasePage } from '../BasePage';
import { constructFacilityUrl } from '../../utils/navigation';

export class AdminSettingsPage extends BasePage {
  constructor(page: Page) {
    super(page, '/admin/settings');
  }

  async goto() {
    await this.page.goto(constructFacilityUrl(this.url!));
    await expect(this.page.getByTestId('adminviewcontainer-htwi')).toBeVisible();
  }

  async selectCentralScope() {
    const scope = this.page.getByTestId('scopeselectinput-zxel');
    await scope.click();
    await this.page.getByRole('option', { name: /Central \(Sync server\)/ }).click();
  }

  async selectCategoryMatching(label: RegExp) {
    const categorySelect = this.page.getByTestId('styledselectinput-kvyx');
    await categorySelect.click();
    await this.page.getByRole('option', { name: label }).click();
  }

  settingLine(testIdSuffix: string): Locator {
    return this.page.getByTestId(`settingline-55rw-${testIdSuffix}`);
  }

  async openMarkdownEditorForSetting(testIdSuffix: string) {
    const line = this.settingLine(testIdSuffix);
    await line.getByTestId('editbutton-markdowneditor').click();
    await expect(this.page.getByTestId('markdowneditormodal-modal')).toBeVisible();
  }

  modalAceInput(): Locator {
    return this.page.locator('[data-testid="markdowneditormodal-textarea"] .ace_text-input');
  }

  async confirmMarkdownModal() {
    const footer = this.page.getByTestId('markdowneditormodal-footer');
    await footer.getByRole('button', { name: /^Confirm$/ }).click();
    await expect(this.page.getByTestId('markdowneditormodal-modal')).toBeHidden();
  }

  async discardMarkdownModal() {
    const footer = this.page.getByTestId('markdowneditormodal-footer');
    await footer.getByRole('button', { name: /^Discard$/ }).click();
    await expect(this.page.getByTestId('markdowneditormodal-modal')).toBeHidden();
  }

  async saveSettingsForm() {
    await this.page.getByTestId('button-s1z4').click();
  }
}
