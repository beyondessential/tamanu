import path from 'path';

import { test, expect } from '../../fixtures/baseFixture';
import { routes } from '../../config/routes';
import { constructFacilityUrl } from '../../utils/navigation';
import {
  createApiContext,
  createHospitalAdmissionEncounterViaAPI,
  createPatient,
  createClinicEncounterViaApi,
  getUser,
} from '../../utils/apiHelpers';
import {
  createCompletedImagingRequestViaApi,
  createPublishedLabRequestViaApi,
  NOTIFICATION_TYPE_IMAGING_REQUEST,
  NOTIFICATION_TYPE_LAB_REQUEST,
  waitForNotificationForRequestDisplayId,
} from '../../utils/dashboardNotificationSeedHelpers';
import {
  clearClinicianDashboardTaskingFilterViaApi,
  fetchFacilityLocationsViaApi,
  createTodayLocationBookingViaApi,
  createTodayOutpatientAppointmentViaApi,
  createUpcomingDashboardTaskViaApi,
  DASHBOARD_TASK_NAME,
  setClinicianDashboardTaskingFilterViaApi,
} from '../../utils/dashboardSeedHelpers';
import { getItemFromLocalStorage } from '../../utils/localStorage';
import { RecentlyViewedPatientsList } from '../../pages/patients/RecentlyViewedPatientsList';

