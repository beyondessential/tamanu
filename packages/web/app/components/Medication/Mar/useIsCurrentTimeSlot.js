import { isSameDay } from 'date-fns';

import { getDateFromTimeString } from '@tamanu/shared/utils/medication';
import { useDateTime } from '@tamanu/ui-components';

/**
 * @param {Object} props
 * @param {`${number}:${number}`} props.startTime - Time slot start in HH:mm format
 * @param {`${number}:${number}`} props.endTime - Time slot end in HH:mm format
 * @param {Date} props.selectedDate - Calendar date shown in the MAR
 */
export function useIsCurrentTimeSlot({ startTime, endTime, selectedDate }) {
  const { getFacilityNowDate } = useDateTime();
  const facilityNow = getFacilityNowDate();
  const now = facilityNow.getTime();
  const startDate = getDateFromTimeString(startTime, facilityNow).getTime();
  const endDate = getDateFromTimeString(endTime, facilityNow).getTime();
  return startDate <= now && now <= endDate && isSameDay(selectedDate, facilityNow);
}
