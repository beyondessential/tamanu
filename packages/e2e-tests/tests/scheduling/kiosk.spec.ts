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

const STORED_SIGN_IN_KEY = 'apiToken';

/**
 * Signs in and opens the kiosk from the sidebar in a new tab. The kiosk renews its sign-in every
 * five minutes, so the context gets a fake clock to skip ahead to the renewal.
 */
const openKioskBesideTamanu = async (browser: Browser) => {
  const { context, page: staffPage } = await signInAs(browser, testData.practitionerUser);
  await context.clock.install();

  const sidebarPage = new SidebarPage(staffPage);
  await sidebarPage.openFacilityAdmin();
  const [kioskTab] = await Promise.all([
    context.waitForEvent('page'),
    sidebarPage.kioskItem.click(),
  ]);
  await expect(new KioskPage(kioskTab).startButton).toBeVisible();

  return { context, staffPage, kioskTab, sidebarPage };
};

/**
 * Runs the kiosk's sign-in renewal and reports whether it changed the stored sign-in. A renewal
 * stores its token only after encrypting it, and a stored sign-in left as it was can't be waited
 * for, so it is watched for a while after the renewal, returning as soon as it changes.
 */
const didKioskRenewalChangeStoredSignIn = async ({
  context,
  staffPage,
  kioskTab,
}: Awaited<ReturnType<typeof openKioskBesideTamanu>>) => {
  const readStoredSignIn = () =>
    staffPage.evaluate(key => localStorage.getItem(key), STORED_SIGN_IN_KEY);
  const storedBefore = await readStoredSignIn();

  await Promise.all([
    kioskTab.waitForResponse(response => response.url().endsWith('/api/refresh')),
    context.clock.runFor('05:01'),
  ]);

  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if ((await readStoredSignIn()) !== storedBefore) return true;
    await staffPage.waitForTimeout(250);
  }
  return false;
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

  test('[KIOSK-0006] Logging out of Tamanu holds while the kiosk stays open in another tab', async ({
    browser,
  }) => {
    const kiosk = await openKioskBesideTamanu(browser);
    const { context, staffPage, sidebarPage } = kiosk;

    await sidebarPage.logOutButton.click();
    const loginPage = new LoginPage(staffPage);
    await expect(loginPage.loginButton).toBeVisible();

    expect(await didKioskRenewalChangeStoredSignIn(kiosk)).toBe(false);

    await staffPage.reload();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(sidebarPage.userAndFacilityName).toHaveCount(0);

    await context.close();
  });

  test('[KIOSK-0007] Signing in to Tamanu with another account holds while the kiosk stays open', async ({
    browser,
  }) => {
    const kiosk = await openKioskBesideTamanu(browser);
    const { context, staffPage, sidebarPage } = kiosk;

    await sidebarPage.logOutButton.click();
    const { email, password } = testData.receptionUser;
    await new LoginPage(staffPage).login(email, password);

    expect(await didKioskRenewalChangeStoredSignIn(kiosk)).toBe(false);

    // Reception can't run the kiosk, so no kiosk item shows it is still the account signed in
    await staffPage.reload();
    await expect(sidebarPage.userAndFacilityName).toBeVisible();
    if (await sidebarPage.facilityAdminSection.isVisible()) {
      await sidebarPage.openFacilityAdmin();
    }
    await expect(sidebarPage.kioskItem).toHaveCount(0);

    await context.close();
  });
});
