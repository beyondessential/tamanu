import { ADMINISTRATION_STATUS } from '@tamanu/constants';

import { getIsPast } from './useMarDoseTiming';
import { getIsDiscontinued, getIsEnd, getIsPaused } from './useMarStatusFlags';

/**
 * Whether MarDoseStatusIcon would render a given / not-given / missed icon.
 * Pending is intentionally excluded (not shown yet).
 *
 * @param {{
 *   marInfo?: object | null;
 *   isDiscontinued?: boolean;
 *   isEnd?: boolean;
 *   isPast?: boolean;
 *   isPaused?: boolean;
 *   isPrn?: boolean;
 * }} props
 */
export function hasVisibleMarStatusIcon({
  marInfo,
  isDiscontinued,
  isEnd,
  isPast,
  isPaused,
  isPrn,
}) {
  const { status } = marInfo || {};
  if (!marInfo || isEnd || isDiscontinued || (!status && isPaused)) return false;

  if (status === ADMINISTRATION_STATUS.GIVEN || status === ADMINISTRATION_STATUS.NOT_GIVEN) {
    return true;
  }

  if (!status && isPast && !isPrn) return true;

  return false;
}

export default function getShowDoseInfo({
  marInfo,
  medication,
  timeSlot,
  selectedDate,
  nextMarInfo,
  pauseRecords,
  now,
  toFacilityDateTime,
  storedDateTimeToEpochMilliseconds,
}) {
  const { recordedAt, status } = marInfo || {};
  const { dosingUnit, discontinuedDate, endDate } = medication || {};

  if (!marInfo || status || !dosingUnit) return false;

  const isPast = getIsPast({ timeSlot, selectedDate, now });
  if (isPast) return false;

  const isDiscontinued = getIsDiscontinued({
    discontinuedDate,
    dueAt: marInfo.dueAt,
    isRecordedStatus: Boolean(recordedAt),
    timeSlot,
    selectedDate,
    nextMarInfo,
    toFacilityDateTime,
    storedDateTimeToEpochMilliseconds,
  });
  if (isDiscontinued) return false;

  const isEnd = getIsEnd({
    endDate,
    hasRecord: Boolean(marInfo),
    timeSlot,
    selectedDate,
    toFacilityDateTime,
  });
  if (isEnd) return false;

  const isPaused = getIsPaused({
    pauseRecords: pauseRecords?.data,
    timeSlot,
    selectedDate,
    recordedAt,
    toFacilityDateTime,
  });
  if (isPaused) return false;

  return true;
}
