import { MEDICATION_ADMINISTRATION_TIME_SLOTS } from '~/constants/medications';
import { addDays, format, isSameDay, set } from 'date-fns';

export const getDateFromTimeString = (
  time: `${number}:${number}` | Date,
  initialDate = new Date(),
) => {
  const asString =
    typeof time !== 'string' || !time?.includes?.(':') ? format(new Date(time), 'HH:mm') : time;
  const [hh, mm] = asString.split(':');
  const hour = Number.parseInt(hh);
  const minute = Number.parseInt(mm) || 0;
  return set(initialDate, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });
};

export const findAdministrationTimeSlotFromIdealTime = <T extends `${number}:${number}` | Date>(
  idealTime: T,
) => {
  const ideal = getDateFromTimeString(idealTime).getTime();
  const index = MEDICATION_ADMINISTRATION_TIME_SLOTS.findIndex(slot => {
    const start = getDateFromTimeString(slot.startTime).getTime();
    if (ideal < start) return false;
    const end = getDateFromTimeString(slot.endTime).getTime();
    return ideal < end && ideal - start < end - start;
  });

  return {
    index,
    timeSlot: MEDICATION_ADMINISTRATION_TIME_SLOTS[index],
    value: idealTime,
  };
};

export const areDatesInSameTimeSlot = (date1: Date, date2: Date) => {
  if (!isSameDay(date1, date2)) {
    return false;
  }
  const slot1 = findAdministrationTimeSlotFromIdealTime(date1);
  const slot2 = findAdministrationTimeSlotFromIdealTime(date2);
  return slot1.index === slot2.index;
};

export const getFirstAdministrationDate = (
  startDate: Date,
  idealTimes: `${number}:${number}`[],
) => {
  const firstStartTime = idealTimes
    .map(idealTime => getDateFromTimeString(idealTime, startDate))
    .concat(idealTimes.map(idealTime => getDateFromTimeString(idealTime, addDays(startDate, 1))))
    .filter(
      idealTime =>
        idealTime.getTime() > startDate.getTime() || areDatesInSameTimeSlot(startDate, idealTime),
    )
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return firstStartTime;
};
