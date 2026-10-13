/** A time entered as hour (1–12), minute and am/pm, as `HH:mm:ss`, or null if incomplete. */
export const toTimeString = ({ hour, minute, period }) => {
  if (!/^\d{1,2}$/.test(hour) || !/^\d{1,2}$/.test(minute) || !period) return null;
  const hourNumber = Number(hour);
  const minuteNumber = Number(minute);
  if (hourNumber < 1 || hourNumber > 12 || minuteNumber > 59) return null;
  const hour24 = (hourNumber % 12) + (period === 'pm' ? 12 : 0);
  return `${String(hour24).padStart(2, '0')}:${String(minuteNumber).padStart(2, '0')}:00`;
};

/** The hour, minute and am/pm parts of an `HH:mm` or `HH:mm:ss` time. */
export const toTimeParts = timeString => {
  const match = /^(\d{2}):(\d{2})/.exec(timeString ?? '');
  if (!match) return { hour: '', minute: '', period: '' };
  const hour24 = Number(match[1]);
  return {
    hour: String(hour24 % 12 || 12),
    minute: match[2],
    period: hour24 < 12 ? 'am' : 'pm',
  };
};
