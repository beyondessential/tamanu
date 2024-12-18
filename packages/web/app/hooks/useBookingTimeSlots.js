import { addMilliseconds, differenceInMilliseconds, isValid, parse } from 'date-fns';
import ms from 'ms';
import { useMemo } from 'react';

import { isWithinIntervalExcludingEnd } from '@tamanu/shared/utils/dateTime';

import { useBookingSlotSettings } from './useBookingSlotSettings';

/**
 * Returns the bookable time slots for the provided date, or `null` if the date is invalid. If the
 * booking slot settings are still pending, returns undefined.
 */
export const useBookingTimeSlots = date => {
  const bookingSlotSettings = useBookingSlotSettings();
  const isPending = bookingSlotSettings === undefined;

  const { startTime, endTime, slotDuration } = bookingSlotSettings;
  const slots = useMemo(
    () => {
      if (!isValid(date)) return [];

      const startOfDay = parse(startTime, 'HH:mm', date);
      const endOfDay = parse(endTime, 'HH:mm', date);
      const durationMs = ms(slotDuration);

      const slotCount = differenceInMilliseconds(endOfDay, startOfDay) / durationMs;
      const _slots = [];
      for (let i = 0; i < slotCount; i++) {
        const start = addMilliseconds(startOfDay, i * durationMs);
        const end = addMilliseconds(start, durationMs);
        _slots.push({ start, end });
      }

      return _slots;
    },
    // Relying on `valueOf()` is valid here
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startTime, endTime, slotDuration, date?.valueOf()],
  );


  const slotContaining = time => slots.find(slot => isWithinIntervalExcludingEnd(time, slot));
  const endOfSlotContaining = time => slotContaining(time)?.end ?? null;

  return {
    slots: isPending ? undefined : slots,
    isPending,
    slotContaining,
    endOfSlotContaining,
  };
};
