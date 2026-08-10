import { ADMINISTRATION_STATUS } from '@tamanu/constants';

import { getIsPast } from './useMarDoseTiming';
import { getIsDiscontinued, getIsEnd, getIsPaused } from './useMarStatusFlags';

/**
 * Which icon MarDoseStatus renders for a dose, if any.
 *
 * @param {{
 *   marInfo?: object | null;
 *   isDiscontinued?: boolean;
 *   isEnd?: boolean;
 *   isPast?: boolean;
 *   isPaused?: boolean;
 *   isPrn?: boolean;
 * }} props
 * @returns {typeof ADMINISTRATION_STATUS[keyof typeof ADMINISTRATION_STATUS] | 'missed' | 'pending' | null}
 */
export function getMarStatusIconVariant({
  marInfo,
  isDiscontinued,
  isEnd,
  isPast,
  isPaused,
  isPrn,
}) {
  const { status } = marInfo || {};
  if (!marInfo || isEnd || isDiscontinued || (!status && isPaused)) return null;

  if (status === ADMINISTRATION_STATUS.GIVEN || status === ADMINISTRATION_STATUS.NOT_GIVEN) {
    return status;
  }

  if (isPast) return isPrn ? null : 'missed';

  return 'pending';
}

/**
 * Whether a dose renders an icon that the cell always shows. Pending is excluded: CSS reveals it
 * only in a sub-divided current-time cell, where the same rule hides the dose info overlay anyway.
 *
 * @param {Parameters<typeof getMarStatusIconVariant>[0]} props
 */
export function hasVisibleMarStatusIcon(props) {
  const variant = getMarStatusIconVariant(props);
  return variant !== null && variant !== 'pending';
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
