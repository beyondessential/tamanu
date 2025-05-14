import { addMilliseconds, differenceInMilliseconds, isValid, parse } from 'date-fns';
import ms from 'ms';
import { useCallback, useMemo } from 'react';

import { isWithinIntervalExcludingEnd } from '@tamanu/utils/dateTime';

import { useSettings } from '../contexts/Settings';

/**
 * @param bookingSlotSettings See @tamanu/settings/src/schema/facility.ts for schema.
 * @param {Date} date
 * @return {Array<{start: Date, end: Date}>}
 */
const calculateTimeSlots = (bookingSlotSettings, date) => {
  if (!bookingSlotSettings) return null;
  if (!isValid(date)) throw new Error('calculateTimeSlots has been called with an invalid date');

  const { startTime, endTime, slotDuration } = bookingSlotSettings;
  const startOfDay = parse(startTime, 'HH:mm', date);
  const endOfDay = parse(endTime, 'HH:mm', date);
  const durationMs = ms(slotDuration);

  const slotCount = differenceInMilliseconds(endOfDay, startOfDay) / durationMs;
  const slots = [];
  for (let i = 0; i < slotCount; i++) {
    const start = addMilliseconds(startOfDay, i * durationMs);
    const end = addMilliseconds(start, durationMs);
    slots.push({ start, end });
  }

  return slots;
};

/**
 * Returns the bookable time slots for the provided date, or `null` if the date is invalid. If the
 * booking slot settings are still pending, returns `undefined`.
 */
export const useBookingSlots = (date) => {
  const { getSetting } = useSettings();
  const bookingSlotSettings = getSetting('appointments.bookingSlots');

  const isPending = bookingSlotSettings === undefined;

  // “Pointless” destructure so we can use primitives as `useMemo` dependencies
  const { startTime, endTime, slotDuration } = bookingSlotSettings;
  const slots = useMemo(
    () => {
      if (!date) return null;
      if (isPending) return undefined;
      return calculateTimeSlots({ startTime, endTime, slotDuration }, date);
    },
    // Relying on `valueOf()` is valid here
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [date?.valueOf(), endTime, isPending, slotDuration, startTime],
  );

  const slotContaining = useCallback(
    (time) => slots?.find((slot) => isWithinIntervalExcludingEnd(time, slot)),
    [slots],
  );
  const endOfSlotContaining = useCallback(
    (time) => slotContaining(time)?.end ?? null,
    [slotContaining],
  );

  return {
    isPending,
    slots,
    slotContaining,
    endOfSlotContaining,
  };
};
