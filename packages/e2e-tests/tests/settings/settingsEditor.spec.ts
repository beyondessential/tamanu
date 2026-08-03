import { expect } from '@playwright/test';

import { SettingsPage } from '@pages/facilityAdmin/SettingsPage';
import { test } from '../../fixtures/baseFixture';

const SCOPE_CENTRAL = 'Central (Sync server)';
const SCOPE_FACILITY = 'Facility (Single Facility)';

// covidClearanceCertificate is the only sub-category under Certifications, so no
// sub-category selector appears and its arrays render directly under the category
const LAB_TEST_RESULTS = 'covidClearanceCertificate.labTestResults'; // default ["Positive"]
// covidClearanceCertificate.labTestCategories used to be the empty free-text array here, but
// it has a suggesterEndpoint now and renders the reference-data autocomplete instead

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
  test('[SET-0001] shows the current value, changes it, and resets to default', async ({
    page,
  }) => {
    // integrations.dhis2.idSchemes.idScheme is yup.string().oneOf([...]) defaulting to 'uid'
    const setting = settingsPage.settingLine('dhis2.idSchemes.idScheme');
    const select = setting.getByTestId('selectinput-settings-string-enum-select');

    // (1) current value is still the default, shown verbatim
    await expect(select).toContainText('uid');

    // (2) change between values via the dropdown (options are labelled verbatim)
    await select.click();
    const options = page.getByTestId('selectinput-settings-string-enum-option');
    await expect(options.filter({ hasText: 'name' })).toBeVisible();
    await expect(options.filter({ hasText: 'code' })).toBeVisible();
    await options.filter({ hasText: 'name' }).first().click();
    await expect(select).toContainText('name');

    // (3) reset to default restores 'uid'
    await settingsPage.resetToDefault(setting);
    await expect(select).toContainText('uid');
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
    const setting = settingsPage.settingLine(LAB_TEST_RESULTS);
    const rows = settingsPage.listRows(setting);

    // (1) clear the single default entry to get an empty list to add to
    await setting.getByTestId('listsettinginput-remove-0').click();
    await expect(rows).toHaveCount(0);

    // (2) empty — "No entries" — then add two
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

test.describe('Admin settings editor — saving string settings', () => {
  let settingsPage: SettingsPage;
  let seededName: string;

  // country.name is a plain yup.string() in the global scope, directly under the
  // Country category, so its value survives a save untouched by any structured
  // editor. Scope defaults to global.
  const COUNTRY_NAME = 'name';

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await expect(settingsPage.scopeSelect).toBeVisible();
    await settingsPage.selectCategory('Country');
    seededName = await settingsPage.textInput(settingsPage.settingLine(COUNTRY_NAME)).inputValue();
  });

  // restore rather than reset to default: reset deletes the environment's stored
  // country name instead of putting it back
  test.afterEach(async () => {
    const input = settingsPage.textInput(settingsPage.settingLine(COUNTRY_NAME));
    if ((await input.inputValue()) !== seededName) {
      await input.fill(seededName);
      await settingsPage.save();
    }
  });

  // A string setting whose text happens to parse as JSON must come back as that
  // text. The save path used to run JSON.parse over every value and keep
  // anything that parsed to an object, which turned these into real objects.
  test('[SET-0006] keeps a string setting whose content looks like JSON', async ({ page }) => {
    const setting = settingsPage.settingLine(COUNTRY_NAME);
    await settingsPage.textInput(setting).fill('{"a":1}');
    await settingsPage.save();

    await page.reload();
    await expect(settingsPage.textInput(settingsPage.settingLine(COUNTRY_NAME))).toHaveValue(
      '{"a":1}',
    );
  });

  // "null" parses to null, and typeof null is 'object', so it took the same path.
  test('[SET-0007] keeps the literal string "null"', async ({ page }) => {
    const setting = settingsPage.settingLine(COUNTRY_NAME);
    await settingsPage.textInput(setting).fill('null');
    await settingsPage.save();

    await page.reload();
    await expect(settingsPage.textInput(settingsPage.settingLine(COUNTRY_NAME))).toHaveValue(
      'null',
    );
  });
});
