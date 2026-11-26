import { Page } from '@playwright/test';

import { test, expect } from '@fixtures/baseFixture';
import { LoginPage, SidebarPage } from '@pages/index';
import { SettingsPage } from '@pages/facilityAdmin/SettingsPage';
import { routes } from '@config/routes';
import { constructFacilityUrl, goToAdminFrontend } from '@utils/navigation';

// Browser telemetry reads whether it is enabled from the settings saved in local storage
const readSavedSettings = (page: Page) =>
  page.evaluate(() => {
    const saved = window.localStorage.getItem('settings');
    return saved === null ? null : JSON.parse(saved);
  });

const expectSavedSettingsClearedOnLogout = async (page: Page) => {
  const sidebarPage = new SidebarPage(page);
  await expect(sidebarPage.logOutButton).toBeVisible();
  await expect.poll(() => readSavedSettings(page)).not.toBeNull();

  await sidebarPage.logOutButton.click();
  await expect(new LoginPage(page).loginButton).toBeVisible();
  expect(await readSavedSettings(page)).toBeNull();
};

test.describe('Browser telemetry settings', () => {
  test('[TEL-0001] Logging out of Tamanu clears the saved settings', async ({ page }) => {
    await page.goto(constructFacilityUrl(routes.dashboard));
    await expectSavedSettingsClearedOnLogout(page);
  });

  test('[TEL-0002] Logging out of the admin panel clears the saved settings', async ({ page }) => {
    await goToAdminFrontend(page);
    await expectSavedSettingsClearedOnLogout(page);
  });

  test('[TEL-0003] The admin panel follows telemetry being turned on and off without a reload', async ({
    page,
  }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.selectScope('Global (All Facilities/Servers)');
    await settingsPage.selectCategory('Telemetry');
    const enabledSwitch = settingsPage.switchInput(settingsPage.settingLine('enabled'));
    const setTelemetryEnabled = async (enabled: boolean) => {
      if ((await enabledSwitch.isChecked()) === enabled) return;
      await enabledSwitch.setChecked(enabled);
      await settingsPage.save();
    };
    const isTelemetryEnabled = async () => (await readSavedSettings(page))?.telemetry?.enabled;

    // Telemetry is off across the whole environment by default, so start from off and end there
    await setTelemetryEnabled(false);
    try {
      await setTelemetryEnabled(true);
      await expect.poll(isTelemetryEnabled).toBe(true);
    } finally {
      await setTelemetryEnabled(false);
    }
    await expect.poll(isTelemetryEnabled).toBe(false);
  });
});
