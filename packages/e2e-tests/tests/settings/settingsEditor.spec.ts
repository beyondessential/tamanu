import { expect } from '@playwright/test';

import { SettingsPage } from '@pages/facilityAdmin/SettingsPage';
import { test } from '../../fixtures/baseFixture';

// Both target settings live in the Central scope and sit under a category with
// no sub-category selector, so the editor reaches them with a scope + category
// pick alone.
const CENTRAL_SCOPE = 'Central (Sync server)';

test.describe('Admin settings editor inputs', () => {
  let settingsPage: SettingsPage;

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await expect(settingsPage.scopeSelect).toBeVisible();
  });

  test('[SET-0001] renders a oneOf string setting as a dropdown of its allowed values', async ({
    page,
  }) => {
    await settingsPage.selectScope(CENTRAL_SCOPE);
    await settingsPage.selectCategory('Integrations');

    // integrations.dhis2.idSchemes.idScheme is yup.string().oneOf(['uid', 'name', 'code', ...])
    const setting = settingsPage.settingLine('dhis2.idSchemes.idScheme');
    const select = setting.getByTestId('selectinput-settings-string-enum');
    await expect(select).toBeVisible();

    // open the dropdown and confirm the allowed values are offered verbatim
    // (labelled with the raw stored token, not a prettified form)
    await setting.locator('.react-select__control').click();
    const options = page.locator('.react-select__option');
    await expect(options.filter({ hasText: 'uid' })).toBeVisible();
    await expect(options.filter({ hasText: 'name' })).toBeVisible();
    await expect(options.filter({ hasText: 'code' })).toBeVisible();

    // selecting one reflects in the control
    await options.filter({ hasText: 'name' }).first().click();
    await expect(setting.locator('.react-select__single-value')).toHaveText('name');
  });

  test('[SET-0002] renders a primitive array setting as an editable list with add/remove', async () => {
    await settingsPage.selectScope(CENTRAL_SCOPE);
    await settingsPage.selectCategory('Report process');

    // reportProcess.processOptions is yup.array(yup.string())
    const setting = settingsPage.settingLine('processOptions');
    const list = setting.getByTestId('listsettinginput');
    await expect(list).toBeVisible();

    const rows = setting.getByTestId(/^listsettinginput-row-/);
    const startCount = await rows.count();

    // add a row and type into it
    await setting.getByTestId('listsettinginput-add').click();
    await expect(rows).toHaveCount(startCount + 1);
    const newInput = setting.getByTestId(`listsettinginput-input-${startCount}`).locator('input');
    await newInput.fill('custom-report-option');
    await expect(newInput).toHaveValue('custom-report-option');

    // remove it again
    await setting.getByTestId(`listsettinginput-remove-${startCount}`).click();
    await expect(rows).toHaveCount(startCount);
  });
});
