import { addHours, isSameDay } from 'date-fns';

import { getDateFromTimeString } from '@tamanu/shared/utils/medication';
import { useDateTime } from '@tamanu/ui-components';

export function getIsPast({ timeSlot, selectedDate, now }) {
  const slotEndDate = getDateFromTimeString(timeSlot.endTime, selectedDate);
  return now > slotEndDate;
}

export function getIsCurrent({ timeSlot, selectedDate, now }) {
  const slotStartDate = getDateFromTimeString(timeSlot.startTime, selectedDate);
  const slotEndDate = getDateFromTimeString(timeSlot.endTime, selectedDate);
  return now >= slotStartDate && now < slotEndDate;
}

export function getIsNotDue({ hasRecord, timeSlot, selectedDate, now }) {
  const slotStartDate = getDateFromTimeString(timeSlot.startTime, selectedDate);
  if (!hasRecord || !isSameDay(selectedDate, now)) {
    return slotStartDate > now;
  }
  return slotStartDate > addHours(now, 2);
}

/**
 * Slot timing relative to facility now. `timeSlot` should be the dose sub-slot.
 * @param {Object} props
 * @param {{ startTime: string, endTime: string }} props.timeSlot
 * @param {Date} props.selectedDate
 * @param {boolean} props.hasRecord
 */
export function useMarDoseTiming({ timeSlot, selectedDate, hasRecord }) {
  const { getFacilityNowDate } = useDateTime();
  const facilityNow = getFacilityNowDate();

  return {
    isPast: getIsPast({ timeSlot, selectedDate, now: facilityNow }),
    isNotDue: getIsNotDue({ hasRecord, timeSlot, selectedDate, now: facilityNow }),
    isFuture: getDateFromTimeString(timeSlot.startTime, selectedDate) > facilityNow,
    isCurrent: getIsCurrent({ timeSlot, selectedDate, now: facilityNow }),
  };
}
