export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;

export const getTriageStartTime = ({ arrivalTime, triageTime }) => arrivalTime || triageTime;

export const getElapsedMillisecondsSince = (storedDateTime, storedDateTimeToEpochMilliseconds) => {
  const startMs = storedDateTimeToEpochMilliseconds(storedDateTime);
  if (startMs == null) return null;
  return Date.now() - startMs;
};

export const getTriageWaitTime = (triage, storedDateTimeToEpochMilliseconds) =>
  getElapsedMillisecondsSince(getTriageStartTime(triage), storedDateTimeToEpochMilliseconds);

export const splitDurationHoursMinutes = durationMs => {
  const hours = Math.floor(durationMs / HOUR);
  const minutes = Math.floor((durationMs - hours * HOUR) / MINUTE);
  return { hours, minutes };
};
