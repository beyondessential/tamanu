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
    await expect(sidebarPage.kioskItem).toBeVisible();

    const kioskPage = new KioskPage(staffPage);
    await kioskPage.goto();
    await kioskPage.checkIn(newPatient.lastName, newPatient.dateOfBirth);
    await expect(kioskPage.checkedInTitle).toBeVisible();

    await kioskPage.doneButton.click();
    await kioskPage.findAppointment(newPatient.lastName, newPatient.dateOfBirth);
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
});
