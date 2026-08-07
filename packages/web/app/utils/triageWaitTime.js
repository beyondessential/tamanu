export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

export const getTriageStartTime = ({ arrivalTime, triageTime }) => arrivalTime || triageTime;

export const getElapsedMillisecondsSince = (
  storedDateTime,
  storedDateTimeToEpochMilliseconds,
  now = Date.now(),
) => {
  const startMs = storedDateTimeToEpochMilliseconds(storedDateTime);
  if (startMs == null) return null;
  return now - startMs;
};

export const getTriageWaitTime = (triage, storedDateTimeToEpochMilliseconds, now) =>
  getElapsedMillisecondsSince(getTriageStartTime(triage), storedDateTimeToEpochMilliseconds, now);

export const splitDurationHoursMinutes = durationMs => {
  const hours = Math.floor(durationMs / HOUR);
  const minutes = Math.floor((durationMs % HOUR) / MINUTE);
  return { hours, minutes };
};
