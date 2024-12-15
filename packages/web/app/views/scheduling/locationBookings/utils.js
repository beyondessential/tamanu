import { eachDayOfInterval, isSameDay, isValid, parseISO } from 'date-fns';

import { toDateString } from '@tamanu/shared/utils/dateTime';

import { THIS_WEEK_ID } from './LocationBookingsCalendarHeader';
import { LOCATION_BOOKINGS_CALENDAR_ID } from './LocationBookingsView';

export const appointmentToFormValues = appointment => {
  if (!appointment) return {};

  const { bookingTypeId, clinicianId, id, locationId, patientId } = appointment;
  const startTime = appointment.startTime ? new Date(appointment.startTime) : null;
  const endTime = appointment.endTime ? new Date(appointment.endTime) : null;

  const startIsValidDate = isValid(startTime);
  const endIsValidDate = isValid(endTime);

  const startDate = startIsValidDate ? toDateString(startTime) : null;
  const endDate = endIsValidDate ? toDateString(endTime) : null;
  const overnight = endIsValidDate && !isSameDay(startTime, endTime);

  return {
    // Semantically significant values
    locationId,
    patientId,
    startTime,
    endTime,
    bookingTypeId,
    clinicianId,

    // Only for user input purposes
    overnight,
    date: startDate,
    startDate,
    endDate,

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
