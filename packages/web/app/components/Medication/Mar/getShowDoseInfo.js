import { ADMINISTRATION_STATUS } from '@tamanu/constants';

import { getIsPast } from './useMarDoseTiming';
import { getIsDiscontinued, getIsEnd, getIsPaused } from './useMarStatusFlags';

/**
 * Whether a record's due time falls before the prescription actually starts. The server generates
 * a record for an ideal time earlier than the prescription start when both fall within the same
 * administration window, so a dose can still be logged against it — but no dose is due, so the
 * sub-slot should stay empty until a status is recorded.
 *
 * @param {{
 *   dueAt?: string;
 *   startDate?: string;
 *   storedDateTimeToEpochMilliseconds: (date: string) => number | null | undefined;
 * }} props
 */
export function getIsDueBeforePrescriptionStart({
  dueAt,
  startDate,
  storedDateTimeToEpochMilliseconds,
}) {
  if (!dueAt || !startDate) return false;
  const dueAtMs = storedDateTimeToEpochMilliseconds(dueAt);
  const startDateMs = storedDateTimeToEpochMilliseconds(startDate);
  // Fail-open: if dates can't be parsed, treat the dose as due rather than silently hiding it
  if (dueAtMs == null || startDateMs == null) return false;
  return dueAtMs < startDateMs;
}

/**
 * Which icon MarDoseStatus renders for a dose, if any.
 *
 * @param {{
 *   marInfo?: object | null;
 *   isDiscontinued?: boolean;
 *   isDueBeforePrescriptionStart?: boolean;
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
  isDueBeforePrescriptionStart,
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

  // No dose is actually due yet, so the sub-slot is neither missed nor pending
  if (isDueBeforePrescriptionStart) return null;

  if (isPast) return isPrn ? null : 'missed';

  return 'pending';
}

/**
 * Whether a dose renders an icon that the cell always shows. Pending is excluded: the dose info
 * overlay stays visible over pending-only cells, and CSS reveals pending icons only once the
 * overlay is hidden (see the data-overlay-visible attribute in MarDoseInfoOverlay).
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
