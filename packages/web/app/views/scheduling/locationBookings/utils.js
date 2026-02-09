import { eachDayOfInterval, isSameDay, isValid } from 'date-fns';

import { toDateString } from '@tamanu/utils/dateTime';

import { THIS_WEEK_ID } from './LocationBookingsCalendarHeader';
import { LOCATION_BOOKINGS_CALENDAR_ID } from './LocationBookingsView';

export const appointmentToFormValues = appointment => {
  if (!appointment) return {};

  const {
    bookingTypeId,
    clinicianId,
    endTime,
    id,
    locationId,
    patientId,
    startDate,
    startTime,
    additionalClinicianId,
    appointmentProcedureTypes,
    linkEncounterId,
  } = appointment;
  const startTimeObj = startTime ? new Date(startTime) : null;
  const endTimeObj = endTime ? new Date(endTime) : null;

  const startIsValid = isValid(startTimeObj);
  const endIsValid = isValid(endTimeObj);

  const dateFromStartTime = toDateString(startTimeObj);
  const dateFromEndTime = toDateString(endTimeObj);
  const overnight = startIsValid && endIsValid && !isSameDay(startTimeObj, endTimeObj);

  return {
    // Semantically significant values
    locationId,
    patientId,
    startTime: startIsValid ? startTime : null,
    endTime: endIsValid ? endTime : null,
    bookingTypeId,
    clinicianId,
    additionalClinicianId,
    procedureTypeIds: appointmentProcedureTypes?.map(type => type.procedureTypeId) || [],
    linkEncounterId,
    // Only for user input purposes
    overnight,
    date: dateFromStartTime ?? startDate,
    startDate: dateFromStartTime ?? startDate,
    endDate: dateFromEndTime,

    // Determines whether location booking drawer should open in CREATE or EDIT mode
    id,
  };
};

/** Record<LocationId, Record<Date, Appointment> */
export const partitionAppointmentsByLocation = appointments =>
  appointments.reduce((acc, appt) => {
    const locationId = appt.locationId;
    (acc[locationId] ?? (acc[locationId] = [])).push(appt);
    return acc;
  }, {});

export const partitionAppointmentsByDate = (appointments, formatForDateTimeInput) =>
  appointments.reduce((acc, appt) => {
    const startStr = formatForDateTimeInput?.(appt.startTime);
    if (!startStr) return acc;
    const startDate = startStr.slice(0, 10);

    const endStr = appt.endTime ? formatForDateTimeInput(appt.endTime) : null;
    const endDate = endStr?.slice(0, 10);

    const dates =
      endDate && endDate !== startDate
        ? eachDayOfInterval({
            start: new Date(`${startDate}T00:00:00`),
            end: new Date(`${endDate}T00:00:00`),
          }).map(toDateString)
        : [startDate];
    for (const date of dates) (acc[date] ?? (acc[date] = [])).push(appt);

    return acc;
  }, {});

export const generateIdFromCell = cell => `${cell.locationId}.${cell.date.valueOf()}`;

export const scrollToThisWeek = scrollIntoViewOptions =>
  document
    .getElementById(THIS_WEEK_ID)
    ?.scrollIntoView({ inline: 'start', ...scrollIntoViewOptions });

export const scrollToBeginning = scrollToOptions =>
  document.getElementById(LOCATION_BOOKINGS_CALENDAR_ID)?.scroll({ left: 0, ...scrollToOptions });

export const scrollToCell = (cell, scrollIntoViewOptions) =>
  document
    .getElementById(generateIdFromCell(cell))
    ?.scrollIntoView({ inline: 'start', ...scrollIntoViewOptions });
