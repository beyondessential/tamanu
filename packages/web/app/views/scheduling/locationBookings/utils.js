import { isSameDay, isValid, startOfDay } from 'date-fns';

export const appointmentToFormValues = appointment => {
  if (!appointment) return {};

  const { bookingTypeId, clinicianId, id, locationId, patientId } = appointment;
  const startTime = appointment.startTime ? new Date(appointment.startTime) : null;
  const endTime = appointment.endTime ? new Date(appointment.endTime) : null;

  const startIsValidDate = isValid(startTime);
  const endIsValidDate = isValid(endTime);

  const startDate = startIsValidDate ? startOfDay(startTime) : null;
  const endDate = endIsValidDate ? startOfDay(endTime) : null;
  const overnight = endIsValidDate && !isSameDay(startDate, endDate);

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
    (acc[locationId] || (acc[locationId] = [])).push(appt);
    return acc;
  }, {});

// TODO: Don’t just use start time
export const partitionAppointmentsByDate = appointments =>
  appointments.reduce((acc, appt) => {
    const date = appt.startTime.slice(0, 10); // Slice out ISO date, no time
    (acc[date] || (acc[date] = [])).push(appt);
    return acc;
  }, {});
