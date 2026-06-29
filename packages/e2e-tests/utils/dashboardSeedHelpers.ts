import { add, format, startOfDay } from 'date-fns';
import type { APIRequestContext, Page } from '@playwright/test';

import { constructFacilityUrl } from './navigation';
import { getItemFromLocalStorage } from './localStorage';
import { testData } from './testData';

/** Matches facility datetime strings used in server tests (e.g. Appointments.test.js). */
const toFacilityDateTimeString = (d: Date) => format(d, 'yyyy-MM-dd HH:mm:ss');

const THIRTY_MINUTES = { minutes: 30 } as const;

/**
 * Fixed 30-minute candidate windows for `POST /api/appointments/locationBooking` retries, restricted to
 * the **same local calendar day** as `referenceTime` so dashboard "today" panes (e.g. AT-2109) stay valid.
 * Does not add next-day fallbacks — callers that need "today" visibility should get a clear error instead.
 */
function buildTodayLocationBookingTimeWindowAttempts(referenceTime: Date): { start: Date; end: Date }[] {
  const windows: { start: Date; end: Date }[] = [];

  const cushion = add(referenceTime, { minutes: 2 });
  const alignedToNextHalfHour = new Date(cushion);
  alignedToNextHalfHour.setSeconds(0, 0);
  const remainder = alignedToNextHalfHour.getMinutes() % 30;
  const firstFromNowAligned = add(alignedToNextHalfHour, {
    minutes: remainder === 0 ? 0 : 30 - remainder,
  });
  for (let i = 0; i < 6; i += 1) {
    const start = add(firstFromNowAligned, { minutes: i * 30 });
    windows.push({ start, end: add(start, THIRTY_MINUTES) });
  }

  const nextFullHour = new Date(referenceTime);
  nextFullHour.setMinutes(0, 0, 0);
  nextFullHour.setHours(nextFullHour.getHours() + 1);
  for (let i = 0; i < 8; i += 1) {
    const start = add(nextFullHour, { minutes: i * 30 });
    windows.push({ start, end: add(start, THIRTY_MINUTES) });
  }

  const calendarDayStart = startOfDay(referenceTime);
  const calendarDayEnd = add(calendarDayStart, { days: 1 });

  const seen = new Set<number>();
  return windows.filter((w) => {
    const key = w.start.getTime();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  }).filter(
    (w) =>
      w.start.getTime() >= calendarDayStart.getTime() && w.start.getTime() < calendarDayEnd.getTime(),
  );
}

export type CreatedAppointment = Record<string, unknown>;

