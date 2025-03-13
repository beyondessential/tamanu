import { MEDICATION_ADMINISTRATION_TIME_SLOTS } from '@tamanu/constants';
import { formatTime } from '@tamanu/utils/dateTime';
import { add, parseISO, set } from 'date-fns';

export const findAdministrationTimeSlotFromIdealTime = (idealTime) => {
  const index = MEDICATION_ADMINISTRATION_TIME_SLOTS.findIndex((slot) => {
    const startDate = getDateFromTimeString(slot.startTime).getTime();
    const endDate = getDateFromTimeString(slot.endTime).getTime();
    const idealDate = getDateFromTimeString(idealTime).getTime();

    return (
      idealDate >= startDate && idealDate < endDate && idealDate - startDate < endDate - startDate
    );
  });

  const timeSlot = MEDICATION_ADMINISTRATION_TIME_SLOTS[index];
  return {
    index,
    timeSlot,
    value: idealTime,
  };
};

export const getDateFromTimeString = (time, initialDate = new Date()) => {
  const parsedTime = time.split(':');
  const hour = parseInt(parsedTime[0]);
  const minute = parseInt(parsedTime[1]) || 0;
  return set(initialDate, { hours: hour, minutes: minute, seconds: 0 });
};

export const formatTimeSlot = (time) => {
  return formatTime(time).replaceAll(' ', '').toLowerCase();
};

export const getEndDate = (startDate, durationValue, durationUnit) => {
  const parsedStartDate = parseISO(startDate);
  const duration = parseInt(durationValue, 10);
  return add(parsedStartDate, { [durationUnit]: duration });
};

export const getTimeSlotFromDate = (date = new Date()) => {
  const time = date.getTime();
  const timeSlot = MEDICATION_ADMINISTRATION_TIME_SLOTS.find(({ startTime, endTime }) => {
    const startDate = getDateFromTimeString(startTime).getTime();
    const endDate = getDateFromTimeString(endTime).getTime();
    return startDate <= time && time <= endDate;
  });
  return timeSlot;
};
