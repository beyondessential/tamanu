import { getDateFromTimeString } from '@tamanu/shared/utils/medication';
import { useDateTime } from '@tamanu/ui-components';

const toFacilityDate = (dateStr, toFacilityDateTime) => {
  if (!dateStr) return null;
  const facilityStr = toFacilityDateTime(dateStr);
  return new Date(facilityStr ?? dateStr);
};

/**
 * @param {Object} props
 * @param {string} [props.endDate]
 * @param {boolean} props.hasRecord
 * @param {{ startTime: string, endTime: string }} props.timeSlot
 * @param {Date} props.selectedDate
 */
export function useIsEnd({ endDate, hasRecord, timeSlot, selectedDate }) {
  const { toFacilityDateTime } = useDateTime();
  if (hasRecord) return false;

  const endDateOfSlot = getDateFromTimeString(timeSlot.endTime, selectedDate);
  const endDateFacility = toFacilityDate(endDate, toFacilityDateTime);
  if (!endDateFacility) return false;
  return endDateFacility < endDateOfSlot;
}

/**
 * @param {Object} props
 * @param {string} [props.discontinuedDate]
 * @param {string} [props.dueAt]
 * @param {boolean} props.isRecordedStatus
 * @param {{ startTime: string, endTime: string }} props.timeSlot
 * @param {Date} props.selectedDate
 * @param {{ status?: string } | null | undefined} props.nextMarInfo
 */
export function useIsDiscontinued({
  discontinuedDate,
  dueAt,
  isRecordedStatus,
  timeSlot,
  selectedDate,
  nextMarInfo,
}) {
  const { toFacilityDateTime, storedDateTimeToEpochMilliseconds } = useDateTime();
  if (isRecordedStatus || !discontinuedDate || nextMarInfo?.status) return false;

  if (dueAt) {
    const dueAtMs = storedDateTimeToEpochMilliseconds(dueAt);
    const discontinuedDateMs = storedDateTimeToEpochMilliseconds(discontinuedDate);
    // Fail-open: if dates can't be parsed, assume not discontinued to avoid blocking medication administration
    if (dueAtMs == null || discontinuedDateMs == null) return false;
    return dueAtMs > discontinuedDateMs;
  }

  const endDateOfSlot = getDateFromTimeString(timeSlot.endTime, selectedDate);
  return toFacilityDate(discontinuedDate, toFacilityDateTime) < endDateOfSlot;
}

/**
 * @param {Object} props
 * @param {Array} [props.pauseRecords]
 * @param {{ startTime: string, endTime: string } | null | undefined} props.timeSlot
 * @param {Date} props.selectedDate
 * @param {string} [props.recordedAt]
 */
export function useIsPaused({ pauseRecords, timeSlot, selectedDate, recordedAt }) {
  const { toFacilityDateTime } = useDateTime();
  if (!timeSlot || !pauseRecords?.length) return false;

  const endDateOfSlot = getDateFromTimeString(timeSlot.endTime, selectedDate);

  return pauseRecords.some(pauseRecord => {
    const pauseStartDate = toFacilityDate(pauseRecord.pauseStartDate, toFacilityDateTime);

    if (recordedAt && toFacilityDate(recordedAt, toFacilityDateTime) <= pauseStartDate) {
      return false;
    }

    const pauseEndDate = toFacilityDate(pauseRecord.pauseEndDate, toFacilityDateTime);
    return pauseStartDate < endDateOfSlot && pauseEndDate >= endDateOfSlot;
  });
}

/**
 * @param {Object} props
 * @param {boolean} props.isPreviouslyPaused
 * @param {boolean} props.isDiscontinued
 * @param {{ startTime: string, endTime: string }} props.timeSlot
 * @param {Date} props.selectedDate
 * @param {string} [props.discontinuedDate]
 */
export function useIsPausedThenDiscontinued({
  isPreviouslyPaused,
  isDiscontinued,
  timeSlot,
  selectedDate,
  discontinuedDate,
}) {
  const { toFacilityDateTime } = useDateTime();
  if (!isPreviouslyPaused || !isDiscontinued) return false;
  const startDateOfSlot = getDateFromTimeString(timeSlot.startTime, selectedDate);
  return toFacilityDate(discontinuedDate, toFacilityDateTime) >= startDateOfSlot;
}
