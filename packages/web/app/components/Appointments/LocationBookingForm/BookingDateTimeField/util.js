import { addMinutes, differenceInMinutes, isWithinInterval, parse } from 'date-fns';
import ms from 'ms';

/**
 * @param {{start: Date, end: Date}} timeSlot
 * @param {{start: Date, end: Date}} range
 */
export const isTimeSlotWithinRange = (timeSlot, range) => {
  if (!range) return false;
  return isWithinInterval(timeSlot.start, range) && isWithinInterval(timeSlot.end, range);
};

/**
 * @param bookingSlotSettings See @tamanu/settings/src/schema/facility.ts for schema.
 * @param {Date} date
 * @return {Array<{start: Date, end: Date}>}
 */
export const calculateTimeSlots = (bookingSlotSettings, date) => {
  if (!date || !bookingSlotSettings) return [];

  const { startTime, endTime, slotDuration } = bookingSlotSettings;
  const startOfDay = parse(startTime, 'HH:mm', date);
  const endOfDay = parse(endTime, 'HH:mm', date);
  const durationMinutes = ms(slotDuration) / 60_000; // In minutes

  const slotCount = differenceInMinutes(endOfDay, startOfDay) / durationMinutes;
  const slots = [];
  for (let i = 0; i < slotCount; i++) {
    const start = addMinutes(startOfDay, i * durationMinutes);
    const end = addMinutes(start, durationMinutes);
    slots.push({ start, end });
  }

  return slots;
};
