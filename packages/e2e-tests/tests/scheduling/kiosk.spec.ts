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

  test('[KIOSK-0003] Patient completes their forms and checks in', async ({
    browser,
    page,
    api,
    newPatient,
  }) => {
    const facilityId = await getFacilityId(page);
    await createTodayOutpatientAppointmentViaApi(api, {
      patientId: newPatient.id,
      facilityId,
      appointmentTypeId: testData.kioskDemo.followUpAppointmentTypeId,
    });
    const { context, page: kioskTab } = await signInAs(browser, testData.practitionerUser);
    const kioskPage = new KioskPage(kioskTab);
    const { form } = kioskPage;
    await kioskPage.goto();

    await kioskPage.findAndConfirmAppointment(newPatient.lastName, newPatient.dateOfBirth);
    await expect(form.pageProgress).toHaveText('Page 1 of 3');
    await form.nextButton.click();
    await expect(form.requiredMessages).toHaveCount(1);
    await form.answerText('What is the main reason for your visit?', 'Check-up');
    await form.nextButton.click();
    await form.answerYesNo('Do you have a fever, cough or sore throat today?', 'No');
    await form.nextButton.click();
    await form.nextButton.click();

    await expect(kioskPage.readyToCheckInTitle).toBeVisible();
    await kioskPage.checkInButton.click();
    await expect(kioskPage.checkedInTitle).toBeVisible();

    await context.close();
  });

  test('[KIOSK-0004] Patient without an appointment today is directed to reception', async ({
    browser,
  }) => {
    const lastName = 'Nobody-Has-This-Name';
    const { context, page: kioskTab } = await signInAs(browser, testData.practitionerUser);
    const kioskPage = new KioskPage(kioskTab);
    await kioskPage.goto();

    await kioskPage.findAppointment(lastName, '1986-03-14');
    await expect(kioskPage.noMatchTitle).toBeVisible();
    await expect(kioskPage.noMatchSearchedDetails).toHaveText([lastName, '14 March 1986']);

    await kioskPage.editDetailsButton.click();
    await expect(kioskPage.lastNameInput).toHaveValue(lastName);

    await context.close();
  });

  test('[KIOSK-0005] Start over clears the check-in', async ({ browser, page, api, newPatient }) => {
    const facilityId = await getFacilityId(page);
    await createTodayOutpatientAppointmentViaApi(api, { patientId: newPatient.id, facilityId });
    const { context, page: kioskTab } = await signInAs(browser, testData.practitionerUser);
    const kioskPage = new KioskPage(kioskTab);
    await kioskPage.goto();

    await kioskPage.findAppointment(newPatient.lastName, newPatient.dateOfBirth);
    await expect(kioskPage.confirmButton).toBeVisible();
    await kioskPage.startOver();
    await expect(kioskPage.startButton).toBeVisible();

    await kioskPage.startButton.click();
    await expect(kioskPage.lastNameInput).toHaveValue('');

    await context.close();
  });
});
