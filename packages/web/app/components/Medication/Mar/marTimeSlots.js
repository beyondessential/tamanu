import {
  ADMINISTRATION_FREQUENCY_DETAILS,
  MEDICATION_ADMINISTRATION_TIME_SLOTS,
} from '@tamanu/constants';
import {
  findAdministrationTimeSlotFromIdealTime,
  getDateFromTimeString,
} from '@tamanu/shared/utils/medication';

/** @typedef {{ startTime: string, endTime: string }} MarTimeSlot */

/**
 * Number of doses that land in each 2-hour MAR column for a frequency.
 * HOURLY → 2, HALF_HOURLY → 4, everything else → 1.
 */
export function getDosesPerSlot(frequency) {
  const dosesPerDay = ADMINISTRATION_FREQUENCY_DETAILS[frequency]?.dosesPerDay ?? 1;
  return Math.max(1, Math.round(dosesPerDay / 12));
}

const timeToMinutes = timeStr => {
  if (timeStr === '24:00') return 1440; // 24 × 60;
  const [hh, mm] = timeStr.split(':').map(part => Number.parseInt(part, 10));
  return hh * 60 + mm;
};

const formatHHmm = date => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  // getDateFromTimeString('24:00') lands on next-day 00:00
  if (hours === 0 && minutes === 0 && date.getDate() !== 1) {
    return '24:00';
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Split a 2-hour MAR window into equal sub-slots (1 / 2 / 4).
 *
 * @param {MarTimeSlot} timeSlot
 * @param {number} dosesPerSlot
 * @returns {MarTimeSlot[]}
 */
export function getSubSlots(timeSlot, dosesPerSlot) {
  if (dosesPerSlot <= 1) {
    return [{ startTime: timeSlot.startTime, endTime: timeSlot.endTime }];
  }

  const baseDate = new Date(2000, 0, 1);
  const start = getDateFromTimeString(timeSlot.startTime, baseDate);
  const end = getDateFromTimeString(timeSlot.endTime, baseDate);
  const stepMs = (end.getTime() - start.getTime()) / dosesPerSlot;

  return Array.from({ length: dosesPerSlot }, (_, i) => {
    const subStart = new Date(start.getTime() + i * stepMs);
    const subEnd = new Date(start.getTime() + (i + 1) * stepMs);
    return {
      startTime: formatHHmm(subStart),
      // Preserve the parent window's endTime on the last sub-slot (e.g. '24:00')
      endTime: i === dosesPerSlot - 1 ? timeSlot.endTime : formatHHmm(subEnd),
    };
  });
}

/**
 * @param {string} facilityTime HH:mm
 * @param {MarTimeSlot[]} subSlots
 * @returns {number}
 */
export function findSubSlotIndex(facilityTime, subSlots) {
  const t = timeToMinutes(facilityTime);
  for (let i = 0; i < subSlots.length; i++) {
    const start = timeToMinutes(subSlots[i].startTime);
    const end = timeToMinutes(subSlots[i].endTime);
    if (t >= start && t < end) return i;
  }
  return -1;
}

/**
 * Map MAR records into a length-12 array of dose arrays (one entry per sub-slot).
 *
 * @param {{ dueAt: string, id?: string }[]} [medicationAdministrationRecords]
 * @param {(date: string) => string | null | undefined} toFacilityDateTime
 * @param {number} dosesPerSlot
 * @returns {(({ dueAt: string, id?: string } | null)[])[]}
 */
export function mapRecordsToWindows(
  medicationAdministrationRecords = [],
  toFacilityDateTime,
  dosesPerSlot = 1,
) {
  const result = Array.from({ length: MEDICATION_ADMINISTRATION_TIME_SLOTS.length }, () =>
    Array(dosesPerSlot).fill(null),
  );

  for (const record of medicationAdministrationRecords) {
    const facilityDueAt = toFacilityDateTime(record.dueAt);
    const facilityTime = facilityDueAt?.split('T')[1]?.substring(0, 5);
    if (!facilityTime) continue;

    const { index: windowIndex, timeSlot } = findAdministrationTimeSlotFromIdealTime(facilityTime);
    if (windowIndex < 0 || !timeSlot) continue;

    const subSlots = getSubSlots(timeSlot, dosesPerSlot);
    const subIndex = findSubSlotIndex(facilityTime, subSlots);
    if (subIndex < 0) continue;

    result[windowIndex][subIndex] = record;
  }

  return result;
}

/**
 * Ideal due datetime for a dose sub-slot (start of the sub-slot on selectedDate).
 *
 * @param {MarTimeSlot} subSlot
 * @param {Date} selectedDate
 * @returns {Date}
 */
export function getSubSlotDueAt(subSlot, selectedDate) {
  return getDateFromTimeString(subSlot.startTime, selectedDate);
}
