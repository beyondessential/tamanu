import { test, expect } from '../../fixtures/baseFixture';

import { selectFieldOption } from '@utils/fieldHelpers';
import { constructAdminUrl } from '@utils/navigation';

// Admin panel auth is included in the shared storageState via auth.setup.ts.
test.beforeEach(async ({ page }) => {
  await page.goto(constructAdminUrl('/admin/reports'));
});

test.setTimeout(90000);

test.describe('Admin panel report editor', () => {
  test('Create a report with a parameter and advanced config', async ({ page }) => {
    await page.getByTestId('tab-create').click();

    // Required fields. Unique name so retries/reruns don't hit 422 "name already
    // exists" from the report a previous attempt created.
    const reportName = `Test DHIS2 Report ${Date.now()}`;
    await page.getByTestId('styledfield-pb9c-input').fill(reportName);

    // SQL query editor (Ace). react-ace only passes id/style to the DOM div (not
    // data-testid), so target the hidden textarea via the id from name="sqlEditor".
    // insertText, not type: per-keystroke input double-registers the first character
    // in headless CI (produced "SSELECT 1"), and triggers Ace's bracket auto-closing.
    const sqlTextarea = page.locator('#sqlEditor .ace_text-input');
    await sqlTextarea.focus({ force: true });
    await page.keyboard.press('Control+a');
    await page.keyboard.insertText('SELECT 1');

    // Add one parameter
    await page.getByTestId('textbutton-4yah').click();
    await page.getByTestId('field-4eel-input').fill('facilityId');
    await page.getByTestId('field-vuew-input').fill('Facility');
    await selectFieldOption(page, page.getByTestId('field-jfys-select'), {
      optionToSelect: 'FacilityField',
    });

    // Expand Advanced Config and enter a value (click auto-scrolls and retries on detach)
    const advancedConfigSummary = page.getByTestId('accordionsummary-advanced-config');
    await advancedConfigSummary.click();
    const jsonTextarea = page
      .getByTestId('accordiondetails-advanced-config')
      .locator('.ace_text-input');
    await jsonTextarea.focus({ force: true });
    await page.keyboard.press('Control+a');
    await page.keyboard.insertText('{"dhis2DataSet": "some-dataset-id"}');

    // Submit
    await page.getByTestId('button-dbqt').click();

    // After creation the app navigates to the edit view for the new version
    await expect(page).toHaveURL(/\/admin\/reports\/.+\/versions\/.+\/edit/, { timeout: 15000 });

    // Confirm the advanced config round-tripped: re-open the accordion and check the saved value.
    // Wait for the navigated edit view to settle first; scrolling immediately raced the
    // re-render and detached the element ("Element is not attached to the DOM").
    const editAdvancedConfigSummary = page.getByTestId('accordionsummary-advanced-config');
    await expect(editAdvancedConfigSummary).toBeVisible();
    await editAdvancedConfigSummary.click();
    await expect(page.getByTestId('accordiondetails-advanced-config')).toContainText(
      'some-dataset-id',
      { timeout: 15000 },
    );
  });
});
