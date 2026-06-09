import { expect } from '@playwright/test';

import { SettingsPage } from '@pages/facilityAdmin/SettingsPage';
import { test } from '../../fixtures/baseFixture';

const SCOPE_CENTRAL = 'Central (Sync server)';
const SCOPE_FACILITY = 'Facility (Single Facility)';

// covidClearanceCertificate is the only sub-category under Certifications, so no
// sub-category selector appears and its arrays render directly under the category
const LAB_TEST_RESULTS = 'covidClearanceCertificate.labTestResults'; // default ["Positive"]
const LAB_TEST_CATEGORIES = 'covidClearanceCertificate.labTestCategories'; // default []

test.describe('Admin settings editor — select inputs', () => {
  let settingsPage: SettingsPage;

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await expect(settingsPage.scopeSelect).toBeVisible();
    await settingsPage.selectScope(SCOPE_CENTRAL);
    await settingsPage.selectCategory('Integrations');
  });

  // Selects 1–3: default value shown, changing via the dropdown, reset to default.
  test('[SET-0001] shows the current value, changes it, and resets to default', async ({ page }) => {
    // integrations.dhis2.idSchemes.idScheme is yup.string().oneOf([...]) defaulting to 'uid'
    const setting = settingsPage.settingLine('dhis2.idSchemes.idScheme');
    const currentValue = setting.locator('.react-select__single-value');

    // (1) current value is still the default, shown verbatim
    await expect(currentValue).toHaveText('uid');

    // (2) change between values via the dropdown
    await setting.locator('.react-select__control').click();
    const options = page.locator('.react-select__option');
    await expect(options.filter({ hasText: 'name' })).toBeVisible();
    await expect(options.filter({ hasText: 'code' })).toBeVisible();
    await options.filter({ hasText: 'name' }).first().click();
    await expect(currentValue).toHaveText('name');

    // (3) reset to default restores 'uid'
    await settingsPage.resetToDefault(setting);
    await expect(currentValue).toHaveText('uid');
  });
});

test.describe('Admin settings editor — array (list) inputs', () => {
  let settingsPage: SettingsPage;

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await expect(settingsPage.scopeSelect).toBeVisible();
  });

  async function openCertifications() {
    await settingsPage.selectScope(SCOPE_FACILITY);
    await settingsPage.selectFirstFacility();
    await settingsPage.selectCategory('Certifications');
  }

  // Arrays 1 + 6: change an existing entry's value, then reset to default.
  test('[SET-0002] changes an array entry and resets it to default', async () => {
    await openCertifications();
    const setting = settingsPage.settingLine(LAB_TEST_RESULTS);
    const firstInput = settingsPage.listItemInput(setting, 0);

    // default is a single "Positive" entry
    await expect(firstInput).toHaveValue('Positive');

    // (1) change the entry's value
    await firstInput.fill('Negative');
    await expect(firstInput).toHaveValue('Negative');

    // (6) reset to default brings "Positive" back
    await settingsPage.resetToDefault(setting);
    await expect(settingsPage.listItemInput(setting, 0)).toHaveValue('Positive');
  });

  // Arrays 2 + 3: add entries to an empty array, then remove one (leaving others).
  test('[SET-0003] adds entries to an empty array and removes one', async () => {
    await openCertifications();
    const setting = settingsPage.settingLine(LAB_TEST_CATEGORIES);
    const rows = settingsPage.listRows(setting);

    // (2) starts empty — "No entries" — then add two
    await expect(setting.getByTestId('listsettinginput-empty')).toBeVisible();
    await setting.getByTestId('listsettinginput-add').click();
    await setting.getByTestId('listsettinginput-add').click();
    await expect(rows).toHaveCount(2);
    await settingsPage.listItemInput(setting, 0).fill('FBC');
    await settingsPage.listItemInput(setting, 1).fill('LFT');

    // (3) remove one entry — the other remains
    await setting.getByTestId('listsettinginput-remove-0').click();
    await expect(rows).toHaveCount(1);
    await expect(settingsPage.listItemInput(setting, 0)).toHaveValue('LFT');
  });

  // Array 4: remove entries all the way down to empty.
  test('[SET-0004] removes the last entry back to an empty list', async () => {
    await openCertifications();
    const setting = settingsPage.settingLine(LAB_TEST_RESULTS);
    const rows = settingsPage.listRows(setting);

    await expect(rows).toHaveCount(1);
    await setting.getByTestId('listsettinginput-remove-0').click();
    await expect(rows).toHaveCount(0);
    await expect(setting.getByTestId('listsettinginput-empty')).toBeVisible();
  });

  // Array 5: a fixed-length array offers no add/remove affordances.
  test('[SET-0005] hides add/remove for a fixed-length array', async () => {
    // global scope is the default; medications.defaultAdministrationTimes.Daily
    // is yup.array(yup.string()).length(1)
    await settingsPage.selectCategory('Medications');
    await settingsPage.selectSubCategory('Default administration times');

    const setting = settingsPage.settingLine('Daily');
    await expect(setting.getByTestId('listsettinginput')).toBeVisible();
    await expect(settingsPage.listRows(setting)).toHaveCount(1);

    await expect(setting.getByTestId('listsettinginput-bounds')).toContainText('exactly 1');
    await expect(setting.getByTestId('listsettinginput-add')).toBeHidden();
    await expect(setting.getByTestId('listsettinginput-remove-0')).toBeHidden();
  });
});