export async function fetchTestLocation(api: APIRequestContext): Promise<{
  id: string;
  locationGroupId: string;
  facilityId?: string;
}> {
  const res = await api.get(constructFacilityUrl(`/api/location/${testData.locationId}`));
  if (!res.ok()) {
    throw new Error(`Failed to load test location ${testData.locationId}: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Creates a single outpatient appointment for today (same calendar day as the runner),
 * assigned to the given clinician. Intended for dashboard “today’s appointments” E2E.
 */
export async function createTodayOutpatientAppointmentViaApi(
  api: APIRequestContext,
  page: Page,
  params: { patientId: string; clinicianId: string },
): Promise<CreatedAppointment> {
  const facilityId = await getItemFromLocalStorage(page, 'facilityId');
  const location = await fetchTestLocation(api);
  const start = add(new Date(), { minutes: 20 });
  const end = add(start, { minutes: 30 });

  const body = {
    facilityId,
    patientId: params.patientId,
    clinicianId: params.clinicianId,
    appointmentTypeId: 'appointmentType-standard',
    locationGroupId: location.locationGroupId,
    startTime: toFacilityDateTimeString(start),
    endTime: toFacilityDateTimeString(end),
    status: 'confirmed',
  };

  const res = await api.post(constructFacilityUrl('/api/appointments'), { data: body });
  if (!res.ok()) {
    throw new Error(`createTodayOutpatientAppointmentViaApi failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Bookable locations for the **current facility** (localStorage `facilityId`), matching
 * `LocationBookingsView` + `useLocationsQuery({ facilityId, isBookable: viewType })` — i.e.
 * `GET /api/location` with `isBookable` set to the daily or weekly tab (`daily` matches the default view).
 */
export type BookableLocationForBookingTab = {
  id: string;
  name?: string;
  locationGroup?: { id: string; name?: string };
};

export async function fetchBookableLocationsForLocationBookingsTab(
  api: APIRequestContext,
  page: Page,
  options?: { isBookable?: 'daily' | 'weekly'; facilityId?: string },
): Promise<BookableLocationForBookingTab[]> {
  /** Defaults to the signed-in facility (localStorage); override when targeting a specific facility id. */
  const facilityId =
    options?.facilityId ?? (await getItemFromLocalStorage(page, 'facilityId'));
  /** Mirrors `VIEW_TYPES.DAILY` / LocationBookingsContext default when no user preference. */
  const isBookable = options?.isBookable ?? 'daily';

  const qs = new URLSearchParams({ facilityId, isBookable });
  const res = await api.get(`${constructFacilityUrl('/api/location')}?${qs.toString()}`);
  if (!res.ok()) {
    throw new Error(`fetchBookableLocationsForLocationBookingsTab failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Creates a location booking for the clinician using any **bookable** location for the current facility
 * (same list as scheduling → location bookings). Tries fixed 30-minute windows **on the current local
 * calendar day only** (half-hour alignment + next-hour series), advancing on **409** conflicts only.
 * Does not book into the next day: a tomorrow booking would not show in the dashboard "today" pane
 * (e.g. AT-2109) and would fail later with a misleading "element not found".
 */
export async function createTodayLocationBookingViaApi(
  api: APIRequestContext,
  page: Page,
  params: {
    patientId: string;
    clinicianId: string;
    /** Optional; passed through to `fetchBookableLocationsForLocationBookingsTab` (e.g. explicit `facilityId`). */
    bookableLocationQuery?: { facilityId?: string; isBookable?: 'daily' | 'weekly' };
  },
): Promise<CreatedAppointment> {
  const locations = await fetchBookableLocationsForLocationBookingsTab(api, page, params.bookableLocationQuery);
  if (locations.length === 0) {
    throw new Error(
      'fetchBookableLocationsForLocationBookingsTab returned no locations (check facility bookable areas / permissions)',
    );
  }

  const now = new Date();
  const timeWindowAttempts = buildTodayLocationBookingTimeWindowAttempts(now);
  if (timeWindowAttempts.length === 0) {
    throw new Error(
      'createTodayLocationBookingViaApi: no candidate windows left on the current local calendar day (e.g. near midnight with no remaining same-day slots). Cannot seed a booking visible in the "today" bookings pane.',
    );
  }

  for (const { id: locationId } of locations) {
    for (const { start, end } of timeWindowAttempts) {
      const body = {
        patientId: params.patientId,
        clinicianId: params.clinicianId,
        locationId,
        startTime: toFacilityDateTimeString(start),
        endTime: toFacilityDateTimeString(end),
      };

      const res = await api.post(constructFacilityUrl('/api/appointments/locationBooking'), { data: body });
      if (res.ok()) {
        return res.json();
      }
      if (res.status() === 409) {
        continue;
      }
      throw new Error(`createTodayLocationBookingViaApi failed: ${res.status()} ${await res.text()}`);
    }
  }

  throw new Error(
    `createTodayLocationBookingViaApi: no free slot on the current local calendar day after trying ${locations.length} bookable location(s) and ${timeWindowAttempts.length} same-day 30-minute window(s) per location (409 conflicts exhausted). A next-day fallback is intentionally omitted so dashboard "today" booking assertions (e.g. AT-2109) do not fail with a missing element.`,
  );
}

export async function clearClinicianDashboardTaskingFilterViaApi(
  api: APIRequestContext,
  page: Page,
): Promise<void> {
  const facilityId = await getItemFromLocalStorage(page, 'facilityId');
  const res = await api.post(constructFacilityUrl('/api/user/userPreferences'), {
    data: {
      facilityId,
      key: 'clinicianDashboardTaskingTableFilter',
      value: {},
    },
  });
  if (!res.ok()) {
    throw new Error(`clearClinicianDashboardTaskingFilterViaApi failed: ${res.status()} ${await res.text()}`);
  }
}

export async function setClinicianDashboardTaskingFilterViaApi(
  api: APIRequestContext,
  page: Page,
  value: Record<string, unknown>,
): Promise<void> {
  const facilityId = await getItemFromLocalStorage(page, 'facilityId');
  const res = await api.post(constructFacilityUrl('/api/user/userPreferences'), {
    data: {
      facilityId,
      key: 'clinicianDashboardTaskingTableFilter',
      value,
    },
  });
  if (!res.ok()) {
    throw new Error(`setClinicianDashboardTaskingFilterViaApi failed: ${res.status()} ${await res.text()}`);
  }
}

export async function fetchFacilityLocationsViaApi(
  api: APIRequestContext,
  page: Page,
): Promise<Array<{ id: string; locationGroupId?: string; name?: string }>> {
  const facilityId = await getItemFromLocalStorage(page, 'facilityId');
  const qs = new URLSearchParams({ facilityId });
  const res = await api.get(`${constructFacilityUrl('/api/location')}?${qs.toString()}`);
  if (!res.ok()) {
    throw new Error(`fetchFacilityLocationsViaApi failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

const DASHBOARD_TASK_NAME = 'E2E dashboard task';

/**
 * Creates a single TODO task due soon on an open encounter, with no designation (visible to all clinicians
 * per `/api/user/tasks` rules). `startTime` / `requestTime` use facility datetime strings (`YYYY-MM-DD HH:MM:SS`).
 */
export async function createUpcomingDashboardTaskViaApi(
  api: APIRequestContext,
  params: {
    encounterId: string;
    requestedByUserId: string;
    taskName?: string;
    highPriority?: boolean;
  },
): Promise<unknown> {
  const startTime = add(new Date(), { hours: 1 });
  startTime.setSeconds(0, 0);
  const requestTime = new Date();

  const body = {
    startTime: toFacilityDateTimeString(startTime),
    requestTime: toFacilityDateTimeString(requestTime),
    requestedByUserId: params.requestedByUserId,
    encounterId: params.encounterId,
    note: 'e2e dashboard seed',
    tasks: [
      {
        name: params.taskName ?? DASHBOARD_TASK_NAME,
        highPriority: params.highPriority ?? false,
        designationIds: [] as string[],
      },
    ],
  };

  const res = await api.post(constructFacilityUrl('/api/tasks'), { data: body });
  if (!res.ok()) {
    throw new Error(`createUpcomingDashboardTaskViaApi failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

export { DASHBOARD_TASK_NAME };
