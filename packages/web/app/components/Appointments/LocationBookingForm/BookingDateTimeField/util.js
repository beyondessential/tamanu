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

/** @return {Array<{start: Date, end: Date}>} */
export const calculateTimeSlots = (bookingSlotSettings, date) => {
  if (!date || !bookingSlotSettings) return [];

  const { startTime, endTime, slotDuration } = bookingSlotSettings;
  const startOfDay = parse(startTime, 'HH:mm', new Date(date));
  const endOfDay = parse(endTime, 'HH:mm', new Date(date));
  const durationMinutes = ms(slotDuration) / 60_000; // In minutes

  const totalSlots = differenceInMinutes(endOfDay, startOfDay) / durationMinutes;
  const slots = [];
  for (let i = 0; i < totalSlots; i++) {
    const start = addMinutes(startOfDay, i * durationMinutes);
    const end = addMinutes(start, durationMinutes);
    slots.push({ start, end });
  }

  return slots;
};
