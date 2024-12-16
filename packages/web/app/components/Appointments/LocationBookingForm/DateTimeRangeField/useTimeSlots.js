import { addMilliseconds, differenceInMilliseconds, isValid, parse } from 'date-fns';
import ms from 'ms';
import { useMemo } from 'react';
import { useSettings } from '../../../../contexts/Settings';

export const useTimeSlots = date => {
  const { getSetting } = useSettings();

  if (!isValid(date)) return [];

  const bookingSlotSettings = getSetting('appointments.bookingSlots');
  if (!bookingSlotSettings) return [];

  const { startTime, endTime, slotDuration } = bookingSlotSettings;

  return useMemo(
    () => {
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
    },
    // Relying on `valueOf()` is valid here
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startTime, endTime, slotDuration, date.valueOf()],
  );
};
