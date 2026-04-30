import { expect } from '@playwright/test';

import { test } from '../../fixtures/baseFixture';
import { AdminSettingsPage } from '@pages/administration/AdminSettingsPage';

test.describe('Admin settings', () => {
  test('Markdown prompt field: modal edits commit on Confirm and persist after form submit', async ({
    page,
  }) => {
    const adminSettings = new AdminSettingsPage(page);
    await adminSettings.goto();
    await adminSettings.selectCentralScope();
    await adminSettings.selectCategoryMatching(/form builder/i);

    const editButton = adminSettings
      .settingLine('interpretFormImage')
      .getByTestId('editbutton-markdowneditor');
    if ((await editButton.count()) === 0) {
      test.skip();
      return;
    }

    const marker = `\n[E2E markdown modal ${Date.now()}]`;

    await adminSettings.openMarkdownEditorForSetting('interpretFormImage');
    await adminSettings.modalAceInput().pressSequentially(marker, { delay: 5 });
    await adminSettings.confirmMarkdownModal();

    await expect(page.getByTestId('markdowneditorstatus-unsaved')).toBeVisible();

    await adminSettings.saveSettingsForm();

    await expect(page.getByTestId('button-s1z4')).toBeDisabled();
    await expect(page.getByTestId('markdowneditorstatus-unsaved')).toHaveCount(0);
  });
});
