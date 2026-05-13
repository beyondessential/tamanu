import { test, expect } from '../../fixtures/baseFixture';

import { selectFieldOption } from '@utils/fieldHelpers';
import { constructAdminUrl } from '@utils/navigation';

// Admin panel auth is included in the shared storageState via adminAuth.setup.ts.
test.beforeEach(async ({ page }) => {
  await page.goto(constructAdminUrl('/admin/reports'));
});

test.setTimeout(90000);

test.describe('Admin panel report editor', () => {
  test('Create a report with a parameter and advanced config', async ({ page }) => {
    await page.getByTestId('tab-create').click();

    // Required fields
    await page.getByTestId('styledfield-pb9c-input').fill('Test DHIS2 Report');

    // SQL query editor (Ace) — select-all then type
    // react-ace only passes id/style to the DOM div (not data-testid), so use the id from name="sqlEditor"
    const sqlTextarea = page.locator('#sqlEditor .ace_text-input');
    await sqlTextarea.focus({ force: true });
    await page.keyboard.press('Control+a');
    await page.keyboard.type('SELECT 1');

    // Add one parameter
    await page.getByTestId('textbutton-4yah').click();
    await page.getByTestId('field-4eel-input').fill('facilityId');
    await page.getByTestId('field-vuew-input').fill('Facility');
    await selectFieldOption(page, page.getByTestId('field-jfys-select'), {
      optionToSelect: 'FacilityField',
    });

    // Expand Advanced Config and enter a value
    const advancedConfigSummary = page.getByTestId('accordionsummary-advanced-config');
    await advancedConfigSummary.scrollIntoViewIfNeeded();
    await advancedConfigSummary.click();
    const jsonTextarea = page
      .getByTestId('accordiondetails-advanced-config')
      .locator('.ace_text-input');
    await jsonTextarea.focus({ force: true });
    await page.keyboard.press('Control+a');
    await page.keyboard.type('{"dhis2DataSet": "some-dataset-id"}');

    // Submit
    await page.getByTestId('button-dbqt').click();

    // After creation the app navigates to the edit view for the new version
    await expect(page).toHaveURL(/\/admin\/reports\/.+\/versions\/.+\/edit/, { timeout: 15000 });
  });
});