test.describe('Dashboard', () => {
  test.describe.configure({ mode: 'serial' });

  let currentUserDisplayName: string;

  test.beforeAll(async ({ browser }) => {
    const authStatePath = path.resolve(__dirname, '../../.auth/user.json');
    const context = await browser.newContext({ storageState: authStatePath });
    const page = await context.newPage();
    await page.goto(constructFacilityUrl(routes.dashboard));
    const api = await createApiContext({ page });
    const user = await getUser(api);
    currentUserDisplayName = user.displayName || '';
    await api.dispose();
    await context.close();
  });

  test.describe('landing (direct)', () => {
    test.beforeEach(async ({ dashboardPage }) => {
      await dashboardPage.goto();
    });

    test('[AT-2100]Land on dashboard: URL and waitForLoaded', async ({ dashboardPage, page }) => {
      await expect(page).toHaveURL(/\/dashboard$/);
      await dashboardPage.waitForLoaded();
      await expect(dashboardPage.topBar).toBeVisible();
    });

    test('[AT-2102]Top bar greeting reflects signed-in user displayName', async ({ dashboardPage }) => {
      expect(currentUserDisplayName).toBeTruthy();
      await dashboardPage.expectGreetingContains(currentUserDisplayName);
      await expect(dashboardPage.subtitle).toBeVisible();
    });

    test('[AT-2101]Notifications: bell visible; open drawer; close', async ({ dashboardPage }) => {
      await expect(dashboardPage.notificationButton).toBeVisible();
      await dashboardPage.openNotificationDrawer();
      await expect(dashboardPage.notificationDrawerCloseButton).toBeVisible();
      await dashboardPage.closeNotificationDrawer();
    });
  });

  test.describe('from sidebar', () => {
    test.beforeEach(async ({ allPatientsPage }) => {
      await allPatientsPage.goto();
      await allPatientsPage.waitForPageToLoad();
    });

    test('[AT-2103]Navigate to dashboard via sidebar: URL and waitForLoaded', async ({
      sidebarPage,
      dashboardPage,
      page,
    }) => {
      await sidebarPage.goToDashboard();
      await expect(page).toHaveURL(/\/dashboard$/);
      await dashboardPage.waitForLoaded();
    });

    test('[AT-2104]Greeting after opening dashboard from sidebar', async ({
      sidebarPage,
      dashboardPage,
    }) => {
      await sidebarPage.goToDashboard();
      await dashboardPage.waitForLoaded();
      expect(currentUserDisplayName).toBeTruthy();
      await dashboardPage.expectGreetingContains(currentUserDisplayName);
    });
  });

  test.describe('recently viewed on dashboard', () => {
    test('[AT-2105]First recently viewed row matches patient after visiting details', async ({
      newPatient,
      patientDetailsPage,
      dashboardPage,
    }) => {
      await patientDetailsPage.goToPatient(newPatient);
      await patientDetailsPage.confirmPatientDetailsPageHasLoaded();
      await dashboardPage.goto();
      await expect(dashboardPage.recentlyViewedPatientsList.firstRecentlyViewedName).toHaveText(
        `${newPatient.firstName} ${newPatient.lastName}`,
      );
      await expect(dashboardPage.recentlyViewedPatientsList.firstRecentlyViewedNHN).toHaveText(
        newPatient.displayId,
      );
      await expect(
        dashboardPage.recentlyViewedPatientsList.firstRecentlyViewedGender,
      ).toHaveText(new RegExp(`^${newPatient.sex}$`, 'i'));
      const expectedFormattedDate = RecentlyViewedPatientsList.formatDateForRecentlyViewed(
        newPatient.dateOfBirth || '',
      );
      await expect(
        dashboardPage.recentlyViewedPatientsList.firstRecentlyViewedBirthDate,
      ).toHaveText(expectedFormattedDate);
    });

    test('[AT-2106]Clicking recently viewed patient on dashboard opens patient details', async ({
      newPatient,
      patientDetailsPage,
      dashboardPage,
    }) => {
      await patientDetailsPage.goToPatient(newPatient);
      await patientDetailsPage.confirmPatientDetailsPageHasLoaded();
      await dashboardPage.goto();
      await expect(dashboardPage.recentlyViewedPatientsList.firstRecentlyViewedNHN).toHaveText(
        newPatient.displayId,
      );
      await dashboardPage.recentlyViewedPatientsList.firstRecentlyViewedName.click();
      await expect(patientDetailsPage.healthIdText).toHaveText(newPatient.displayId);
    });
  });

  test.describe('layout (environment-dependent)', () => {
    test.beforeEach(async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await expect(
        dashboardPage.welcomeLayoutRoot.or(dashboardPage.mainPageContainer),
      ).toBeVisible({ timeout: 30_000 });
    });

    test('[AT-2107]Welcome-only dashboard layout and copy', async ({ dashboardPage }) => {
      await expect(await dashboardPage.isWelcomeOnlyLayout()).toBeTruthy();
      await expect(dashboardPage.welcomeLayoutRoot).toBeVisible();
      await expect(dashboardPage.welcomePageContainer).toBeVisible();
      await expect(dashboardPage.welcomeHeroTitle).toContainText('Welcome to Tamanu');
      await expect(dashboardPage.welcomeDescription).toContainText('Tamanu Dashboard');
      await expect(dashboardPage.welcomeDescription).toContainText('permission');
      await expect(dashboardPage.welcomeImage).toBeVisible();
    });

    test('[AT-2108]Main dashboard layout shell and optional panes', async ({ dashboardPage }) => {
      await expect(await dashboardPage.isMainDashboardLayout()).toBeTruthy();
      await expect(dashboardPage.mainPageContainer).toBeVisible();
      await expect(dashboardPage.dashboardLayout).toBeVisible();
      await expect(dashboardPage.patientsTasksContainer).toBeVisible();

      if (await dashboardPage.taskPane.isVisible()) {
        await expect(dashboardPage.taskPane).toBeVisible();
      }

      if ((await dashboardPage.schedulePanesContainer.count()) > 0) {
        await expect(dashboardPage.schedulePanesContainer).toBeVisible();
        if ((await dashboardPage.appointmentsPane.count()) > 0) {
          await expect(dashboardPage.appointmentsPane).toBeVisible();
        }
        if ((await dashboardPage.bookingsPane.count()) > 0) {
          await expect(dashboardPage.bookingsPane).toBeVisible();
        }
      }
    });
  });

  test.describe('seeded scheduling panes', () => {
    test('[AT-2109]Seeded outpatient appointment, location booking, and task appear on dashboard', async ({
      page,
      api,
      newPatient,
      newPatientWithHospitalAdmission,
      dashboardPage,
    }) => {
      test.setTimeout(90_000);

      const user = await getUser(api);

      await createTodayOutpatientAppointmentViaApi(api, page, {
        patientId: newPatient.id as string,
        clinicianId: user.id,
      });
      await createTodayLocationBookingViaApi(api, page, {
        patientId: newPatient.id as string,
        clinicianId: user.id,
      });

      const facilityId = await getItemFromLocalStorage(page, 'facilityId');
      const encounterRes = await api.get(
        constructFacilityUrl(
          `/api/patient/${newPatientWithHospitalAdmission.id}/currentEncounter?facilityId=${encodeURIComponent(facilityId)}`,
        ),
      );
      expect(encounterRes.ok()).toBeTruthy();
      const encounter = await encounterRes.json();
      expect(encounter?.id).toBeTruthy();

      await createUpcomingDashboardTaskViaApi(api, {
        encounterId: encounter.id as string,
        requestedByUserId: user.id,
      });

      await clearClinicianDashboardTaskingFilterViaApi(api, page);

      await dashboardPage.goto();
      await expect(await dashboardPage.isMainDashboardLayout()).toBeTruthy();

      await expect(dashboardPage.schedulePanesContainer).toBeVisible({ timeout: 25_000 });

      await expect(
        dashboardPage.appointmentsPane.getByRole('button', {
          name: new RegExp(`${newPatient.firstName}.*${newPatient.lastName}`, 'i'),
        }),
      ).toBeVisible({ timeout: 25_000 });

      await expect(
        dashboardPage.bookingPatientName(`${newPatient.firstName} ${newPatient.lastName}`),
      ).toBeVisible({ timeout: 25_000 });

      if (await dashboardPage.dashboardTaskPane.isVisible()) {
        await expect(dashboardPage.dashboardTaskPane.getByText(DASHBOARD_TASK_NAME)).toBeVisible({
          timeout: 25_000,
        });
      }
    });
  });

  test.describe('dashboard pane navigation and task table behavior', () => {
    test('[AT-2115]Today appointments View all redirects to outpatients appointments page', async ({
      page,
      api,
      newPatient,
      dashboardPage,
    }) => {
      const user = await getUser(api);
      await createTodayOutpatientAppointmentViaApi(api, page, {
        patientId: newPatient.id as string,
        clinicianId: user.id,
      });
      await dashboardPage.goto();
      await expect(await dashboardPage.isMainDashboardLayout()).toBeTruthy();
      await dashboardPage.clickTodayAppointmentsViewAll();
      await expect(page).toHaveURL(/\/appointments\/outpatients\?groupBy=clinicianId$/, {
        timeout: 30_000,
      });
    });

    test('[AT-2116]Today bookings View all redirects to location bookings page', async ({
      page,
      api,
      newPatient,
      dashboardPage,
    }) => {
      const user = await getUser(api);
      await createTodayLocationBookingViaApi(api, page, {
        patientId: newPatient.id as string,
        clinicianId: user.id,
      });
      await dashboardPage.goto();
      await expect(await dashboardPage.isMainDashboardLayout()).toBeTruthy();
      await dashboardPage.clickTodayBookingsViewAll();
      await expect(page).toHaveURL(/\/appointments\/locations\?clinicianId=/, {
        timeout: 30_000,
      });
    });

    test('[AT-2117]Task filter by area/location and high priority shows matching task', async ({
      page,
      api,
      newPatientWithHospitalAdmission,
      dashboardPage,
    }) => {
      test.setTimeout(120_000);
      const user = await getUser(api);

      const seededPatient = newPatientWithHospitalAdmission;
      const extraPatient = await createPatient(api, page);

      const locations = await fetchFacilityLocationsViaApi(api, page);
      expect(locations.length >= 2).toBeTruthy();
      const preferredLocation = locations[0];
      const alternateLocation = locations[1];
      expect(preferredLocation.locationGroupId).toBeTruthy();

      await createHospitalAdmissionEncounterViaAPI(api, extraPatient.id as string, {
        locationId: alternateLocation.id,
      });

      const facilityId = await getItemFromLocalStorage(page, 'facilityId');
      const encounterARes = await api.get(
        constructFacilityUrl(
          `/api/patient/${seededPatient.id}/currentEncounter?facilityId=${encodeURIComponent(facilityId)}`,
        ),
      );
      const encounterBRes = await api.get(
        constructFacilityUrl(
          `/api/patient/${extraPatient.id}/currentEncounter?facilityId=${encodeURIComponent(facilityId)}`,
        ),
      );
      expect(encounterARes.ok() && encounterBRes.ok()).toBeTruthy();
      const encounterA = await encounterARes.json();
      const encounterB = await encounterBRes.json();
      expect(encounterA?.id && encounterB?.id).toBeTruthy();

      const highPriorityTask = 'E2E high priority filtered task';
      const lowPriorityTask = 'E2E low priority unfiltered task';
      await createUpcomingDashboardTaskViaApi(api, {
        encounterId: encounterA.id as string,
        requestedByUserId: user.id,
        taskName: highPriorityTask,
        highPriority: true,
      });
      await createUpcomingDashboardTaskViaApi(api, {
        encounterId: encounterB.id as string,
        requestedByUserId: user.id,
        taskName: lowPriorityTask,
        highPriority: false,
      });

      await setClinicianDashboardTaskingFilterViaApi(api, page, {
        locationId: preferredLocation.id,
        locationGroupId: preferredLocation.locationGroupId,
        highPriority: true,
      });

      await dashboardPage.goto();
      await expect(dashboardPage.dashboardTaskPane).toBeVisible();
      await dashboardPage.assertTaskVisible(highPriorityTask);
      await dashboardPage.assertTaskNotVisible(lowPriorityTask);

      await clearClinicianDashboardTaskingFilterViaApi(api, page);
    });

    test('[AT-2118]Tasks table sortable columns toggle sort direction', async ({
      page,
      api,
      newPatientWithHospitalAdmission,
      dashboardPage,
    }) => {
      const user = await getUser(api);
      const facilityId = await getItemFromLocalStorage(page, 'facilityId');
      const encounterRes = await api.get(
        constructFacilityUrl(
          `/api/patient/${newPatientWithHospitalAdmission.id}/currentEncounter?facilityId=${encodeURIComponent(facilityId)}`,
        ),
      );
      expect(encounterRes.ok()).toBeTruthy();
      const encounter = await encounterRes.json();
      expect(encounter?.id).toBeTruthy();

      await createUpcomingDashboardTaskViaApi(api, {
        encounterId: encounter.id as string,
        requestedByUserId: user.id,
        taskName: 'E2E sortable task A',
      });
      await createUpcomingDashboardTaskViaApi(api, {
        encounterId: encounter.id as string,
        requestedByUserId: user.id,
        taskName: 'E2E sortable task B',
      });

      await clearClinicianDashboardTaskingFilterViaApi(api, page);
      await dashboardPage.goto();
      await expect(dashboardPage.dashboardTaskPane).toBeVisible();

      await dashboardPage.sortTasksByColumn('Location');
      await dashboardPage.expectTaskColumnSort('Location', 'ascending');
      await dashboardPage.sortTasksByColumn('Location');
      await dashboardPage.expectTaskColumnSort('Location', 'descending');

      await dashboardPage.sortTasksByColumn('Task');
      await dashboardPage.expectTaskColumnSort('Task', 'ascending');
      await dashboardPage.sortTasksByColumn('Task');
      await dashboardPage.expectTaskColumnSort('Task', 'descending');
    });
  });

  test.describe('notifications drawer (lab & imaging)', () => {
    test('[AT-2110]Published lab request appears in notification drawer', async ({
      page,
      api,
      newPatient,
      dashboardPage,
    }) => {
      test.setTimeout(120_000);

      const user = await getUser(api);
      const encounter = await createClinicEncounterViaApi(api, newPatient.id as string);

      const { labRequestDisplayId } = await createPublishedLabRequestViaApi(api, page, {
        encounterId: encounter.id as string,
        requestedByUserId: user.id,
      });

      await waitForNotificationForRequestDisplayId(api, page, labRequestDisplayId, {
        type: NOTIFICATION_TYPE_LAB_REQUEST,
      });

      await dashboardPage.goto();
      await expect(dashboardPage.unreadNotificationIndicator).toBeVisible({ timeout: 30_000 });
      await dashboardPage.openNotificationDrawer();
      await dashboardPage.waitForNotificationDrawerLoaded();
      const labNotificationBody = dashboardPage.notificationByDisplayId(labRequestDisplayId);
      await expect(labNotificationBody).toBeVisible({ timeout: 15_000 });
      await expect(labNotificationBody).toContainText(/Lab results for/i);
      await dashboardPage.closeNotificationDrawer();
    });

    test('[AT-2111]Completed imaging request appears in notification drawer', async ({
      page,
      api,
      newPatient,
      dashboardPage,
    }) => {
      test.setTimeout(120_000);

      const user = await getUser(api);
      const encounter = await createClinicEncounterViaApi(api, newPatient.id as string);

      const { imagingRequestDisplayId } = await createCompletedImagingRequestViaApi(api, {
        encounterId: encounter.id as string,
        requestedByUserId: user.id,
      });

      await waitForNotificationForRequestDisplayId(api, page, imagingRequestDisplayId, {
        type: NOTIFICATION_TYPE_IMAGING_REQUEST,
      });

      await dashboardPage.goto();
      await expect(dashboardPage.unreadNotificationIndicator).toBeVisible({ timeout: 30_000 });
      await dashboardPage.openNotificationDrawer();
      await dashboardPage.waitForNotificationDrawerLoaded();
      const imagingNotificationBody = dashboardPage.notificationByDisplayId(imagingRequestDisplayId);
      await expect(imagingNotificationBody).toBeVisible({ timeout: 15_000 });
      await expect(imagingNotificationBody).toContainText(/Imaging results for/i);
      await dashboardPage.closeNotificationDrawer();
    });

    test('[AT-2112]Clicking lab notification opens lab request page', async ({
      page,
      api,
      newPatient,
      dashboardPage,
    }) => {
      test.setTimeout(120_000);

      const user = await getUser(api);
      const encounter = await createClinicEncounterViaApi(api, newPatient.id as string);
      const { labRequestDisplayId } = await createPublishedLabRequestViaApi(api, page, {
        encounterId: encounter.id as string,
        requestedByUserId: user.id,
      });

      await waitForNotificationForRequestDisplayId(api, page, labRequestDisplayId, {
        type: NOTIFICATION_TYPE_LAB_REQUEST,
      });

      await dashboardPage.goto();
      await dashboardPage.openNotificationDrawer();
      await dashboardPage.waitForNotificationDrawerLoaded();
      await dashboardPage.notificationCardByDisplayId(labRequestDisplayId).click();
      await expect(page).toHaveURL(new RegExp(`/patients/all/${newPatient.id}/`), { timeout: 30_000 });
      await expect(page).toHaveURL(/\/lab-request\//, { timeout: 30_000 });
    });

    test('[AT-2113]Clicking imaging notification opens imaging request page', async ({
      page,
      api,
      newPatient,
      dashboardPage,
    }) => {
      test.setTimeout(120_000);

      const user = await getUser(api);
      const encounter = await createClinicEncounterViaApi(api, newPatient.id as string);
      const { imagingRequestDisplayId } = await createCompletedImagingRequestViaApi(api, {
        encounterId: encounter.id as string,
        requestedByUserId: user.id,
      });

      await waitForNotificationForRequestDisplayId(api, page, imagingRequestDisplayId, {
        type: NOTIFICATION_TYPE_IMAGING_REQUEST,
      });

      await dashboardPage.goto();
      await dashboardPage.openNotificationDrawer();
      await dashboardPage.waitForNotificationDrawerLoaded();
      await dashboardPage.notificationCardByDisplayId(imagingRequestDisplayId).click();
      await expect(page).toHaveURL(new RegExp(`/patients/all/${newPatient.id}/`), { timeout: 30_000 });
      await expect(page).toHaveURL(/\/imaging-request\//, { timeout: 30_000 });
    });

    test('[AT-2114]Mark all as read moves unread notifications to Recent section', async ({
      page,
      api,
      newPatient,
      dashboardPage,
    }) => {
      test.setTimeout(120_000);

      const user = await getUser(api);
      const encounter = await createClinicEncounterViaApi(api, newPatient.id as string);
      const { labRequestDisplayId } = await createPublishedLabRequestViaApi(api, page, {
        encounterId: encounter.id as string,
        requestedByUserId: user.id,
      });

      await waitForNotificationForRequestDisplayId(api, page, labRequestDisplayId, {
        type: NOTIFICATION_TYPE_LAB_REQUEST,
      });

      await dashboardPage.goto();
      await dashboardPage.openNotificationDrawer();
      await dashboardPage.waitForNotificationDrawerLoaded();

      const unreadNotification = dashboardPage.notificationByDisplayId(labRequestDisplayId);
      await expect(unreadNotification).toBeVisible({ timeout: 15_000 });
      await expect(dashboardPage.unreadNotificationTitle).toBeVisible();

      await dashboardPage.markAllAsReadAction.click();
      await expect(dashboardPage.unreadNotificationTitle).toBeHidden({ timeout: 15_000 });
      await expect(dashboardPage.readNotificationTitle).toContainText(/Recent \(last 48 hours\)/i);
      await expect(dashboardPage.readNotificationByDisplayId(labRequestDisplayId)).toBeVisible({
        timeout: 15_000,
      });
    });
  });
});
