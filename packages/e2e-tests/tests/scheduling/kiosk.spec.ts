import { Browser } from '@playwright/test';

import { test, expect } from '@fixtures/baseFixture';
import { KioskPage, LoginPage, SidebarPage } from '@pages/index';
import { createTodayOutpatientAppointmentViaApi, getFacilityId } from '@utils/apiHelpers';
import { testData } from '@utils/testData';

const signInAs = async (browser: Browser, { email, password }: { email: string; password: string }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  return { context, page };
};

test.describe('Self check-in kiosk', () => {
  test('[KIOSK-0001] Staff with permission to run the kiosk check a patient in', async ({
    browser,
    page,
    api,
    newPatient,
  }) => {
    const facilityId = await getFacilityId(page);
    await createTodayOutpatientAppointmentViaApi(api, { patientId: newPatient.id, facilityId });
    const { context, page: staffPage } = await signInAs(browser, testData.practitionerUser);

    const sidebarPage = new SidebarPage(staffPage);
    await sidebarPage.openFacilityAdmin();
    const [kioskTab] = await Promise.all([
      context.waitForEvent('page'),
      sidebarPage.kioskItem.click(),
    ]);

    const kioskPage = new KioskPage(kioskTab);
    await kioskPage.checkIn(newPatient.lastName, newPatient.dateOfBirth);
    await expect(kioskPage.checkedInTitle).toBeVisible();

    await kioskPage.doneButton.click();
    await kioskPage.findAndConfirmAppointment(newPatient.lastName, newPatient.dateOfBirth);
    await expect(kioskPage.alreadyCheckedInTitle).toBeVisible();

    await context.close();
  });

  test('[KIOSK-0002] Staff without permission to run the kiosk cannot open it', async ({
    browser,
  }) => {
    const { context, page: staffPage } = await signInAs(browser, testData.receptionUser);

    const sidebarPage = new SidebarPage(staffPage);
    await expect(sidebarPage.userAndFacilityName).toBeVisible();
    if (await sidebarPage.facilityAdminSection.isVisible()) {
      await sidebarPage.openFacilityAdmin();
    }
    await expect(sidebarPage.kioskItem).toHaveCount(0);

    const kioskPage = new KioskPage(staffPage);
    await kioskPage.goto();
    await expect(kioskPage.notPermittedText).toBeVisible();
    await expect(kioskPage.startButton).toHaveCount(0);

    await context.close();
  });

  test('[KIOSK-0003] Logging out of Tamanu holds while the kiosk stays open in another tab', async ({
    browser,
  }) => {
    const { context, page: staffPage } = await signInAs(browser, testData.practitionerUser);
    // The kiosk renews its sign-in every five minutes; a fake clock lets the test skip ahead
    await context.clock.install();

    const sidebarPage = new SidebarPage(staffPage);
    await sidebarPage.openFacilityAdmin();
    const [kioskTab] = await Promise.all([
      context.waitForEvent('page'),
      sidebarPage.kioskItem.click(),
    ]);
    await expect(new KioskPage(kioskTab).startButton).toBeVisible();

    await sidebarPage.logOutButton.click();
    const loginPage = new LoginPage(staffPage);
    await expect(loginPage.loginButton).toBeVisible();

    await Promise.all([
      kioskTab.waitForResponse(response => response.url().endsWith('/api/refresh')),
      context.clock.runFor('05:01'),
    ]);
    // The renewal encrypts its token before storing it, and a store left as it was can't be
    // waited for, so give a renewal that would store its token time to do so
    await staffPage.waitForTimeout(2_000);

    await staffPage.reload();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(sidebarPage.userAndFacilityName).toHaveCount(0);

    await context.close();
  });
});
