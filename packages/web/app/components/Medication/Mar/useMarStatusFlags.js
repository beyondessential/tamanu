/** @typedef {import('@tamanu/constants').MedicationAdministrationTimeSlot} MedicationAdministrationTimeSlot */

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
 * @param {{ endTime: string }} props.timeSlot
 * @param {Date} props.selectedDate
 * @param {(date: string) => string | null | undefined} props.toFacilityDateTime
 */
export function getIsEnd({ endDate, hasRecord, timeSlot, selectedDate, toFacilityDateTime }) {
  if (hasRecord) return false;

  const endDateOfSlot = getDateFromTimeString(timeSlot.endTime, selectedDate);
  const endDateFacility = toFacilityDate(endDate, toFacilityDateTime);
  if (!endDateFacility) return false;
  return endDateFacility < endDateOfSlot;
}

/**
 * @param {Object} props
 * @param {string} [props.endDate]
 * @param {boolean} props.hasRecord
 * @param {MedicationAdministrationTimeSlot} props.timeSlot
 * @param {Date} props.selectedDate
 */
export function useIsEnd({ endDate, hasRecord, timeSlot, selectedDate }) {
  const { toFacilityDateTime } = useDateTime();
  return getIsEnd({ endDate, hasRecord, timeSlot, selectedDate, toFacilityDateTime });
}

/**
 * @param {Object} props
 * @param {string} [props.discontinuedDate]
 * @param {string} [props.dueAt]
 * @param {boolean} props.isRecordedStatus
 * @param {{ endTime: string }} props.timeSlot
 * @param {Date} props.selectedDate
 * @param {{ status?: string } | null | undefined} props.nextMarInfo
 * @param {(date: string) => string | null | undefined} props.toFacilityDateTime
 * @param {(date: string) => number | null | undefined} props.storedDateTimeToEpochMilliseconds
 */
export function getIsDiscontinued({
  discontinuedDate,
  dueAt,
  isRecordedStatus,
  timeSlot,
  selectedDate,
  nextMarInfo,
  toFacilityDateTime,
  storedDateTimeToEpochMilliseconds,
}) {
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
 * @param {string} [props.discontinuedDate]
 * @param {string} [props.dueAt]
 * @param {boolean} props.isRecordedStatus
 * @param {MedicationAdministrationTimeSlot} props.timeSlot
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
  return getIsDiscontinued({
    discontinuedDate,
    dueAt,
    isRecordedStatus,
    timeSlot,
    selectedDate,
    nextMarInfo,
    toFacilityDateTime,
    storedDateTimeToEpochMilliseconds,
  });
}

/**
 * @param {Object} props
 * @param {Array} [props.pauseRecords]
 * @param {{ endTime: string } | null | undefined} props.timeSlot
 * @param {Date} props.selectedDate
 * @param {string} [props.recordedAt]
 * @param {(date: string) => string | null | undefined} props.toFacilityDateTime
 */
export function getIsPaused({ pauseRecords, timeSlot, selectedDate, recordedAt, toFacilityDateTime }) {
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
 * @param {Array} [props.pauseRecords]
 * @param {(typeof MEDICATION_ADMINISTRATION_TIME_SLOTS)[number] | null | undefined} props.timeSlot
 * @param {Date} props.selectedDate
 * @param {string} [props.recordedAt]
 */
export function useIsPaused({ pauseRecords, timeSlot, selectedDate, recordedAt }) {
  const { toFacilityDateTime } = useDateTime();
  return getIsPaused({ pauseRecords, timeSlot, selectedDate, recordedAt, toFacilityDateTime });
}

/**
 * Composed schedule-lifecycle flags for a MAR dose cell (end / discontinued / paused).
 * @param {Object} props
 * @param {Object} [props.medication]
 * @param {Object} [props.marInfo]
 * @param {Object} [props.nextMarInfo]
 * @param {{ startTime: string, endTime: string }} props.timeSlot
 * @param {Date} props.selectedDate
 * @param {{ data?: Array }} [props.pauseRecords]
 */
export function useMarDoseScheduleStatus({
  medication,
  marInfo,
  nextMarInfo,
  timeSlot,
  selectedDate,
  pauseRecords,
}) {
  const { discontinuedDate, endDate } = medication || {};
  const { dueAt, recordedAt } = marInfo || {};

  const isDiscontinued = useIsDiscontinued({
    discontinuedDate,
    dueAt,
    isRecordedStatus: Boolean(recordedAt),
    timeSlot,
    selectedDate,
    nextMarInfo,
  });
  const isEnd = useIsEnd({
    endDate,
    hasRecord: Boolean(marInfo),
    timeSlot,
    selectedDate,
  });
  const isPaused = useIsPaused({
    pauseRecords: pauseRecords?.data,
    timeSlot,
    selectedDate,
    recordedAt,
  });

  return { isDiscontinued, isEnd, isPaused };
}
