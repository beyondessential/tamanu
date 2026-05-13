import {
  add,
  addMilliseconds,
  addDays,
  differenceInMilliseconds,
  format,
  isValid,
  parse,
  startOfDay,
} from 'date-fns';
import type { APIRequestContext, Page } from '@playwright/test';

import { constructFacilityUrl } from './navigation';
import { getItemFromLocalStorage } from './localStorage';
import { testData } from './testData';

/** Matches facility datetime strings used in server tests (e.g. Appointments.test.js). */
const toFacilityDateTimeString = (d: Date) => format(d, 'yyyy-MM-dd HH:mm:ss');

/** Defaults match `packages/settings/src/schema/facility.ts` (`appointments.bookingSlots`). */
const DEFAULT_BOOKING_SLOT_SETTINGS = {
  startTime: '09:00',
  endTime: '17:00',
  slotDuration: '30min',
} as const;

export type AppointmentBookingSlotSettings = {
  startTime: string;
  endTime: string;
  slotDuration: string;
};

/**
 * Same duration subset as `durationStringSchema` / `ms()` used in `useBookingSlots.jsx`.
 */
function parseSlotDurationToMilliseconds(slotDuration: string): number {
  const m = slotDuration
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h)$/i);
  if (!m) {
    throw new Error(`Unsupported booking slotDuration for E2E: ${slotDuration}`);
  }
  const n = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  if (unit.startsWith('h')) {
    return Math.round(n * 60 * 60 * 1000);
  }
  if (unit === 's' || unit.startsWith('sec')) {
    return Math.round(n * 1000);
  }
  return Math.round(n * 60 * 1000);
}

/**
 * Mirrors `calculateTimeSlots` in `packages/web/app/hooks/useBookingSlots.jsx` (Book location modal slices).
 */
export function calculateLocationBookingTimeSlots(
  bookingSlotSettings: AppointmentBookingSlotSettings,
  calendarDay: Date,
): { start: Date; end: Date }[] {
  if (!isValid(calendarDay)) {
    throw new Error('calculateLocationBookingTimeSlots: invalid calendar day');
  }
  const { startTime, endTime, slotDuration } = bookingSlotSettings;
  const startOfDayBoundary = parse(startTime, 'HH:mm', calendarDay);
  const endOfDayBoundary = parse(endTime, 'HH:mm', calendarDay);
  const durationMs = parseSlotDurationToMilliseconds(slotDuration);
  const slotCount = differenceInMilliseconds(endOfDayBoundary, startOfDayBoundary) / durationMs;
  const slots: { start: Date; end: Date }[] = [];
  for (let i = 0; i < slotCount; i++) {
    const start = addMilliseconds(startOfDayBoundary, i * durationMs);
    const end = addMilliseconds(start, durationMs);
    slots.push({ start, end });
  }
  return slots;
}

/** Prefer slots that still end after `now`, then earlier same-day slots (same ordering strategy as picking “next” slices). */
function orderBookingSlotsForAttempts(
  slots: { start: Date; end: Date }[],
  now: Date,
): { start: Date; end: Date }[] {
  const firstWithFutureEnd = slots.findIndex(s => s.end > now);
  if (firstWithFutureEnd <= 0) {
    return [...slots];
  }
  return [...slots.slice(firstWithFutureEnd), ...slots.slice(0, firstWithFutureEnd)];
}

/**
 * Reads `appointments.bookingSlots` from `GET /api/settings/frontEnd` when present; otherwise defaults.
 * Aligns with what the facility UI uses for the Book location time toggles (`useBookingSlots`).
 */
export async function fetchAppointmentBookingSlotSettings(
  api: APIRequestContext,
): Promise<AppointmentBookingSlotSettings> {
  const res = await api.get(constructFacilityUrl('/api/settings/frontEnd'));
  if (!res.ok()) {
    throw new Error(`fetchAppointmentBookingSlotSettings failed: ${res.status()} ${await res.text()}`);
  }
  const body = (await res.json()) as {
    settings?: { appointments?: { bookingSlots?: Partial<AppointmentBookingSlotSettings> } };
  };
  const raw = body.settings?.appointments?.bookingSlots;
  return {
    startTime: raw?.startTime ?? DEFAULT_BOOKING_SLOT_SETTINGS.startTime,
    endTime: raw?.endTime ?? DEFAULT_BOOKING_SLOT_SETTINGS.endTime,
    slotDuration: raw?.slotDuration ?? DEFAULT_BOOKING_SLOT_SETTINGS.slotDuration,
  };
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
 * Creates a location booking overlapping “now”, assigned to the clinician, using any **bookable**
 * location returned for the current facility (same list as the scheduling → location bookings tab).
 * Retries staggered time windows per location on 409 (slot conflict).
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

  const bookingSlotSettings = await fetchAppointmentBookingSlotSettings(api);
  const now = new Date();
  const today = startOfDay(now);
  const todaySlots = calculateLocationBookingTimeSlots(bookingSlotSettings, today);
  const tomorrowSlots = calculateLocationBookingTimeSlots(bookingSlotSettings, addDays(today, 1));
  const slotAttempts = [
    ...orderBookingSlotsForAttempts(todaySlots, now),
    ...orderBookingSlotsForAttempts(tomorrowSlots, now),
  ];

  for (const { id: locationId } of locations) {
    for (const { start, end } of slotAttempts) {
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
    `createTodayLocationBookingViaApi: no free slot after trying ${locations.length} bookable location(s) and ${slotAttempts.length} booking-slot-aligned window(s) per location`,
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
