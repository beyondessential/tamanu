import { eachDayOfInterval, isSameDay, isValid, parseISO } from 'date-fns';

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

export const partitionAppointmentsByDate = appointments =>
  appointments.reduce((acc, appt) => {
    const start = parseISO(appt.startTime);
    const end = parseISO(appt.endTime);

    const dates = appt.endTime
      ? eachDayOfInterval({ start, end }).map(toDateString)
      : [appt.startTime.slice(0, 10)]; // Slice out datestring without converting to Date and back
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
