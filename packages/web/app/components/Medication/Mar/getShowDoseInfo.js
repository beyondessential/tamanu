import { getIsPast } from './useMarDoseTiming';
import { getIsDiscontinued, getIsEnd, getIsPaused } from './useMarStatusFlags';

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
